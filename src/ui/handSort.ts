import type { Card, Suit } from '../engine/model/card';
import type { SuitLayout } from '../settings/types';

const GROUPED_ORDER: Suit[] = ['♠', '♣', '♥', '♦'];
const ALTERNATING_ORDER: Suit[] = ['♠', '♥', '♣', '♦'];

export function sortHand(cards: Card[], layout: SuitLayout): Card[] {
  const order = layout === 'alternating' ? ALTERNATING_ORDER : GROUPED_ORDER;
  return [...cards].sort((a, b) => {
    const suitDiff = order.indexOf(a.suit) - order.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return b.rank - a.rank;
  });
}

/** Whether the card at `index` of a sorted hand opens a new suit group (gets a visual gap before it). */
export function startsSuitGroup(sorted: Card[], index: number): boolean {
  return index > 0 && sorted[index].suit !== sorted[index - 1].suit;
}

/** Number of gaps between suit groups in a sorted hand. */
export function suitGroupBreaks(sorted: Card[]): number {
  return sorted.filter((_, i) => startsSuitGroup(sorted, i)).length;
}
