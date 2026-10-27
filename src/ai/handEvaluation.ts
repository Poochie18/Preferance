import { SUITS, type Card, type Suit } from '../engine/model/card';
import type { TrumpOption } from '../engine/model/bid';

/** Cards per suit in the 32-card preferans deck. */
const SUIT_SIZE = 8;
const ACE = 14;
const KING = 13;
const QUEEN = 12;
const JACK = 11;

function ranksDesc(hand: Card[], suit: Suit): number[] {
  return hand
    .filter((c) => c.suit === suit)
    .map((c) => c.rank as number)
    .sort((a, b) => b - a);
}

/** Length of the unbroken run down from the ace (A, AK, AKQ...): sure tricks. */
function topRun(ranks: number[]): number {
  let run = 0;
  while (run < ranks.length && ranks[run] === ACE - run) run++;
  return run;
}

/**
 * Tricks a suit is worth from its high cards: the run from the ace, plus partial credit
 * for guarded honours that win only when the missing card sits favourably.
 */
function honourTricks(ranks: number[]): number {
  const run = topRun(ranks);
  if (run > 0) {
    // AQx-style tenace: the honour just below the gap wins about half the time.
    const next = ranks[run];
    return run + (next === ACE - run - 1 && ranks.length > run + 1 ? 0.5 : 0);
  }
  if (ranks[0] === KING && ranks.length >= 2) return ranks[1] === QUEEN ? 1 : 0.5;
  if (ranks[0] === QUEEN && ranks.length >= 3) return ranks[1] === JACK ? 0.5 : 0.25;
  return 0;
}

/** Trump tricks for the declarer: every trump wins once the missing honours are drawn. */
function trumpTricks(ranks: number[]): number {
  const outside = SUIT_SIZE - ranks.length; // trumps held by the others (or lying in the talon)
  // A missing honour costs a trick only when the others hold enough trumps to guard it.
  const losers = [ACE, KING, QUEEN].filter((honour, i) => !ranks.includes(honour) && outside > i).length;
  return Math.max(honourTricks(ranks), ranks.length - losers);
}

/** No-trump tricks: a suit whose top run outlasts the others' cards runs to its full length. */
function noTrumpSuitTricks(ranks: number[]): number {
  const run = topRun(ranks);
  const othersPerHand = Math.ceil((SUIT_SIZE - ranks.length) / 2);
  return run > 0 && run >= othersPerHand ? ranks.length : honourTricks(ranks);
}

/** A suit the declarer can stop at no-trump: A, Kx or Qxx. */
function isStopped(ranks: number[]): boolean {
  return ranks[0] === ACE || (ranks[0] === KING && ranks.length >= 2) || (ranks[0] === QUEEN && ranks.length >= 3);
}

/** Expected tricks this hand takes as declarer with the given trump (before the talon). */
export function estimateTricks(hand: Card[], trump: TrumpOption): number {
  if (trump === 'nt') {
    let tricks = 0;
    for (const suit of SUITS) {
      const ranks = ranksDesc(hand, suit);
      tricks += noTrumpSuitTricks(ranks);
      // An unstopped suit lets the defenders cash their long cards.
      if (!isStopped(ranks)) tricks -= 1;
    }
    return Math.max(0, tricks);
  }
  let tricks = trumpTricks(ranksDesc(hand, trump));
  for (const suit of SUITS) {
    if (suit === trump) continue;
    // Side suits get ruffed after a couple of rounds.
    tricks += Math.min(2, honourTricks(ranksDesc(hand, suit)));
  }
  return tricks;
}

/** Expected tricks this hand takes defending against a contract in `trump` (null: no trump). */
export function estimateDefensiveTricks(hand: Card[], trump: Suit | null): number {
  let tricks = 0;
  for (const suit of SUITS) {
    const ranks = ranksDesc(hand, suit);
    if (suit === trump) {
      // The declarer holds the long trumps: only honours (and length behind them) count.
      if (ranks.includes(ACE)) tricks += 1;
      if (ranks.includes(KING) && ranks.length >= 2) tricks += 0.6;
      if (ranks.includes(QUEEN) && ranks.length >= 3) tricks += 0.4;
      if (ranks.length >= 4) tricks += 0.5;
      continue;
    }
    const run = topRun(ranks);
    // Against a trump contract the declarer ruffs a side suit early: the ace is sure, the king less so.
    tricks += trump ? Math.min(run, 1) + (run >= 2 ? 0.75 : 0) : run;
    if (run === 0 && ranks[0] === KING && ranks.length >= 2) tricks += 0.4;
  }
  return tricks;
}

/**
 * Cards that could be forced to win a trick at misère. A suit is safe when its cards climb
 * no faster than every other rank from the seven (7, 9, J, K): each card then has a
 * lower card outside to duck under. Void suits are safe.
 */
export function misereDangerCards(hand: Card[]): number {
  let danger = 0;
  for (const suit of SUITS) {
    const ranks = ranksDesc(hand, suit).reverse();
    ranks.forEach((rank, i) => {
      if (rank > 7 + 2 * i) danger++;
    });
  }
  return danger;
}
