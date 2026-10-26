import { type Bid, bidEquals, legalNextBids } from '../model/bid';
import { nextPlayer, type PlayerId } from '../model/player';
import type { BidEntry } from '../model/gameState';

export interface BiddingState {
  turn: PlayerId;
  bids: BidEntry[];
  highBid?: Bid;
  highBidder?: PlayerId;
  passed: PlayerId[];
}

export function initialBiddingState(firstBidder: PlayerId): BiddingState {
  return { turn: firstBidder, bids: [], passed: [] };
}

export function getLegalBids(state: BiddingState): Bid[] {
  return legalNextBids(state.highBid);
}

export type BiddingOutcome =
  | { done: false; next: BiddingState }
  | { done: true; result: 'passout' }
  | { done: true; result: 'declared'; declarer: PlayerId; finalBid: Bid };

export function applyBid(state: BiddingState, player: PlayerId, action: Bid | 'pass'): BiddingOutcome {
  if (player !== state.turn) {
    throw new Error('Not this player\'s turn to bid');
  }
  if (action !== 'pass') {
    const legal = getLegalBids(state);
    if (!legal.some((b) => bidEquals(b, action))) {
      throw new Error('Illegal bid for current ladder position');
    }
  }

  const bids: BidEntry[] = [...state.bids, { player, bid: action }];
  const passed = action === 'pass' ? [...state.passed, player] : state.passed;
  const highBid = action === 'pass' ? state.highBid : action;
  const highBidder = action === 'pass' ? state.highBidder : player;

  if (passed.length === 3 && !highBid) {
    return { done: true, result: 'passout' };
  }

  const activePlayers = 3 - passed.length;
  if (highBid !== undefined && activePlayers === 1) {
    return { done: true, result: 'declared', declarer: highBidder!, finalBid: highBid };
  }

  let turn = nextPlayer(player);
  while (passed.includes(turn)) {
    turn = nextPlayer(turn);
  }

  return { done: false, next: { turn, bids, highBid, highBidder, passed } };
}
