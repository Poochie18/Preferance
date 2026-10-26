import { describe, expect, it } from 'vitest';
import { createInitialGameState, sessionReducer } from '../engine/reducer/sessionReducer';
import { buildRulesConfig } from '../engine/rules/ruleProfiles';
import { playDealToCompletion } from './orchestrator';
import { easyBot } from './easyBot';
import { mediumBot } from './mediumBot';
import { hardBot } from './hardBot';
import type { BotStrategy } from './types';
import type { PlayerId } from '../engine/model/player';

const config = buildRulesConfig('sochi', 10);

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bots = { 0: easyBot, 1: easyBot, 2: easyBot };

describe('headless bot-vs-bot-vs-bot smoke test', () => {
  it('plays 200 random deals end-to-end without the engine ever throwing', () => {
    for (let i = 0; i < 200; i++) {
      const rng = mulberry32(1000 + i);
      let state = createInitialGameState((i % 3) as PlayerId, config, rng);
      state = playDealToCompletion(state, bots);
      expect(state.deal.phase.tag).toBe('scored');
    }
  });

  it('plays a full 10-deal pulya and accumulates sane totals', () => {
    const rng = mulberry32(7);
    let state = createInitialGameState(0, config, rng);
    for (let d = 0; d < state.pulyaLength; d++) {
      state = playDealToCompletion(state, bots);
      if (d < state.pulyaLength - 1) {
        state = sessionReducer(state, { type: 'START_NEXT_DEAL', rng });
      }
    }
    expect(state.history).toHaveLength(10);
    for (const p of [0, 1, 2] as PlayerId[]) {
      expect(state.totals[p].game).toBeGreaterThanOrEqual(0);
      expect(state.totals[p].gora).toBeGreaterThanOrEqual(0);
    }
  });

  const mixedLineups: Record<string, Record<PlayerId, BotStrategy>> = {
    'all medium': { 0: mediumBot, 1: mediumBot, 2: mediumBot },
    'all hard': { 0: hardBot, 1: hardBot, 2: hardBot },
    mixed: { 0: easyBot, 1: mediumBot, 2: hardBot },
  };

  for (const [label, lineup] of Object.entries(mixedLineups)) {
    it(`never proposes an illegal move across 100 random deals (${label})`, () => {
      for (let i = 0; i < 100; i++) {
        const rng = mulberry32(5000 + i);
        let state = createInitialGameState((i % 3) as PlayerId, config, rng);
        state = playDealToCompletion(state, lineup);
        expect(state.deal.phase.tag).toBe('scored');
      }
    });
  }
});
