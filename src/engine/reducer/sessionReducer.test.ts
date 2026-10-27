import { describe, expect, it } from 'vitest';
import { createInitialGameState, settlePulya } from './sessionReducer';
import { buildRulesConfig } from '../rules/ruleProfiles';
import { PLAYER_IDS } from '../model/player';

describe('settlePulya', () => {
  const base = createInitialGameState(0, buildRulesConfig('sochi', 10), () => 0.5);

  it('nets gora against the table average and whists between players, summing to zero', () => {
    const state = {
      ...base,
      totals: {
        0: { pulya: 10, gora: 4, whists: { 0: 0, 1: 12, 2: 0 } },
        1: { pulya: 0, gora: 10, whists: { 0: 2, 1: 0, 2: 6 } },
        2: { pulya: 5, gora: 0, whists: { 0: 0, 1: 0, 2: 0 } },
      },
    };
    // net gora (gora - pulya): -6, 10, -5 -> average -1/3
    const net = settlePulya(state);
    expect(net[0]).toBeCloseTo((-1 / 3 + 6) * 10 + 12 - 2);
    expect(net[1]).toBeCloseTo((-1 / 3 - 10) * 10 + 8 - 12);
    expect(net[2]).toBeCloseTo((-1 / 3 + 5) * 10 - 6);
    expect(PLAYER_IDS.reduce<number>((sum, p) => sum + net[p], 0)).toBeCloseTo(0);
  });
});
