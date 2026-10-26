import type { GameSettings } from './types';

export const DEFAULT_SETTINGS: GameSettings = {
  language: 'ru',
  gameType: 'sochi',
  winCondition: 'points',
  pointsTarget: 10,
  timeTargetMinutes: 60,
  whistStyle: 'gentlemanly',
  whistPenaltyMode: 'responsible',
  rozpasovkaExit: '6-6-6',
  finalDealMode: 'settled',
  misereBiddingMode: 'with-talon',
  pauseEnabled: true,
  suitLayout: 'grouped-by-color',
  cardScale: 1,
  textScale: 1,
  bot1Difficulty: 'easy',
  bot2Difficulty: 'easy',
};
