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
  gameLog: {
    title: string;
  };
  table: {
    yourTurn: string;
    nextDeal: string;
    newPulya: string;
    newGame: string;
    pause: string;
    resume: string;
  };
  log: {
    newGameStarted: string;
    newPulyaStarted: string;
    dealHeader: (n: number) => string;
    bidPass: (name: string) => string;
    bidDeclare: (name: string, bid: string) => string;
    talonExchange: (name: string, discard: string) => string;
    talonExchangeVyslu: (name: string, discard: string) => string;
    whistWhist: (name: string) => string;
    whistHalf: (name: string) => string;
    whistPass: (name: string) => string;
    playCard: (name: string, card: string) => string;
    raspasovkaResult: string;
    contractResult: (name: string, label: string, tricks: number, made: boolean) => string;
  };
  contractLabel: {
    misere: string;
    misereOuvert: string;
    gora: string;
  };
  playerNames: [string, string, string];
}
