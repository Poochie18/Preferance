import type { DealResult, GameState } from '../model/gameState';
import { nextPlayer, PLAYER_IDS, type PlayerId } from '../model/player';
import type { RulesConfig } from '../rules/rulesConfig';
import { createDeal, dealReducer, type DealAction } from './dealReducer';
import { emptyScores } from '../rules/scoring';

export function createInitialGameState(
  firstDealer: PlayerId,
  config: RulesConfig,
  rng: () => number = Math.random,
): GameState {
  return {
    totals: emptyScores(),
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
    const prev = totals[p];
    const delta = result.pointsDelta[p];
    totals[p] = {
      pulya: prev.pulya + delta.pulya,
      gora: prev.gora + delta.gora,
      whists: {
        0: prev.whists[0] + delta.whists[0],
        1: prev.whists[1] + delta.whists[1],
        2: prev.whists[2] + delta.whists[2],
      },
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

/** Whists one point of gora is worth in the final settlement. */
const GORA_TO_WHISTS = 10;

/**
 * Classic settlement at pulya close, in whists (sums to zero): unfinished pulya is
 * written off the gora, each player pays for gora above the table average, then the
 * whists players wrote on each other are netted.
 */
export function settlePulya(state: GameState): Record<PlayerId, number> {
  const { totals } = state;
  const netGora = (p: PlayerId) => totals[p].gora - totals[p].pulya;
  const average = PLAYER_IDS.reduce<number>((sum, p) => sum + netGora(p), 0) / PLAYER_IDS.length;
  const net: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0 };
  for (const p of PLAYER_IDS) {
    net[p] = (average - netGora(p)) * GORA_TO_WHISTS;
    for (const q of PLAYER_IDS) net[p] += totals[p].whists[q] - totals[q].whists[p];
  }
  return net;
}
