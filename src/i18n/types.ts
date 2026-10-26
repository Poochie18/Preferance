import type { BotDifficulty } from '../ai/types';

export type Locale = 'ru' | 'uk' | 'en';

export interface TranslationKeys {
  menu: {
    title: string;
    subtitle: string;
    language: string;
    newGame: string;
    settings: string;
  };
  newGame: {
    title: string;
    subtitle: string;
    bot1: string;
    bot2: string;
    difficulty: Record<BotDifficulty, string>;
    start: string;
    back: string;
  };
  settings: {
    title: string;
    back: string;
    gameType: { label: string; sochi: string; rostov: string; leningrad: string };
    winCondition: { label: string; points: string; time: string; minutes: string };
    pointsTarget: { label: string };
    whistStyle: { label: string; gentlemanly: string; cutthroat: string };
    whistPenaltyMode: { label: string; responsible: string; halfResponsible: string };
    rozpasovkaExit: { label: string };
    finalDealMode: { label: string; settled: string; whisted: string };
    misereBiddingMode: { label: string; withTalon: string; blind: string };
    pauseEnabled: { label: string };
    suitLayout: { label: string; groupedByColor: string; alternating: string };
    cardScale: { label: string };
    textScale: { label: string; example: string };
  };
  bidding: {
    title: string;
    pass: string;
    noTrump: string;
  };
  talon: {
    title: (bid: string, selected: number) => string;
    playOnVyslu: string;
    confirm: string;
  };
  whist: {
    title: string;
    whist: string;
    halfWhist: string;
    pass: string;
  };
  trick: {
    empty: string;
  };
  scoreSheet: {
    pulya: (current: number, total: number) => string;
    player: string;
    game: string;
    gora: string;
  };
  table: {
    yourTurn: string;
    nextDeal: string;
    newPulya: string;
    newGame: string;
    pause: string;
    resume: string;
    botThinking: string;
    cardsCount: (n: number) => string;
  };
  contractLabel: {
    misere: string;
    misereOuvert: string;
    gora: string;
  };
  playerNames: [string, string, string];
}
