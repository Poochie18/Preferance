import { describe, expect, it } from 'vitest';
import { applyBid, getLegalBids, initialBiddingState } from './bidding';
import type { Bid } from '../model/bid';

describe('bidding ladder', () => {
  it('starts with all bids legal for the first bidder', () => {
    const state = initialBiddingState(0);
    const legal = getLegalBids(state);
    expect(legal.length).toBeGreaterThan(0);
    expect(legal[0]).toEqual({ kind: 'suit', level: 6, trump: '♠' });
  });

  it('rejects a bid that does not exceed the current high bid', () => {
    const s0 = initialBiddingState(0);
    const bid6s: Bid = { kind: 'suit', level: 6, trump: '♠' };
    const outcome1 = applyBid(s0, 0, bid6s);
    if (outcome1.done) throw new Error('expected not done');
    expect(() => applyBid(outcome1.next, 1, bid6s)).toThrow();
  });

  it('rejects a bid out of turn', () => {
    const s0 = initialBiddingState(0);
    expect(() => applyBid(s0, 1, 'pass')).toThrow();
  });

  it('two passes after a bid declares the bidder', () => {
    const s0 = initialBiddingState(0);
    const bid: Bid = { kind: 'suit', level: 7, trump: '♥' };
    const o1 = applyBid(s0, 0, bid);
    if (o1.done) throw new Error('unexpected');
    const o2 = applyBid(o1.next, 1, 'pass');
    if (o2.done) throw new Error('unexpected');
    const o3 = applyBid(o2.next, 2, 'pass');
    expect(o3.done).toBe(true);
    if (o3.done && o3.result === 'declared') {
      expect(o3.declarer).toBe(0);
      expect(o3.finalBid).toEqual(bid);
    } else {
      throw new Error('expected declared outcome');
    }
  });

  it('all three passing with no bid triggers a pass-out', () => {
    const s0 = initialBiddingState(0);
    const o1 = applyBid(s0, 0, 'pass');
    if (o1.done) throw new Error('unexpected');
    const o2 = applyBid(o1.next, 1, 'pass');
    if (o2.done) throw new Error('unexpected');
    const o3 = applyBid(o2.next, 2, 'pass');
    expect(o3).toEqual({ done: true, result: 'passout' });
  });

  it('bidding can continue past an intervening pass', () => {
    const s0 = initialBiddingState(0);
    const bid6s: Bid = { kind: 'suit', level: 6, trump: '♠' };
    const bid6c: Bid = { kind: 'suit', level: 6, trump: '♣' };
    const o1 = applyBid(s0, 0, bid6s);
    if (o1.done) throw new Error('unexpected');
    const o2 = applyBid(o1.next, 1, 'pass');
    if (o2.done) throw new Error('unexpected');
    expect(o2.next.turn).toBe(2);
    const o3 = applyBid(o2.next, 2, bid6c);
    if (o3.done) throw new Error('unexpected');
    // player 1 already passed, so turn skips back to the original bidder (0)
    expect(o3.next.turn).toBe(0);
  });

  it('misere and gora rank above all suit bids', () => {
    const top: Bid = { kind: 'suit', level: 10, trump: 'nt' };
    const legal = getLegalBids({ turn: 0, bids: [], highBid: top, passed: [] });
    expect(legal).toEqual([{ kind: 'misere' }, { kind: 'misere-ouvert' }, { kind: 'gora' }]);
  });
});
