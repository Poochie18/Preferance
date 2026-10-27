import { describe, expect, it } from 'vitest';
import { computeDealResult, SOCHINKA_SCORING_TABLE } from './scoring';
import { buildRulesConfig } from './ruleProfiles';
import type { Contract } from '../model/gameState';

const config = buildRulesConfig('sochi', 10);

describe('scoreSuitContract', () => {
  const contract: Contract = { declarer: 0, kind: 'suit', level: 8, trump: '♦' };
  const suitValue = SOCHINKA_SCORING_TABLE.SUIT_VALUE['♦'];

  it('credits the declarer when the contract is made', () => {
    const delta = computeDealResult(
      {
        contract,
        tricksByPlayer: { 0: 8, 1: 1, 2: 1 },
        whistDecisions: { 1: 'whist', 2: 'whist' },
      },
      config,
    );
    expect(delta[0]).toMatchObject({ pulya: 8 * suitValue, gora: 0 });
  });

  it('penalizes the declarer per undertrick on failure', () => {
    const delta = computeDealResult(
      {
        contract,
        tricksByPlayer: { 0: 6, 1: 2, 2: 2 },
        whistDecisions: { 1: 'whist', 2: 'whist' },
      },
      config,
    );
    expect(delta[0]).toMatchObject({ pulya: 0, gora: 2 * suitValue });
  });

  it('whists who pass take no points either way', () => {
    const delta = computeDealResult(
      {
        contract,
        tricksByPlayer: { 0: 8, 1: 2, 2: 0 },
        whistDecisions: { 1: 'pass', 2: 'whist' },
      },
      config,
    );
    expect(delta[1]).toMatchObject({ pulya: 0, gora: 0 });
  });

  it("whists are written on the declarer, not into the whister's pulya", () => {
    const delta = computeDealResult(
      {
        contract,
        tricksByPlayer: { 0: 6, 1: 3, 2: 1 },
        whistDecisions: { 1: 'whist', 2: 'whist' },
      },
      config,
    );
    expect(delta[1]).toEqual({ pulya: 0, gora: 0, whists: { 0: 3 * SOCHINKA_SCORING_TABLE.WHIST_POINT_PER_TRICK, 1: 0, 2: 0 } });
    expect(delta[2].whists).toEqual({ 0: SOCHINKA_SCORING_TABLE.WHIST_POINT_PER_TRICK, 1: 0, 2: 0 });
  });

  it('half-whist halves the whist point value', () => {
    const delta = computeDealResult(
      {
        contract,
        tricksByPlayer: { 0: 6, 1: 2, 2: 0 },
        whistDecisions: { 1: 'half-whist', 2: 'pass' },
      },
      config,
    );
    // declarer failed, whist(1) writes on the declarer: tricks(2) * WHIST_POINT_PER_TRICK(2) * 0.5 = 2
    expect(delta[1].whists[0]).toBe(2);
  });

  it('cutthroat whist style rounds the defenders\' par expectation up, not down', () => {
    const cutthroat = buildRulesConfig('rostov', 10);
    // level 7 -> 3 tricks to defend across 2 whists: gentlemanly par=1, cutthroat par=2
    const sevenLevel: Contract = { declarer: 0, kind: 'suit', level: 7, trump: '♦' };
    const delta = computeDealResult(
      { contract: sevenLevel, tricksByPlayer: { 0: 7, 1: 1, 2: 2 }, whistDecisions: { 1: 'whist', 2: 'whist' } },
      cutthroat,
    );
    // half-responsible mode (rostov default) pools both defenders' shortfall into one shared gora charge
    expect(delta[1].gora).toBe(delta[2].gora);
    expect(delta[1].gora).toBeGreaterThan(0);
  });
});

describe('scoreMisere', () => {
  it('rewards the declarer for taking zero tricks', () => {
    const contract: Contract = { declarer: 1, kind: 'misere', level: 0 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 5, 1: 0, 2: 5 }, whistDecisions: {} }, config);
    expect(delta[1]).toMatchObject({ pulya: SOCHINKA_SCORING_TABLE.MISERE_VALUE, gora: 0 });
  });

  it('penalizes per trick taken on failure', () => {
    const contract: Contract = { declarer: 1, kind: 'misere', level: 0 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 4, 1: 3, 2: 3 }, whistDecisions: {} }, config);
    expect(delta[1]).toMatchObject({ pulya: 0, gora: 3 * SOCHINKA_SCORING_TABLE.MISERE_PENALTY_PER_TRICK });
  });

  it('open misere pays double relative to plain misere', () => {
    const plain: Contract = { declarer: 1, kind: 'misere', level: 0 };
    const ouvert: Contract = { declarer: 1, kind: 'misere-ouvert', level: 0 };
    const plainDelta = computeDealResult({ contract: plain, tricksByPlayer: { 0: 5, 1: 0, 2: 5 }, whistDecisions: {} }, config);
    const ouvertDelta = computeDealResult({ contract: ouvert, tricksByPlayer: { 0: 5, 1: 0, 2: 5 }, whistDecisions: {} }, config);
    expect(ouvertDelta[1].pulya).toBeGreaterThan(plainDelta[1].pulya);
  });
});

describe('scoreGora', () => {
  it('rewards taking all ten tricks', () => {
    const contract: Contract = { declarer: 2, kind: 'gora', level: 10 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 0, 1: 0, 2: 10 }, whistDecisions: {} }, config);
    expect(delta[2]).toMatchObject({ pulya: SOCHINKA_SCORING_TABLE.GORA_BONUS, gora: 0 });
  });

  it('penalizes falling even one trick short', () => {
    const contract: Contract = { declarer: 2, kind: 'gora', level: 10 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 1, 1: 0, 2: 9 }, whistDecisions: {} }, config);
    expect(delta[2]).toMatchObject({ pulya: 0, gora: SOCHINKA_SCORING_TABLE.GORA_PENALTY });
  });
});

describe('scoreRaspasovka', () => {
  it('charges everyone above the minimum trick count, leaves the minimum untouched', () => {
    const delta = computeDealResult({ contract: null, tricksByPlayer: { 0: 2, 1: 5, 2: 3 }, whistDecisions: {} }, config);
    expect(delta[0]).toMatchObject({ pulya: 0, gora: 0 });
    expect(delta[1]).toMatchObject({ pulya: 0, gora: 5 * SOCHINKA_SCORING_TABLE.RASPASOVKA_PENALTY_PER_TRICK });
    expect(delta[2]).toMatchObject({ pulya: 0, gora: 3 * SOCHINKA_SCORING_TABLE.RASPASOVKA_PENALTY_PER_TRICK });
  });

  it('a three-way tie for fewest tricks penalizes nobody', () => {
    const delta = computeDealResult({ contract: null, tricksByPlayer: { 0: 3, 1: 3, 2: 4 }, whistDecisions: {} }, config);
    expect(delta[0]).toMatchObject({ pulya: 0, gora: 0 });
    expect(delta[1]).toMatchObject({ pulya: 0, gora: 0 });
  });

  it('applies a steeper rate once tricks exceed the second rozpasovka-exit threshold', () => {
    const rostovConfig = buildRulesConfig('rostov', 10); // exit tiers [6,7,8]
    const delta = computeDealResult({ contract: null, tricksByPlayer: { 0: 1, 1: 9, 2: 0 }, whistDecisions: {} }, rostovConfig);
    const base = rostovConfig.scoring.RASPASOVKA_PENALTY_PER_TRICK;
    expect(delta[1].gora).toBe(Math.round(9 * base * 1.5));
  });
});
