import { RANKS, SUITS, type Card, type Suit } from '../engine/model/card';
import type { CompletedTrick, TrickCardPlay } from '../engine/model/gameState';
import { PLAYER_IDS, type PlayerId } from '../engine/model/player';

export function playedCards(tricks: CompletedTrick[], currentTrick: TrickCardPlay[]): Card[] {
  const cards: Card[] = [];
  for (const trick of tricks) for (const play of trick.plays) cards.push(play.card);
  for (const play of currentTrick) cards.push(play.card);
  return cards;
}

const FULL_DECK: Card[] = SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));

const has = (cards: Card[], card: Card) => cards.some((c) => c.suit === card.suit && c.rank === card.rank);

/**
 * Cards whose location this player doesn't know: not in their hand and, when they
 * remember the play, not already played. (The talon/discard also count as unseen.)
 */
export function unseenCards(myHand: Card[], played: Card[]): Card[] {
  return FULL_DECK.filter((c) => !has(myHand, c) && !has(played, c));
}

/** Suits each player has shown out of: they didn't follow the led suit. */
export function knownVoids(tricks: CompletedTrick[], currentTrick: TrickCardPlay[]): Record<PlayerId, Set<Suit>> {
  const voids = Object.fromEntries(PLAYER_IDS.map((p) => [p, new Set<Suit>()])) as Record<PlayerId, Set<Suit>>;
  const scan = (plays: TrickCardPlay[]) => {
    const led = plays[0]?.card.suit;
    for (const play of plays.slice(1)) if (play.card.suit !== led) voids[play.player].add(led);
  };
  for (const trick of tricks) scan(trick.plays);
  scan(currentTrick);
  return voids;
}

/** Highest card of its suit still in play: no unseen card of that suit outranks it. */
export function isBoss(card: Card, unseen: Card[]): boolean {
  return !unseen.some((c) => c.suit === card.suit && c.rank > card.rank);
}
