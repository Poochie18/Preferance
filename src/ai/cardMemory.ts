import type { Card, Suit } from '../engine/model/card';
import type { CompletedTrick, TrickCardPlay } from '../engine/model/gameState';

export function playedCards(tricks: CompletedTrick[], currentTrick: TrickCardPlay[]): Card[] {
  const cards: Card[] = [];
  for (const trick of tricks) for (const play of trick.plays) cards.push(play.card);
  for (const play of currentTrick) cards.push(play.card);
  return cards;
}

const CARDS_PER_SUIT = 8;

/** How many cards of `suit` are still unaccounted for (not in our hand, not yet played). */
export function remainingCardsOfSuit(suit: Suit, myHand: Card[], played: Card[]): number {
  const accountedFor =
    played.filter((c) => c.suit === suit).length + myHand.filter((c) => c.suit === suit).length;
  return CARDS_PER_SUIT - accountedFor;
}
