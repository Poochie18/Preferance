import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { createInitialGameState, sessionReducer } from '../../engine/reducer/sessionReducer';
import type { GameState } from '../../engine/model/gameState';
import type { PlayerId } from '../../engine/model/player';
import type { DealAction } from '../../engine/reducer/dealReducer';
import { currentActingPlayer, decideBotAction } from '../../ai/orchestrator';
import { easyBot } from '../../ai/easyBot';
import { mediumBot } from '../../ai/mediumBot';
import { hardBot } from '../../ai/hardBot';
import type { BotDifficulty, BotStrategy } from '../../ai/types';
import { useSettings } from '../../settings/context';
import { rulesConfigFromSettings } from '../../settings/rulesConfigFromSettings';
import { dealStartEntry, historyForAction, type HistoryEntry } from '../history';

export const HUMAN: PlayerId = 0;

const BOT_STRATEGIES: Record<BotDifficulty, BotStrategy> = {
  easy: easyBot,
  medium: mediumBot,
  hard: hardBot,
};

interface InternalState {
  game: GameState | null;
  paused: boolean;
  /** Move history for the current game, as seen by the human player. */
  log: HistoryEntry[];
}

type InternalAction =
  | { type: 'START'; game: GameState }
  | { type: 'RESET' }
  | { type: 'DEAL_ACTION'; action: DealAction }
  | { type: 'NEXT_DEAL'; config: ReturnType<typeof rulesConfigFromSettings> }
  | { type: 'SET_PAUSED'; paused: boolean };

function reducer(state: InternalState, action: InternalAction): InternalState {
  switch (action.type) {
    case 'START':
      return { game: action.game, paused: false, log: [dealStartEntry(action.game)] };
    case 'RESET':
      return { game: null, paused: false, log: [] };
    case 'SET_PAUSED':
      return { ...state, paused: action.paused };
    case 'DEAL_ACTION': {
      if (!state.game) return state;
      const nextGame = sessionReducer(state.game, { type: 'DEAL_ACTION', action: action.action });
      const entries = historyForAction(state.game, action.action, nextGame, HUMAN);
      return { ...state, game: nextGame, log: [...state.log, ...entries] };
    }
    case 'NEXT_DEAL': {
      if (!state.game) return state;
      const atPulyaEnd = state.game.deal.dealNumber >= state.game.pulyaLength;
      const nextGame = atPulyaEnd
        ? sessionReducer(state.game, { type: 'START_NEW_PULYA', firstDealer: 0, config: action.config })
        : sessionReducer(state.game, { type: 'START_NEXT_DEAL' });
      return { ...state, game: nextGame, log: [...state.log, dealStartEntry(nextGame)] };
    }
  }
}

interface GameContextValue {
  game: GameState | null;
  paused: boolean;
  log: HistoryEntry[];
  startGame: () => void;
  resetGame: () => void;
  dispatchHuman: (action: DealAction) => void;
  nextDeal: () => void;
  setPaused: (paused: boolean) => void;
  botStrategyFor: (player: PlayerId) => BotStrategy;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [state, dispatch] = useReducer(reducer, { game: null, paused: false, log: [] });
  const steppingRef = useRef(false);

  const botStrategyFor = useCallback(
    (player: PlayerId): BotStrategy => {
      if (player === HUMAN) throw new Error('Human has no bot strategy');
      const difficulty = player === 1 ? settings.bot1Difficulty : settings.bot2Difficulty;
      return BOT_STRATEGIES[difficulty];
    },
    [settings.bot1Difficulty, settings.bot2Difficulty],
  );

  useEffect(() => {
    if (!state.game || state.paused) return;
    if (state.game.deal.phase.tag === 'scored') return;
    const actingPlayer = currentActingPlayer(state.game);
    if (actingPlayer === null || actingPlayer === HUMAN) return;
    if (steppingRef.current) return;
    steppingRef.current = true;
    // Hold a finished trick on the table a little longer before the winner leads again.
    const phase = state.game.deal.phase;
    const delay = phase.tag === 'trickPlay' && phase.currentTrick.length === 0 && phase.tricks.length > 0 ? 1300 : 550;
    const timer = setTimeout(() => {
      steppingRef.current = false;
      const action = decideBotAction(state.game!, actingPlayer, botStrategyFor(actingPlayer));
      dispatch({ type: 'DEAL_ACTION', action });
    }, delay);
    return () => {
      clearTimeout(timer);
      steppingRef.current = false;
    };
  }, [state.game, state.paused, botStrategyFor]);

  const startGame = useCallback(() => {
    const config = rulesConfigFromSettings(settings);
    const game = createInitialGameState(0, config);
    dispatch({ type: 'START', game });
  }, [settings]);

  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);
  const dispatchHuman = useCallback((action: DealAction) => dispatch({ type: 'DEAL_ACTION', action }), []);
  const nextDeal = useCallback(() => {
    dispatch({ type: 'NEXT_DEAL', config: rulesConfigFromSettings(settings) });
  }, [settings]);
  const setPaused = useCallback((paused: boolean) => dispatch({ type: 'SET_PAUSED', paused }), []);

  const value: GameContextValue = {
    game: state.game,
    paused: state.paused,
    log: state.log,
    startGame,
    resetGame,
    dispatchHuman,
    nextDeal,
    setPaused,
    botStrategyFor,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
