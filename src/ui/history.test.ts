import { describe, expect, it } from 'vitest';
import { createInitialGameState, sessionReducer } from '../engine/reducer/sessionReducer';
import { buildRulesConfig } from '../engine/rules/ruleProfiles';
import { currentActingPlayer, decideBotAction } from '../ai/orchestrator';
import { easyBot } from '../ai/easyBot';
import type { PlayerId } from '../engine/model/player';
import { dealStartEntry, historyForAction, type HistoryEntry } from './history';

const config = buildRulesConfig('sochi', 10);
const VIEWER: PlayerId = 0;

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

/** Plays one deal with bots in every seat, recording history the way GameContext does. */
function playDealWithHistory(seed: number): HistoryEntry[] {
  let game = createInitialGameState((seed % 3) as PlayerId, config, mulberry32(seed));
  const log: HistoryEntry[] = [dealStartEntry(game)];
  let guard = 0;
  while (game.deal.phase.tag !== 'scored' && guard++ < 500) {
    const player = currentActingPlayer(game);
    if (player === null) throw new Error('no acting player');
    const action = decideBotAction(game, player, easyBot);
    const next = sessionReducer(game, { type: 'DEAL_ACTION', action });
    log.push(...historyForAction(game, action, next, VIEWER));
    game = next;
  }
  return log;
}

describe('move history', () => {
  it('records every deal start, contract or pass-out, all 10 tricks and the result', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const log = playDealWithHistory(seed);
      expect(log[0].kind).toBe('dealStart');
      expect(log.filter((e) => e.kind === 'bid').length).toBeGreaterThanOrEqual(3);
      expect(log.filter((e) => e.kind === 'contract').length + log.filter((e) => e.kind === 'passout').length).toBe(1);
      expect(log.filter((e) => e.kind === 'trick').map((e) => (e.kind === 'trick' ? e.number : 0))).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
      expect(log.at(-1)?.kind).toBe('dealEnd');
    }
  });

  it("shows the talon and discard only for the viewer's own contract", () => {
    let sawOwn = false;
    let sawBot = false;
    for (let seed = 1; seed <= 200 && !(sawOwn && sawBot); seed++) {
      for (const e of playDealWithHistory(seed)) {
        if (e.kind !== 'contract' || e.blind) continue;
        if (e.player === VIEWER) {
          sawOwn = true;
          expect(e.talon).toHaveLength(2);
          expect(e.discard).toHaveLength(2);
        } else {
          sawBot = true;
          expect(e.talon).toBeUndefined();
          expect(e.discard).toBeUndefined();
        }
      }
    }
    expect(sawOwn && sawBot).toBe(true);
  });
});
