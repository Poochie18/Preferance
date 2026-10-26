import { cardsEqual, type Card } from '../model/card';

export function pickupTalon(hand: Card[], talon: Card[]): Card[] {
  return [...hand, ...talon];
}

export function discardToHand(combinedHand: Card[], discard: [Card, Card]): Card[] {
  const result = [...combinedHand];
  for (const card of discard) {
    const idx = result.findIndex((c) => cardsEqual(c, card));
    if (idx === -1) {
      throw new Error('Discarded card is not in the combined hand');
    }
    result.splice(idx, 1);
  }
  if (result.length !== 10) {
    throw new Error('Hand after discard must contain exactly 10 cards');
  }
  return result;
}
