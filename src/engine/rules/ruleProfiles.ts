import { SOCHINKA_SCORING_TABLE } from './scoring';
import type { RulesConfig } from './rulesConfig';

export type GameType = 'sochi' | 'rostov' | 'leningrad';

/**
 * Best-effort, clearly-approximate rule profiles for Rostov/Leningrad schools.
 * We don't have canonical tables for these two the way SOCHINKA_SCORING_TABLE
 * was already pinned down — these numbers/defaults exist so the three game
 * types are mechanically distinct now, and are expected to be retuned once
 * the user has playtested them against their own club's conventions.
 */
export const RULE_PROFILES: Record<GameType, Omit<RulesConfig, 'pulyaLength'>> = {
  sochi: {
    scoring: SOCHINKA_SCORING_TABLE,
    whistStyle: 'gentlemanly',
    whistPenaltyMode: 'responsible',
    rozpasovkaExit: [6, 6, 6],
    finalDealMode: 'settled',
    misereBiddingMode: 'with-talon',
  },
  rostov: {
    // APPROXIMATE: Rostov school is commonly associated with harsher whist
    // conventions, misère traditionally bid/played blind, and a tougher
    // rozpasovka exit (higher trick thresholds before penalties escalate).
    scoring: { ...SOCHINKA_SCORING_TABLE, MISERE_VALUE: 120, MISERE_PENALTY_PER_TRICK: 24 },
    whistStyle: 'cutthroat',
    whistPenaltyMode: 'half-responsible',
    rozpasovkaExit: [6, 7, 8],
    finalDealMode: 'whisted',
    misereBiddingMode: 'blind',
  },
  leningrad: {
    // APPROXIMATE: Leningrad school is commonly associated with a different
    // suit-value scale and a different gora bonus/penalty scale than Sochinka.
    scoring: {
      ...SOCHINKA_SCORING_TABLE,
      SUIT_VALUE: { '♠': 4, '♣': 6, '♦': 8, '♥': 10, nt: 12 },
      GORA_BONUS: 320,
      GORA_PENALTY: 320,
    },
    whistStyle: 'gentlemanly',
    whistPenaltyMode: 'responsible',
    rozpasovkaExit: [6, 7, 7],
    finalDealMode: 'settled',
    misereBiddingMode: 'with-talon',
  },
};

export function buildRulesConfig(
  gameType: GameType,
  pulyaLength: number,
  overrides: Partial<Omit<RulesConfig, 'scoring' | 'pulyaLength'>> = {},
): RulesConfig {
  const base = RULE_PROFILES[gameType];
  return { ...base, ...overrides, pulyaLength };
}

/** Approximate v1 mapping from a user-facing points target to a deal count; refine after playtesting. */
export const POINTS_TARGET_TO_DEAL_COUNT: Record<10 | 20 | 30 | 40 | 50, number> = {
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50,
};

/** For winCondition === 'time': deal count is effectively unbounded, time is the real limit. */
export const UNBOUNDED_PULYA_LENGTH = Number.MAX_SAFE_INTEGER;

export function parseRozpasovkaExit(value: string): [number, number, number] {
  const parts = value.split('-').map(Number);
  return [parts[0], parts[1], parts[2]];
}
