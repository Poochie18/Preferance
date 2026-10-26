import { createDeck, shuffle, type Card } from '../model/card';
import type { PlayerId } from '../model/player';

export interface DealtCards {
  hands: Record<PlayerId, Card[]>;
  talon: Card[];
}

export function dealCards(rng: () => number = Math.random): DealtCards {
  const deck = shuffle(createDeck(), rng);
  const hands: Record<PlayerId, Card[]> = {
    0: deck.slice(0, 10),
    1: deck.slice(10, 20),
    2: deck.slice(20, 30),
  };
  const talon = deck.slice(30, 32);
  return { hands, talon };
}
