import { describe, expect, it } from 'vitest';
import { computeDealResult, SOCHINKA_SCORING_TABLE } from './scoring';
import type { Contract } from '../model/gameState';

describe('scoreSuitContract', () => {
  const contract: Contract = { declarer: 0, kind: 'suit', level: 8, trump: '♦' };
  const suitValue = SOCHINKA_SCORING_TABLE.SUIT_VALUE['♦'];

  it('credits the declarer when the contract is made', () => {
    const delta = computeDealResult({
      contract,
      tricksByPlayer: { 0: 8, 1: 1, 2: 1 },
      whistDecisions: { 1: 'whist', 2: 'whist' },
    });
    expect(delta[0]).toEqual({ game: 8 * suitValue, gora: 0 });
  });

  it('penalizes the declarer per undertrick on failure', () => {
    const delta = computeDealResult({
      contract,
      tricksByPlayer: { 0: 6, 1: 2, 2: 2 },
      whistDecisions: { 1: 'whist', 2: 'whist' },
    });
    expect(delta[0]).toEqual({ game: 0, gora: 2 * suitValue });
  });

  it('whists who pass take no points either way', () => {
    const delta = computeDealResult({
      contract,
      tricksByPlayer: { 0: 8, 1: 2, 2: 0 },
      whistDecisions: { 1: 'pass', 2: 'whist' },
    });
    expect(delta[1]).toEqual({ game: 0, gora: 0 });
  });

  it('half-whist halves the whist point value', () => {
    const delta = computeDealResult({
      contract,
      tricksByPlayer: { 0: 6, 1: 2, 2: 0 },
      whistDecisions: { 1: 'half-whist', 2: 'pass' },
    });
    // declarer failed, whist(1) credited: tricks(2) * WHIST_POINT_PER_TRICK(2) * 0.5 = 2
    expect(delta[1].game).toBe(2);
  });
});

describe('scoreMisere', () => {
  it('rewards the declarer for taking zero tricks', () => {
    const contract: Contract = { declarer: 1, kind: 'misere', level: 0 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 5, 1: 0, 2: 5 }, whistDecisions: {} });
    expect(delta[1]).toEqual({ game: SOCHINKA_SCORING_TABLE.MISERE_VALUE, gora: 0 });
  });

  it('penalizes per trick taken on failure', () => {
    const contract: Contract = { declarer: 1, kind: 'misere', level: 0 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 4, 1: 3, 2: 3 }, whistDecisions: {} });
    expect(delta[1]).toEqual({ game: 0, gora: 3 * SOCHINKA_SCORING_TABLE.MISERE_PENALTY_PER_TRICK });
  });

  it('open misere pays double relative to plain misere', () => {
    const plain: Contract = { declarer: 1, kind: 'misere', level: 0 };
    const ouvert: Contract = { declarer: 1, kind: 'misere-ouvert', level: 0 };
    const plainDelta = computeDealResult({ contract: plain, tricksByPlayer: { 0: 5, 1: 0, 2: 5 }, whistDecisions: {} });
    const ouvertDelta = computeDealResult({ contract: ouvert, tricksByPlayer: { 0: 5, 1: 0, 2: 5 }, whistDecisions: {} });
    expect(ouvertDelta[1].game).toBeGreaterThan(plainDelta[1].game);
  });
});

describe('scoreGora', () => {
  it('rewards taking all ten tricks', () => {
    const contract: Contract = { declarer: 2, kind: 'gora', level: 10 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 0, 1: 0, 2: 10 }, whistDecisions: {} });
    expect(delta[2]).toEqual({ game: SOCHINKA_SCORING_TABLE.GORA_BONUS, gora: 0 });
  });

  it('penalizes falling even one trick short', () => {
    const contract: Contract = { declarer: 2, kind: 'gora', level: 10 };
    const delta = computeDealResult({ contract, tricksByPlayer: { 0: 1, 1: 0, 2: 9 }, whistDecisions: {} });
    expect(delta[2]).toEqual({ game: 0, gora: SOCHINKA_SCORING_TABLE.GORA_PENALTY });
  });
});

describe('scoreRaspasovka', () => {
  it('charges everyone above the minimum trick count, leaves the minimum untouched', () => {
    const delta = computeDealResult({ contract: null, tricksByPlayer: { 0: 2, 1: 5, 2: 3 }, whistDecisions: {} });
    expect(delta[0]).toEqual({ game: 0, gora: 0 });
    expect(delta[1]).toEqual({ game: 0, gora: 5 * SOCHINKA_SCORING_TABLE.RASPASOVKA_PENALTY_PER_TRICK });
    expect(delta[2]).toEqual({ game: 0, gora: 3 * SOCHINKA_SCORING_TABLE.RASPASOVKA_PENALTY_PER_TRICK });
  });

  it('a three-way tie for fewest tricks penalizes nobody', () => {
    const delta = computeDealResult({ contract: null, tricksByPlayer: { 0: 3, 1: 3, 2: 4 }, whistDecisions: {} });
    expect(delta[0]).toEqual({ game: 0, gora: 0 });
    expect(delta[1]).toEqual({ game: 0, gora: 0 });
  });
});
