import type { Card } from '../model/card';
import type { GameState, PlayerView } from '../model/gameState';
import { PLAYER_IDS, type PlayerId } from '../model/player';

/**
 * Projects the full (hidden-information-complete) GameState down to what a single
 * player is allowed to see. Bots and UI must only ever consume PlayerView, never
 * GameState directly, so neither bots nor the human-facing UI can "peek".
 */
export function getVisibleState(state: GameState, viewer: PlayerId): PlayerView {
  const { deal } = state;
  const handCounts: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0 };
  for (const p of PLAYER_IDS) handCounts[p] = deal.hands[p].length;

  const openHands: Partial<Record<PlayerId, Card[]>> = {};

  // Declarer sees their own combined hand regardless of phase via myHand below.
  // Misere-ouvert: declarer's hand is revealed to everyone once the contract is declared.
  if (deal.phase.tag === 'whistDecisions' || deal.phase.tag === 'trickPlay') {
    const contract = deal.phase.contract;
    if (contract && contract.kind === 'misere-ouvert') {
      openHands[contract.declarer] = deal.hands[contract.declarer];
    }
  }
  if (deal.phase.tag === 'scored') {
    const contract = deal.phase.result.contract;
    if (contract && contract.kind === 'misere-ouvert') {
      openHands[contract.declarer] = deal.hands[contract.declarer];
    }
  }

  return {
    viewer,
    dealNumber: deal.dealNumber,
    pulyaLength: state.pulyaLength,
    dealer: deal.dealer,
    myHand: deal.hands[viewer],
    handCounts,
    openHands: Object.keys(openHands).length > 0 ? openHands : undefined,
    phase: deal.phase,
    totals: state.totals,
  };
}
