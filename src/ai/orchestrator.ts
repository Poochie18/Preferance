import { getVisibleState } from '../engine/rules/view';
import { getLegalBids } from '../engine/rules/bidding';
import { legalCardsToPlay } from '../engine/rules/trick';
import { isEligibleForVyslu } from '../engine/rules/scoring';
import type { GameState } from '../engine/model/gameState';
import type { PlayerId } from '../engine/model/player';
import { sessionReducer } from '../engine/reducer/sessionReducer';
import type { DealAction } from '../engine/reducer/dealReducer';
import type { BotStrategy } from './types';

export function currentActingPlayer(state: GameState): PlayerId | null {
  const phase = state.deal.phase;
  if (phase.tag === 'bidding') return phase.turn;
  if (phase.tag === 'talonExchange') return phase.declarer;
  if (phase.tag === 'whistDecisions') return phase.turn;
  if (phase.tag === 'trickPlay') return phase.turn;
  return null; // 'scored': nobody acts, caller must START_NEXT_DEAL
}

export function decideBotAction(state: GameState, player: PlayerId, bot: BotStrategy): DealAction {
  const phase = state.deal.phase;
  const view = getVisibleState(state, player);

  if (phase.tag === 'bidding') {
    const legal = getLegalBids(phase);
    return { type: 'BID', player, bid: bot.decideBid(view, legal) };
  }
  if (phase.tag === 'talonExchange') {
    const combined = [...state.deal.hands[player], ...state.deal.talon];
    const [a, b] = bot.decideTalonDiscard(view, combined);
    const onVyslu = isEligibleForVyslu(state.totals[player].gora, state.rulesConfig);
    return { type: 'EXCHANGE_TALON', player, discard: [a, b], onVyslu };
  }
  if (phase.tag === 'whistDecisions') {
    return { type: 'WHIST_DECISION', player, decision: bot.decideWhist(view) };
  }
  if (phase.tag === 'trickPlay') {
    const hand = state.deal.hands[player];
    const legal = legalCardsToPlay(hand, phase.currentTrick, phase.contract);
    return { type: 'PLAY_CARD', player, card: bot.decideCardToPlay(view, legal) };
  }
  throw new Error('No bot action available for the current phase');
}

export function stepWithBots(state: GameState, bots: Record<PlayerId, BotStrategy>): GameState {
  const player = currentActingPlayer(state);
  if (player === null) return state;
  const action = decideBotAction(state, player, bots[player]);
  return sessionReducer(state, { type: 'DEAL_ACTION', action });
}

export function playDealToCompletion(state: GameState, bots: Record<PlayerId, BotStrategy>): GameState {
  let s = state;
  let guard = 0;
  while (s.deal.phase.tag !== 'scored' && guard < 500) {
    s = stepWithBots(s, bots);
    guard++;
  }
  if (s.deal.phase.tag !== 'scored') {
    throw new Error('Deal did not reach the scored phase within the safety guard');
  }
  return s;
}
