import type { Locale } from '../i18n/types';
import type { BotDifficulty } from '../ai/types';

export type GameType = 'sochi' | 'rostov' | 'leningrad';
export type WinCondition = 'points' | 'time';
export type PointsTarget = 10 | 20 | 30 | 40 | 50;
export type WhistStyle = 'gentlemanly' | 'cutthroat';
export type WhistPenaltyMode = 'responsible' | 'half-responsible';
export type RozpasovkaExit = '6-6-6' | '6-7-7' | '6-7-8';
export type FinalDealMode = 'settled' | 'whisted';
export type MisereBiddingMode = 'with-talon' | 'blind';
export type SuitLayout = 'grouped-by-color' | 'alternating';

export interface GameSettings {
  language: Locale;
  gameType: GameType;
  winCondition: WinCondition;
  pointsTarget: PointsTarget;
  timeTargetMinutes: number;
  whistStyle: WhistStyle;
  whistPenaltyMode: WhistPenaltyMode;
  rozpasovkaExit: RozpasovkaExit;
  finalDealMode: FinalDealMode;
  misereBiddingMode: MisereBiddingMode;
  pauseEnabled: boolean;
  suitLayout: SuitLayout;
  cardScale: number;
  textScale: number;
  bot1Difficulty: BotDifficulty;
  bot2Difficulty: BotDifficulty;
}
