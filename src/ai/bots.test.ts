import { describe, expect, it } from 'vitest';
import type { Card } from '../engine/model/card';
import type { Contract, DealPhase, PlayerView, TrickCardPlay } from '../engine/model/gameState';
import type { PlayerId } from '../engine/model/player';
import { legalNextBids } from '../engine/model/bid';
import { emptyScores } from '../engine/rules/scoring';
import { legalCardsToPlay } from '../engine/rules/trick';
import { hardBot } from './hardBot';
import { estimateTricks, misereDangerCards } from './handEvaluation';

const c = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });

function view(viewer: PlayerId, myHand: Card[], phase: DealPhase): PlayerView {
  return {
    viewer,
    dealNumber: 1,
    pulyaLength: 10,
    dealer: 0,
    myHand,
    handCounts: { 0: 10, 1: 10, 2: 10 },
    phase,
    totals: emptyScores(),
  };
}

function trickPlay(contract: Contract | null, currentTrick: TrickCardPlay[], turn: PlayerId): DealPhase {
  return { tag: 'trickPlay', contract, whistDecisions: {}, tricks: [], currentTrick, turn };
}

function play(viewer: PlayerId, hand: Card[], contract: Contract | null, trick: TrickCardPlay[]): Card {
  const v = view(viewer, hand, trickPlay(contract, trick, viewer));
  return hardBot.decideCardToPlay(v, legalCardsToPlay(hand, trick, contract));
}

describe('hand evaluation', () => {
  it('counts sure and probable tricks', () => {
    const hand = [c('♥', 14), c('♥', 13), c('♥', 12), c('♥', 9), c('♥', 8), c('♠', 14), c('♠', 7), c('♣', 7), c('♣', 8), c('♦', 7)];
    // five solid hearts plus the ace of spades
    expect(estimateTricks(hand, '♥')).toBe(6);
  });

  it('recognises a misère hand', () => {
    const safe = [c('♠', 7), c('♠', 9), c('♠', 11), c('♣', 7), c('♣', 8), c('♦', 7), c('♦', 9), c('♥', 7), c('♥', 8), c('♥', 10)];
    expect(misereDangerCards(safe)).toBe(0);
    expect(misereDangerCards([c('♠', 14)])).toBe(1);
  });
});

describe('hard bot bidding', () => {
  it('passes a weak hand', () => {
    const weak = [c('♠', 7), c('♠', 10), c('♣', 8), c('♣', 11), c('♦', 9), c('♦', 12), c('♥', 7), c('♥', 9), c('♥', 11), c('♠', 12)];
    const v = view(1, weak, { tag: 'bidding', turn: 1, bids: [], passed: [] });
    expect(hardBot.decideBid(v, legalNextBids(undefined))).toBe('pass');
  });

  it('opens a strong hand at the lowest level in its best suit', () => {
    const strong = [c('♥', 14), c('♥', 13), c('♥', 12), c('♥', 11), c('♥', 9), c('♠', 14), c('♠', 13), c('♣', 14), c('♣', 7), c('♦', 7)];
    const v = view(1, strong, { tag: 'bidding', turn: 1, bids: [], passed: [] });
    expect(hardBot.decideBid(v, legalNextBids(undefined))).toEqual({ kind: 'suit', level: 6, trump: '♥' });
  });

  it('bids misère with a hand that ducks everything', () => {
    const safe = [c('♠', 7), c('♠', 9), c('♠', 11), c('♣', 7), c('♣', 8), c('♦', 7), c('♦', 9), c('♥', 7), c('♥', 8), c('♥', 10)];
    const v = view(1, safe, { tag: 'bidding', turn: 1, bids: [], passed: [] });
    expect(hardBot.decideBid(v, legalNextBids(undefined))).toEqual({ kind: 'misere' });
  });
});

describe('hard bot card play', () => {
  const spadesBy2: Contract = { declarer: 2, kind: 'suit', level: 6, trump: '♠' };

  it('does not overtake a partner whose card already wins', () => {
    // Player 0 (defender) led the boss A♥, declarer 2 followed low; player 1 (defender) plays last.
    const trick: TrickCardPlay[] = [
      { player: 0, card: c('♥', 14) },
      { player: 2, card: c('♥', 7) },
    ];
    expect(play(1, [c('♥', 13), c('♥', 8), c('♦', 7)], spadesBy2, trick)).toEqual(c('♥', 8));
  });

  it('wins as cheaply as possible when last against the declarer', () => {
    const trick: TrickCardPlay[] = [
      { player: 2, card: c('♦', 10) },
      { player: 0, card: c('♦', 7) },
    ];
    expect(play(1, [c('♦', 14), c('♦', 12), c('♦', 8)], spadesBy2, trick)).toEqual(c('♦', 12));
  });

  it('ducks under the winning card on its own misère', () => {
    const misere: Contract = { declarer: 1, kind: 'misere', level: 0 };
    const trick: TrickCardPlay[] = [{ player: 0, card: c('♣', 10) }];
    // Highest card that still loses: the 9, not the king.
    expect(play(1, [c('♣', 13), c('♣', 9), c('♣', 7)], misere, trick)).toEqual(c('♣', 9));
  });

  it('defenders keep the misère declarer winning', () => {
    const misere: Contract = { declarer: 2, kind: 'misere', level: 0 };
    const trick: TrickCardPlay[] = [
      { player: 0, card: c('♥', 7) },
      { player: 2, card: c('♥', 10) },
    ];
    // Duck under the declarer's 10 rather than taking the trick off them.
    expect(play(1, [c('♥', 14), c('♥', 9), c('♥', 8)], misere, trick)).toEqual(c('♥', 9));
  });

  it('dumps its most dangerous card when void at rozpasovka', () => {
    const trick: TrickCardPlay[] = [{ player: 0, card: c('♦', 9) }];
    expect(play(1, [c('♠', 14), c('♠', 7), c('♣', 8)], null, trick)).toEqual(c('♠', 14));
  });
});
