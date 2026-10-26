import type { Bid } from '../engine/model/bid';
import type { Card } from '../engine/model/card';
import type { PlayerView, WhistDecision } from '../engine/model/gameState';

/**
 * Every bot method receives only a PlayerView — never the full GameState — so bots
 * can only ever reason about what their seat is actually allowed to see.
 */
export interface BotStrategy {
  decideBid(view: PlayerView, legalBids: Bid[]): Bid | 'pass';
  decideTalonDiscard(view: PlayerView, combinedHand: Card[]): [Card, Card];
  decideWhist(view: PlayerView): WhistDecision;
  decideCardToPlay(view: PlayerView, legalCards: Card[]): Card;
}

export type BotDifficulty = 'easy' | 'medium' | 'hard';
