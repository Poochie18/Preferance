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
import { describeAction, describeDealResult } from '../log';

export const HUMAN: PlayerId = 0;

const BOT_STRATEGIES: Record<BotDifficulty, BotStrategy> = {
  easy: easyBot,
  medium: mediumBot,
  hard: hardBot,
};

export interface GameConfig {
  bot1Difficulty: BotDifficulty;
  bot2Difficulty: BotDifficulty;
}

interface InternalState {
  game: GameState | null;
  config: GameConfig;
  log: string[];
}

type InternalAction =
  | { type: 'START'; game: GameState; config: GameConfig }
  | { type: 'DEAL_ACTION'; action: DealAction }
  | { type: 'NEXT_DEAL' }
  | { type: 'RESET' };

function reducer(state: InternalState, action: InternalAction): InternalState {
  switch (action.type) {
    case 'START':
      return { game: action.game, config: action.config, log: ['Нову гру розпочато.'] };
    case 'RESET':
      return { game: null, config: state.config, log: [] };
    case 'DEAL_ACTION': {
      if (!state.game) return state;
      const nextGame = sessionReducer(state.game, { type: 'DEAL_ACTION', action: action.action });
      const lines = [describeAction(action.action)];
      const resultLine = describeDealResult(nextGame);
      if (resultLine) lines.push(resultLine);
      return { ...state, game: nextGame, log: [...state.log, ...lines] };
    }
    case 'NEXT_DEAL': {
      if (!state.game) return state;
      const atPulyaEnd = state.game.deal.dealNumber >= state.game.pulyaLength;
      const nextGame = atPulyaEnd
        ? sessionReducer(state.game, { type: 'START_NEW_PULYA', firstDealer: 0 })
        : sessionReducer(state.game, { type: 'START_NEXT_DEAL' });
      const line = atPulyaEnd
        ? '— Нова пуля розпочата, рахунок скинуто —'
        : `— Роздача ${nextGame.deal.dealNumber} —`;
      return { ...state, game: nextGame, log: [...state.log, line] };
    }
  }
}

interface GameContextValue {
  game: GameState | null;
  config: GameConfig;
  log: string[];
  startGame: (config: GameConfig) => void;
  resetGame: () => void;
  dispatchHuman: (action: DealAction) => void;
  nextDeal: () => void;
  botStrategyFor: (player: PlayerId) => BotStrategy;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    game: null,
    config: { bot1Difficulty: 'easy', bot2Difficulty: 'easy' },
    log: [],
  });
  const steppingRef = useRef(false);

  const botStrategyFor = useCallback(
    (player: PlayerId): BotStrategy => {
      if (player === HUMAN) throw new Error('Human has no bot strategy');
      const difficulty = player === 1 ? state.config.bot1Difficulty : state.config.bot2Difficulty;
      return BOT_STRATEGIES[difficulty];
    },
    [state.config],
  );

  useEffect(() => {
    if (!state.game) return;
    if (state.game.deal.phase.tag === 'scored') return;
    const actingPlayer = currentActingPlayer(state.game);
    if (actingPlayer === null || actingPlayer === HUMAN) return;
    if (steppingRef.current) return;
    steppingRef.current = true;
    const timer = setTimeout(() => {
      steppingRef.current = false;
      const action = decideBotAction(state.game!, actingPlayer, botStrategyFor(actingPlayer));
      dispatch({ type: 'DEAL_ACTION', action });
    }, 550);
    return () => {
      clearTimeout(timer);
      steppingRef.current = false;
    };
  }, [state.game, botStrategyFor]);

  const startGame = useCallback((config: GameConfig) => {
    const firstDealer: PlayerId = 0;
    const game = createInitialGameState(firstDealer);
    dispatch({ type: 'START', game, config });
  }, []);

  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);
  const dispatchHuman = useCallback((action: DealAction) => dispatch({ type: 'DEAL_ACTION', action }), []);
  const nextDeal = useCallback(() => dispatch({ type: 'NEXT_DEAL' }), []);

  const value: GameContextValue = {
    game: state.game,
    config: state.config,
    log: state.log,
    startGame,
    resetGame,
    dispatchHuman,
    nextDeal,
    botStrategyFor,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
