import { describe, expect, it } from 'vitest';
import { legalCardsToPlay, resolveTrick } from './trick';
import type { Card } from '../model/card';
import type { Contract, TrickCardPlay } from '../model/gameState';

const c = (suit: Card['suit'], rank: Card['rank']): Card => ({ suit, rank });

describe('legalCardsToPlay', () => {
  it('allows any card when leading', () => {
    const hand = [c('♠', 7), c('♥', 14)];
    expect(legalCardsToPlay(hand, [])).toEqual(hand);
  });

  it('forces following suit when possible', () => {
    const hand = [c('♠', 7), c('♥', 14)];
    const trick: TrickCardPlay[] = [{ player: 1, card: c('♠', 10) }];
    expect(legalCardsToPlay(hand, trick)).toEqual([c('♠', 7)]);
  });

  it('allows any card when void in the led suit', () => {
    const hand = [c('♥', 14), c('♦', 8)];
    const trick: TrickCardPlay[] = [{ player: 1, card: c('♠', 10) }];
    expect(legalCardsToPlay(hand, trick)).toEqual(hand);
  });
});

describe('resolveTrick', () => {
  const suitContract: Contract = { declarer: 0, kind: 'suit', level: 6, trump: '♥' };
  const noTrumpContract: Contract = { declarer: 0, kind: 'suit', level: 6, trump: 'nt' };

  it('highest card of the led suit wins with no trump involved', () => {
    const plays: TrickCardPlay[] = [
      { player: 0, card: c('♠', 9) },
      { player: 1, card: c('♠', 14) },
      { player: 2, card: c('♦', 13) },
    ];
    expect(resolveTrick(plays, suitContract)).toBe(1);
  });

  it('a trump beats any non-trump regardless of rank', () => {
    const plays: TrickCardPlay[] = [
      { player: 0, card: c('♠', 14) },
      { player: 1, card: c('♥', 7) },
      { player: 2, card: c('♦', 13) },
    ];
    expect(resolveTrick(plays, suitContract)).toBe(1);
  });

  it('highest trump wins when multiple trumps are played', () => {
    const plays: TrickCardPlay[] = [
      { player: 0, card: c('♥', 9) },
      { player: 1, card: c('♥', 13) },
      { player: 2, card: c('♥', 11) },
    ];
    expect(resolveTrick(plays, suitContract)).toBe(1);
  });

  it('no-trump contract: led suit always decides', () => {
    const plays: TrickCardPlay[] = [
      { player: 0, card: c('♠', 9) },
      { player: 1, card: c('♥', 14) },
      { player: 2, card: c('♠', 13) },
    ];
    expect(resolveTrick(plays, noTrumpContract)).toBe(2);
  });

  it('rozpasovka (null contract): no trump, led suit decides', () => {
    const plays: TrickCardPlay[] = [
      { player: 0, card: c('♦', 9) },
      { player: 1, card: c('♥', 14) },
      { player: 2, card: c('♦', 13) },
    ];
    expect(resolveTrick(plays, null)).toBe(2);
  });
});
