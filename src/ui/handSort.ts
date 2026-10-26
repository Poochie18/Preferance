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
