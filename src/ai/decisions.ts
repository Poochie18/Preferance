import type { Bid, SuitBid, TrumpOption } from '../engine/model/bid';
import type { Card } from '../engine/model/card';
import type { PlayerView, WhistDecision } from '../engine/model/gameState';
import { trumpSuitOf } from '../engine/rules/trick';
import { estimateDefensiveTricks, estimateTricks, misereDangerCards } from './handEvaluation';

export interface DecisionOptions {
  /** Tricks the talon is expected to add, on top of the hand's own estimate, when bidding. */
  talonBonus: number;
  allowMisere: boolean;
  allowNoTrump: boolean;
}

const TRUMPS: TrumpOption[] = ['♠', '♣', '♦', '♥', 'nt'];

/** Misère needs a hand that can duck everything (talon discards fix at most one bad card)… */
const MAX_MISERE_DANGER = 1;
/** …and one that isn't worth a real contract instead. */
const MISERE_MAX_TRICKS = 5;

function isMisere(bid: Bid): boolean {
  return bid.kind === 'misere' || bid.kind === 'misere-ouvert';
}

/**
 * Bids as low as the auction allows in the strongest denomination the hand supports,
 * and passes once the auction goes beyond what the hand is expected to take.
 */
export function decideBid(view: PlayerView, legalBids: Bid[], opts: DecisionOptions): Bid | 'pass' {
  const hand = view.myHand;
  const phase = view.phase;
  const myBids = phase.tag === 'bidding' ? phase.bids.filter((b) => b.player === view.viewer && b.bid !== 'pass') : [];
  // Having said misère, there's no switching to a contract.
  if (myBids.some((b) => b.bid !== 'pass' && isMisere(b.bid))) return 'pass';

  const estimate = Object.fromEntries(TRUMPS.map((t) => [t, estimateTricks(hand, t)])) as Record<TrumpOption, number>;
  const strongest = Math.max(...TRUMPS.map((t) => estimate[t]));

  // Misère only as the first bid, as the rules require.
  if (
    opts.allowMisere &&
    myBids.length === 0 &&
    strongest < MISERE_MAX_TRICKS &&
    misereDangerCards(hand) <= MAX_MISERE_DANGER &&
    legalBids.some((b) => b.kind === 'misere')
  ) {
    return { kind: 'misere' };
  }

  const maxLevel = (t: TrumpOption) => (t === 'nt' && !opts.allowNoTrump ? 0 : Math.floor(estimate[t] + opts.talonBonus));
  const supported = legalBids.filter((b): b is SuitBid => b.kind === 'suit' && b.level <= maxLevel(b.trump));
  if (supported.length === 0) return 'pass';

  const best = TRUMPS.reduce((a, b) =>
    maxLevel(b) > maxLevel(a) || (maxLevel(b) === maxLevel(a) && estimate[b] > estimate[a]) ? b : a,
  );
  const inBest = supported.filter((b) => b.trump === best);
  // Legal bids come lowest first.
  return (inBest.length > 0 ? inBest : supported)[0];
}

/** Tries every pair of the 12 cards and keeps the 10 that play the contract best. */
export function decideTalonDiscard(view: PlayerView, combined: Card[]): [Card, Card] {
  const phase = view.phase;
  const bid = phase.tag === 'talonExchange' ? phase.finalBid : null;
  let bestPair: [Card, Card] = [combined[0], combined[1]];
  let bestScore = -Infinity;
  for (let i = 0; i < combined.length; i++) {
    for (let j = i + 1; j < combined.length; j++) {
      const rest = combined.filter((_, k) => k !== i && k !== j);
      const discardedRanks = combined[i].rank + combined[j].rank;
      let score: number;
      if (!bid || isMisere(bid)) {
        // Fewest cards that could be forced to win; between equals, shed the higher cards.
        score = -misereDangerCards(rest) * 100 + discardedRanks;
      } else {
        const trump: TrumpOption = bid.kind === 'suit' ? bid.trump : 'nt';
        // Most tricks; between equals, fewer side suits (voids to ruff), then shed low cards.
        const suits = new Set(rest.map((c) => c.suit)).size;
        score = estimateTricks(rest, trump) * 100 - (trump === 'nt' ? 0 : suits * 5) - discardedRanks;
      }
      if (score > bestScore) {
        bestScore = score;
        bestPair = [combined[i], combined[j]];
      }
    }
  }
  return bestPair;
}

/**
 * Whists when this hand is expected to take its share of the defence (the par the scoring
 * charges for); half-whists when just short of it.
 */
export function decideWhist(view: PlayerView): WhistDecision {
  const phase = view.phase;
  if (phase.tag !== 'whistDecisions') return 'pass';
  const { contract, decisions, order } = phase;
  const tricks = estimateDefensiveTricks(view.myHand, trumpSuitOf(contract));
  const otherDefender = order.find((p) => p !== view.viewer);
  const alone = otherDefender !== undefined && decisions[otherDefender] === 'pass';
  const toDefend = 10 - contract.level;
  const par = alone ? toDefend : Math.floor(toDefend / 2);
  if (tricks >= par) return 'whist';
  if (tricks >= par - 1 && tricks >= 1) return 'half-whist';
  return 'pass';
}
