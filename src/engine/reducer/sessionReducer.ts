import type { DealResult, GameState } from '../model/gameState';
import { nextPlayer, PLAYER_IDS, type PlayerId } from '../model/player';
import { SOCHINKA_SCORING_TABLE } from '../rules/scoring';
import { createDeal, dealReducer, type DealAction } from './dealReducer';

export function createInitialGameState(firstDealer: PlayerId, rng: () => number = Math.random): GameState {
  return {
    totals: { 0: { game: 0, gora: 0 }, 1: { game: 0, gora: 0 }, 2: { game: 0, gora: 0 } },
    pulyaLength: SOCHINKA_SCORING_TABLE.PULYA_LENGTH,
    deal: createDeal(1, firstDealer, rng),
    history: [],
  };
}

export type SessionAction =
  | { type: 'DEAL_ACTION'; action: DealAction }
  | { type: 'START_NEXT_DEAL'; rng?: () => number }
  | { type: 'START_NEW_PULYA'; firstDealer: PlayerId; rng?: () => number };

function applyDealResult(state: GameState, result: DealResult): GameState {
  const totals = { ...state.totals };
  for (const p of PLAYER_IDS) {
    totals[p] = {
      game: totals[p].game + result.pointsDelta[p].game,
      gora: totals[p].gora + result.pointsDelta[p].gora,
    };
  }
  return { ...state, totals, history: [...state.history, result] };
}

export function sessionReducer(state: GameState, action: SessionAction): GameState {
  if (action.type === 'DEAL_ACTION') {
    const nextDeal = dealReducer(state.deal, action.action);
    if (nextDeal.phase.tag === 'scored') {
      return applyDealResult({ ...state, deal: nextDeal }, nextDeal.phase.result);
    }
    return { ...state, deal: nextDeal };
  }

  if (action.type === 'START_NEW_PULYA') {
    return createInitialGameState(action.firstDealer, action.rng ?? Math.random);
  }

  // START_NEXT_DEAL
  const nextDealNumber = state.deal.dealNumber + 1;
  const nextDealer = nextPlayer(state.deal.dealer);
  const rng = action.rng ?? Math.random;
  return { ...state, deal: createDeal(nextDealNumber, nextDealer, rng) };
}

export function isPulyaComplete(state: GameState): boolean {
  return state.deal.dealNumber > state.pulyaLength && state.deal.phase.tag === 'scored';
}

export function isLastDealOfPulya(state: GameState): boolean {
  return state.deal.dealNumber >= state.pulyaLength;
}

/** Simple net settlement at pulya close: each player's (game - gora) balance. */
export function settlePulya(state: GameState): Record<PlayerId, number> {
  const net: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0 };
  for (const p of PLAYER_IDS) net[p] = state.totals[p].game - state.totals[p].gora;
  return net;
}
