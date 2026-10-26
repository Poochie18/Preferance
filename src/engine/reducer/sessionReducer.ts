import type { DealResult, GameState } from '../model/gameState';
import { nextPlayer, PLAYER_IDS, type PlayerId } from '../model/player';
import type { RulesConfig } from '../rules/rulesConfig';
import { createDeal, dealReducer, type DealAction } from './dealReducer';

export function createInitialGameState(
  firstDealer: PlayerId,
  config: RulesConfig,
  rng: () => number = Math.random,
): GameState {
  return {
    totals: { 0: { game: 0, gora: 0 }, 1: { game: 0, gora: 0 }, 2: { game: 0, gora: 0 } },
    pulyaLength: config.pulyaLength,
    rulesConfig: config,
    sessionStartedAt: Date.now(),
    deal: createDeal(1, firstDealer, rng),
    history: [],
  };
}

export type SessionAction =
  | { type: 'DEAL_ACTION'; action: DealAction }
  | { type: 'START_NEXT_DEAL'; rng?: () => number }
  | { type: 'START_NEW_PULYA'; firstDealer: PlayerId; config: RulesConfig; rng?: () => number };

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
    const nextDeal = dealReducer(state.deal, action.action, state.rulesConfig);
    if (nextDeal.phase.tag === 'scored') {
      return applyDealResult({ ...state, deal: nextDeal }, nextDeal.phase.result);
    }
    return { ...state, deal: nextDeal };
  }

  if (action.type === 'START_NEW_PULYA') {
    return createInitialGameState(action.firstDealer, action.config, action.rng ?? Math.random);
  }

  // START_NEXT_DEAL
  const nextDealNumber = state.deal.dealNumber + 1;
  const nextDealer = nextPlayer(state.deal.dealer);
  const rng = action.rng ?? Math.random;
  return { ...state, deal: createDeal(nextDealNumber, nextDealer, rng) };
}

/** By-points pulyas end on deal count; by-time pulyas end once the current deal finishes after the time budget elapses. */
export function isPulyaComplete(
  state: GameState,
  winCondition: 'points' | 'time',
  timeTargetMinutes = 0,
  now: number = Date.now(),
): boolean {
  if (state.deal.phase.tag !== 'scored') return false;
  if (winCondition === 'time') {
    return now - state.sessionStartedAt >= timeTargetMinutes * 60_000;
  }
  return state.deal.dealNumber > state.pulyaLength;
}

export function isLastDealOfPulya(
  state: GameState,
  winCondition: 'points' | 'time',
  timeTargetMinutes = 0,
  now: number = Date.now(),
): boolean {
  if (winCondition === 'time') {
    return now - state.sessionStartedAt >= timeTargetMinutes * 60_000;
  }
  return state.deal.dealNumber >= state.pulyaLength;
}

/** Simple net settlement at pulya close: each player's (game - gora) balance. */
export function settlePulya(state: GameState): Record<PlayerId, number> {
  const net: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0 };
  for (const p of PLAYER_IDS) net[p] = state.totals[p].game - state.totals[p].gora;
  return net;
}
