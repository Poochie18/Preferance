import type { TrumpOption } from '../model/bid';

export type WhistStyle = 'gentlemanly' | 'cutthroat';
export type WhistPenaltyMode = 'responsible' | 'half-responsible';
export type FinalDealMode = 'settled' | 'whisted';
export type MisereBiddingMode = 'with-talon' | 'blind';

export interface ScoringTable {
  SUIT_VALUE: Record<TrumpOption, number>;
  MISERE_VALUE: number;
  MISERE_OUVERT_VALUE: number;
  MISERE_PENALTY_PER_TRICK: number;
  MISERE_OUVERT_PENALTY_PER_TRICK: number;
  GORA_BONUS: number;
  GORA_PENALTY: number;
  RASPASOVKA_PENALTY_PER_TRICK: number;
  WHIST_POINT_PER_TRICK: number;
  VYSLU_GORA_THRESHOLD: number;
}

/** Three graduated trick-count thresholds governing rozpasovka penalty tiers. */
export type RozpasovkaExitTiers = [number, number, number];

export interface RulesConfig {
  scoring: ScoringTable;
  pulyaLength: number;
  whistStyle: WhistStyle;
  whistPenaltyMode: WhistPenaltyMode;
  rozpasovkaExit: RozpasovkaExitTiers;
  finalDealMode: FinalDealMode;
  misereBiddingMode: MisereBiddingMode;
}
