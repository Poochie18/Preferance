import { describe, expect, it } from 'vitest';
import { createDeal, dealReducer } from './dealReducer';
import type { DealState } from '../model/gameState';
import type { PlayerId } from '../model/player';

function fixedRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function playFullSuitDeal(state: DealState) {
  // player 0 bids 6 spades, 1 and 2 pass -> player 0 declares
  let s = dealReducer(state, { type: 'BID', player: s0turn(state), bid: { kind: 'suit', level: 6, trump: '♠' } });
  while (s.phase.tag === 'bidding') {
    s = dealReducer(s, { type: 'BID', player: s.phase.turn, bid: 'pass' });
  }
  return s;
}

function s0turn(state: DealState): PlayerId {
  if (state.phase.tag !== 'bidding') throw new Error('expected bidding phase');
  return state.phase.turn;
}

describe('dealReducer full phase walk', () => {
  it('walks bidding -> talonExchange -> whistDecisions -> trickPlay -> scored', () => {
    let state = createDeal(1, 0, fixedRng(42));
    expect(state.phase.tag).toBe('bidding');

    state = playFullSuitDeal(state);
    expect(state.phase.tag).toBe('talonExchange');
    if (state.phase.tag !== 'talonExchange') throw new Error('unreachable');
    const declarer = state.phase.declarer;

    const combined = [...state.hands[declarer], ...state.talon];
    const discard: [typeof combined[0], typeof combined[0]] = [combined[0], combined[1]];
    state = dealReducer(state, { type: 'EXCHANGE_TALON', player: declarer, discard });
    expect(state.phase.tag).toBe('whistDecisions');

    while (state.phase.tag === 'whistDecisions') {
      state = dealReducer(state, { type: 'WHIST_DECISION', player: state.phase.turn, decision: 'whist' });
    }
    expect(state.phase.tag).toBe('trickPlay');

    // Play all 10 tricks, always choosing the first legal card.
    let guard = 0;
    while (state.phase.tag === 'trickPlay' && guard < 200) {
      guard++;
      const phase = state.phase;
      const hand = state.hands[phase.turn];
      const legal = hand; // leading or following, first card is always legal to attempt via engine validation
      // compute legal via engine import would duplicate logic; rely on reducer to throw if illegal and retry with next
      let played = false;
      for (const card of legal) {
        try {
          state = dealReducer(state, { type: 'PLAY_CARD', player: phase.turn, card });
          played = true;
          break;
        } catch {
          continue;
        }
      }
      if (!played) throw new Error('No legal card could be played');
    }

    expect(state.phase.tag).toBe('scored');
    if (state.phase.tag !== 'scored') throw new Error('unreachable');
    // 10 tricks played + 2 discarded talon cards credited to the declarer = 12
    const total = Object.values(state.phase.result.tricksByPlayer).reduce((a, b) => a + b, 0);
    expect(total).toBe(12);
  });

  it('rejects actions that do not match the current phase', () => {
    const state = createDeal(1, 0, fixedRng(1));
    expect(() =>
      dealReducer(state, { type: 'PLAY_CARD', player: 0, card: { suit: '♠', rank: 7 } }),
    ).toThrow();
  });

  it('all-pass leads directly to a rozpasovka trick-play phase with no contract', () => {
    let state = createDeal(1, 0, fixedRng(7));
    if (state.phase.tag !== 'bidding') throw new Error('unreachable');
    state = dealReducer(state, { type: 'BID', player: state.phase.turn, bid: 'pass' });
    if (state.phase.tag !== 'bidding') throw new Error('unreachable');
    state = dealReducer(state, { type: 'BID', player: state.phase.turn, bid: 'pass' });
    if (state.phase.tag !== 'bidding') throw new Error('unreachable');
    state = dealReducer(state, { type: 'BID', player: state.phase.turn, bid: 'pass' });
    expect(state.phase.tag).toBe('trickPlay');
    if (state.phase.tag === 'trickPlay') {
      expect(state.phase.contract).toBeNull();
    }
  });
});
