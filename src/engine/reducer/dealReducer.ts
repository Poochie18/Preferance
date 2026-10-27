import type { Bid } from '../model/bid';
import type { Card } from '../model/card';
import type { CompletedTrick, DealState, DealPhase, WhistDecision } from '../model/gameState';
import { nextPlayer, type PlayerId } from '../model/player';
import { applyBid, initialBiddingState } from '../rules/bidding';
import { contractFromBid } from '../rules/contract';
import { dealCards } from '../rules/deal';
import { discardToHand, pickupTalon } from '../rules/talonExchange';
import { legalCardsToPlay, resolveTrick } from '../rules/trick';
import { computeDealResult } from '../rules/scoring';
import type { RulesConfig } from '../rules/rulesConfig';

export type DealAction =
  | { type: 'BID'; player: PlayerId; bid: Bid | 'pass' }
  | { type: 'EXCHANGE_TALON'; player: PlayerId; discard: [Card, Card] | []; onVyslu?: boolean }
  | { type: 'WHIST_DECISION'; player: PlayerId; decision: WhistDecision }
  | { type: 'PLAY_CARD'; player: PlayerId; card: Card };

export function createDeal(dealNumber: number, dealer: PlayerId, rng: () => number = Math.random): DealState {
  const { hands, talon } = dealCards(rng);
  const firstBidder = nextPlayer(dealer);
  return {
    dealNumber,
    dealer,
    hands,
    talon,
    discard: [],
    phase: { ...initialBiddingState(firstBidder), tag: 'bidding' },
  };
}

function tallyTricks(tricks: CompletedTrick[]): Record<PlayerId, number> {
  const tally: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0 };
  for (const trick of tricks) tally[trick.winner] += 1;
  return tally;
}

export function dealReducer(state: DealState, action: DealAction, config: RulesConfig): DealState {
  const phase = state.phase;

  switch (action.type) {
    case 'BID': {
      if (phase.tag !== 'bidding') throw new Error('Not in bidding phase');
      const outcome = applyBid(phase, action.player, action.bid);
      if (!outcome.done) {
        const nextPhase: DealPhase = { tag: 'bidding', ...outcome.next };
        return { ...state, phase: nextPhase };
      }
      if (outcome.result === 'passout') {
        const firstLeader = nextPlayer(state.dealer);
        const nextPhase: DealPhase = {
          tag: 'trickPlay',
          contract: null,
          whistDecisions: {},
          tricks: [],
          currentTrick: [],
          turn: firstLeader,
        };
        return { ...state, phase: nextPhase };
      }
      const nextPhase: DealPhase = {
        tag: 'talonExchange',
        declarer: outcome.declarer,
        finalBid: outcome.finalBid,
      };
      return { ...state, phase: nextPhase };
    }

    case 'EXCHANGE_TALON': {
      if (phase.tag !== 'talonExchange') throw new Error('Not in talon exchange phase');
      if (action.player !== phase.declarer) throw new Error('Only the declarer exchanges the talon');
      const contract = contractFromBid(action.player, phase.finalBid, action.onVyslu ?? false);
      const isBlindMisere =
        (contract.kind === 'misere' || contract.kind === 'misere-ouvert') && config.misereBiddingMode === 'blind';

      let hands = state.hands;
      let discard: Card[] = [];
      if (!isBlindMisere) {
        if (action.discard.length !== 2) throw new Error('Must discard exactly 2 cards unless playing blind misère');
        const combined = pickupTalon(state.hands[action.player], state.talon);
        const newHand = discardToHand(combined, action.discard);
        hands = { ...state.hands, [action.player]: newHand };
        discard = action.discard;
      }

      const isFinalDealSettled = config.finalDealMode === 'settled' && state.dealNumber === config.pulyaLength;

      if (contract.kind === 'suit' && !isFinalDealSettled) {
        const order = rotationFrom(nextPlayer(contract.declarer), contract.declarer);
        const nextPhase: DealPhase = {
          tag: 'whistDecisions',
          contract,
          turn: order[0],
          order,
          decisions: {},
        };
        return { ...state, hands, talon: [], discard, phase: nextPhase };
      }

      const nextPhase: DealPhase = {
        tag: 'trickPlay',
        contract,
        whistDecisions: {},
        tricks: [],
        currentTrick: [],
        turn: nextPlayer(contract.declarer),
      };
      return { ...state, hands, talon: [], discard, phase: nextPhase };
    }

    case 'WHIST_DECISION': {
      if (phase.tag !== 'whistDecisions') throw new Error('Not in whist decision phase');
      if (action.player !== phase.turn) throw new Error('Not this player\'s turn to decide');
      const decisions = { ...phase.decisions, [action.player]: action.decision };
      const idx = phase.order.indexOf(action.player);
      const remaining = phase.order.slice(idx + 1);

      if (remaining.length === 0) {
        const nextPhase: DealPhase = {
          tag: 'trickPlay',
          contract: phase.contract,
          whistDecisions: decisions,
          tricks: [],
          currentTrick: [],
          turn: nextPlayer(phase.contract.declarer),
        };
        return { ...state, phase: nextPhase };
      }

      const nextPhase: DealPhase = { ...phase, turn: remaining[0], decisions };
      return { ...state, phase: nextPhase };
    }

    case 'PLAY_CARD': {
      if (phase.tag !== 'trickPlay') throw new Error('Not in trick play phase');
      if (action.player !== phase.turn) throw new Error('Not this player\'s turn to play');
      const hand = state.hands[action.player];
      const legal = legalCardsToPlay(hand, phase.currentTrick, phase.contract);
      if (!legal.some((c) => c.suit === action.card.suit && c.rank === action.card.rank)) {
        throw new Error('Illegal card for current trick');
      }
      const newHand = hand.filter((c) => !(c.suit === action.card.suit && c.rank === action.card.rank));
      const hands = { ...state.hands, [action.player]: newHand };
      const currentTrick = [...phase.currentTrick, { player: action.player, card: action.card }];

      if (currentTrick.length < 3) {
        const nextPhase: DealPhase = { ...phase, currentTrick, turn: nextPlayer(action.player) };
        return { ...state, hands, phase: nextPhase };
      }

      const winner = resolveTrick(currentTrick, phase.contract);
      const tricks = [...phase.tricks, { plays: currentTrick, winner }];

      if (tricks.length < 10) {
        const nextPhase: DealPhase = { ...phase, tricks, currentTrick: [], turn: winner };
        return { ...state, hands, phase: nextPhase };
      }

      const tricksByPlayer = tallyTricks(tricks);
      const pointsDelta = computeDealResult(
        {
          contract: phase.contract,
          tricksByPlayer,
          whistDecisions: phase.whistDecisions,
        },
        config,
      );
      const nextPhase: DealPhase = {
        tag: 'scored',
        result: { contract: phase.contract, tricksByPlayer, whistDecisions: phase.whistDecisions, pointsDelta },
      };
      return { ...state, hands, phase: nextPhase };
    }

    default:
      throw new Error('Unknown deal action');
  }
}

function rotationFrom(start: PlayerId, exclude: PlayerId): PlayerId[] {
  const order: PlayerId[] = [];
  let p = start;
  for (let i = 0; i < 3; i++) {
    if (p !== exclude) order.push(p);
    p = nextPlayer(p);
  }
  return order;
}
