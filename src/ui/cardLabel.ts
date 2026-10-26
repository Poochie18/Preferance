import { RANK_LABEL, type Card } from '../engine/model/card';

export function cardLabel(card: Card): string {
  return `${card.suit}${RANK_LABEL[card.rank]}`;
}

export function isRedSuit(suit: Card['suit']): boolean {
  return suit === '♦' || suit === '♥';
}
