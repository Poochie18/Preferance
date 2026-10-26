import type { BotStrategy } from './types';
import type { Card, Suit } from '../engine/model/card';
import type { PlayerView, TrickCardPlay } from '../engine/model/gameState';
import { mediumBot } from './mediumBot';
import { playedCards, remainingCardsOfSuit } from './cardMemory';

function trumpSuitFromView(view: PlayerView): Suit | null {
  const phase = view.phase;
  const contract = phase.tag === 'trickPlay' ? phase.contract : phase.tag === 'whistDecisions' ? phase.contract : null;
  if (!contract || contract.kind !== 'suit' || contract.trump === 'nt' || contract.trump === undefined) return null;
  return contract.trump;
}

function winningCardsAgainstTrick(legalCards: Card[], currentTrick: TrickCardPlay[], trump: Suit | null): Card[] {
  const bestSoFar = currentTrick.reduce((best, play) => {
    const playIsTrump = trump !== null && play.card.suit === trump;
    const bestIsTrump = trump !== null && best.card.suit === trump;
    if (playIsTrump && !bestIsTrump) return play;
    if (playIsTrump === bestIsTrump && play.card.suit === best.card.suit && play.card.rank > best.card.rank) {
      return play;
    }
    return best;
  }, currentTrick[0]);

  return legalCards.filter((card) => {
    const isTrump = trump !== null && card.suit === trump;
    const bestIsTrump = trump !== null && bestSoFar.card.suit === trump;
    if (isTrump && !bestIsTrump) return true;
    if (isTrump === bestIsTrump && card.suit === bestSoFar.card.suit) return card.rank > bestSoFar.card.rank;
    return false;
  });
}

/**
 * Shares bidding/talon/whist heuristics with the medium bot (no new information is available
 * at those decision points), but adds lightweight suit-count inference and 1-trick lookahead
 * to card play: lead from the suit most likely to hold winners given what's already been seen,
 * win tricks as cheaply as possible, and shed safely otherwise.
 */
export const hardBot: BotStrategy = {
  decideBid: mediumBot.decideBid,
  decideTalonDiscard: mediumBot.decideTalonDiscard,
  decideWhist: mediumBot.decideWhist,

  decideCardToPlay(view, legalCards) {
    const phase = view.phase;
    if (phase.tag !== 'trickPlay') return legalCards[0];
    const trump = trumpSuitFromView(view);
    const { currentTrick, tricks } = phase;

    if (currentTrick.length === 0) {
      const played = playedCards(tricks, currentTrick);
      const bySuit = new Map<Suit, Card[]>();
      for (const card of legalCards) {
        const list = bySuit.get(card.suit) ?? [];
        list.push(card);
        bySuit.set(card.suit, list);
      }
      let chosenSuit: Suit = legalCards[0].suit;
      let bestScore = -Infinity;
      for (const [suit, cards] of bySuit) {
        const topRank = Math.max(...cards.map((c) => c.rank));
        const unseenElsewhere = remainingCardsOfSuit(suit, view.myHand, played);
        const score = topRank - unseenElsewhere;
        if (score > bestScore) {
          bestScore = score;
          chosenSuit = suit;
        }
      }
      const ofChosen = (bySuit.get(chosenSuit) ?? legalCards).sort((a, b) => b.rank - a.rank);
      return ofChosen[0];
    }

    const winners = winningCardsAgainstTrick(legalCards, currentTrick, trump);
    if (winners.length > 0) {
      return winners.sort((a, b) => a.rank - b.rank)[0];
    }
    const nonTrump = legalCards.filter((c) => c.suit !== trump);
    const pool = nonTrump.length > 0 ? nonTrump : legalCards;
    return pool.sort((a, b) => a.rank - b.rank)[0];
  },
};
