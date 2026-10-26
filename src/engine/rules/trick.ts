import type { Card, Suit } from '../model/card';
import type { Contract, TrickCardPlay } from '../model/gameState';
import type { PlayerId } from '../model/player';

/** Returns the set of cards from `hand` that are legal to play given what's on the table so far. */
export function legalCardsToPlay(hand: Card[], currentTrick: TrickCardPlay[]): Card[] {
  if (currentTrick.length === 0) return hand;
  const ledSuit = currentTrick[0].card.suit;
  const sameSuit = hand.filter((c) => c.suit === ledSuit);
  if (sameSuit.length > 0) return sameSuit;
  return hand;
}

function trumpSuitOf(contract: Contract | null): Suit | null {
  if (!contract) return null; // rozpasovka: no trump
  if (contract.kind !== 'suit') return null; // misere/misere-ouvert/gora: no trump
  if (contract.trump === 'nt' || contract.trump === undefined) return null;
  return contract.trump;
}

/** Resolves a completed trick (array of plays in play order) to the winning player. */
export function resolveTrick(plays: TrickCardPlay[], contract: Contract | null): PlayerId {
  const trump = trumpSuitOf(contract);
  let winner = plays[0];
  for (const play of plays.slice(1)) {
    const isTrumpPlay = trump !== null && play.card.suit === trump;
    const isWinnerTrump = trump !== null && winner.card.suit === trump;
    if (isTrumpPlay && !isWinnerTrump) {
      winner = play;
    } else if (isTrumpPlay === isWinnerTrump && play.card.suit === winner.card.suit && play.card.rank > winner.card.rank) {
      winner = play;
    }
  }
  return winner.player;
}
