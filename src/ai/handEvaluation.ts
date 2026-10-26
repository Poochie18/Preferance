import { SUITS, type Card, type Suit } from '../engine/model/card';

export interface SuitStrength {
  suit: Suit;
  count: number;
  power: number;
}

export function evaluateSuits(hand: Card[]): SuitStrength[] {
  return SUITS.map((suit) => {
    const cards = hand.filter((c) => c.suit === suit);
    const power = cards.reduce((sum, c) => sum + (c.rank - 6), 0);
    return { suit, count: cards.length, power };
  }).sort((a, b) => b.power - a.power);
}

export function bestSuit(hand: Card[]): SuitStrength {
  return evaluateSuits(hand)[0];
}

/** Rough estimate of the highest bid level this 10-card hand can sustain in its best suit. */
export function estimateMaxLevel(hand: Card[]): number {
  const best = bestSuit(hand);
  const highCardCount = hand.filter((c) => c.rank >= 13).length; // K, A
  const longSuitBonus = Math.max(0, best.count - 4);
  const raw = 5 + Math.floor(best.power / 6) + Math.floor(highCardCount / 2) + longSuitBonus;
  return Math.min(10, Math.max(6, raw));
}
