import type { TrumpOption } from '../model/bid';
import type { Contract, PlayerDelta, WhistDecision } from '../model/gameState';
import { otherPlayers, type PlayerId } from '../model/player';
import type { RulesConfig, ScoringTable } from './rulesConfig';

/**
 * Standard "classic Sochinka" point constants. Approximate/representative values —
 * club tables vary, so everything the scorer needs lives here in one place and can
 * be retuned after playtesting without touching the scoring logic itself.
 */
export const SOCHINKA_SCORING_TABLE: ScoringTable = {
  SUIT_VALUE: { '♠': 2, '♣': 4, '♦': 6, '♥': 8, nt: 10 } as Record<TrumpOption, number>,
  MISERE_VALUE: 100,
  MISERE_OUVERT_VALUE: 200,
  MISERE_PENALTY_PER_TRICK: 20,
  MISERE_OUVERT_PENALTY_PER_TRICK: 40,
  GORA_BONUS: 280,
  GORA_PENALTY: 280,
  RASPASOVKA_PENALTY_PER_TRICK: 2,
  WHIST_POINT_PER_TRICK: 2,
  VYSLU_GORA_THRESHOLD: 100,
};

export interface ScoringInput {
  /** null => rozpasovka (no declarer/trump; fewest tricks "wins" the hand). */
  contract: Contract | null;
  tricksByPlayer: Record<PlayerId, number>;
  whistDecisions: Partial<Record<PlayerId, WhistDecision>>;
}

export function emptyScores(): Record<PlayerId, PlayerDelta> {
  const empty = (): PlayerDelta => ({ pulya: 0, gora: 0, whists: { 0: 0, 1: 0, 2: 0 } });
  return { 0: empty(), 1: empty(), 2: empty() };
}

function scoreRaspasovka(tricksByPlayer: Record<PlayerId, number>, config: RulesConfig): Record<PlayerId, PlayerDelta> {
  const delta = emptyScores();
  const players: PlayerId[] = [0, 1, 2];
  const minTricks = Math.min(...players.map((p) => tricksByPlayer[p]));
  const [t1, t2] = config.rozpasovkaExit;
  for (const p of players) {
    const tricks = tricksByPlayer[p];
    if (tricks <= minTricks) continue;
    const base = config.scoring.RASPASOVKA_PENALTY_PER_TRICK;
    const rate = tricks <= t1 ? base : tricks <= t2 ? base : base * 1.5;
    delta[p].gora += Math.round(tricks * rate);
  }
  return delta;
}

function scoreSuitContract(
  contract: Contract,
  tricksByPlayer: Record<PlayerId, number>,
  whistDecisions: Partial<Record<PlayerId, WhistDecision>>,
  config: RulesConfig,
): Record<PlayerId, PlayerDelta> {
  const delta = emptyScores();
  const { declarer, level } = contract;
  const suitValue = config.scoring.SUIT_VALUE[contract.trump ?? 'nt'];
  const got = tricksByPlayer[declarer];
  const declarerSucceeded = got >= level;

  if (declarerSucceeded) {
    delta[declarer].pulya += level * suitValue;
  } else {
    delta[declarer].gora += (level - got) * suitValue;
  }

  const opponents = otherPlayers(declarer);
  const activeOpponents = opponents.filter((p) => (whistDecisions[p] ?? 'pass') !== 'pass');
  const tricksToDefend = 10 - level;
  const parPerWhist =
    activeOpponents.length > 0
      ? config.whistStyle === 'cutthroat'
        ? Math.ceil(tricksToDefend / activeOpponents.length)
        : Math.floor(tricksToDefend / activeOpponents.length)
      : 0;

  if (config.whistPenaltyMode === 'half-responsible' && activeOpponents.length > 0) {
    let combined = 0;
    for (const p of activeOpponents) {
      const decision = whistDecisions[p] ?? 'pass';
      const multiplier = decision === 'half-whist' ? 0.5 : 1;
      const whistTricks = tricksByPlayer[p];
      combined += declarerSucceeded
        ? Math.max(0, parPerWhist - whistTricks) * multiplier
        : whistTricks * multiplier;
    }
    const share = Math.round((combined * config.scoring.WHIST_POINT_PER_TRICK) / activeOpponents.length);
    for (const p of activeOpponents) {
      if (declarerSucceeded) delta[p].gora += share;
      else delta[p].whists[declarer] += share;
    }
    return delta;
  }

  for (const p of opponents) {
    const decision = whistDecisions[p] ?? 'pass';
    if (decision === 'pass') continue;
    const multiplier = decision === 'half-whist' ? 0.5 : 1;
    const whistTricks = tricksByPlayer[p];
    if (!declarerSucceeded) {
      delta[p].whists[declarer] += Math.round(whistTricks * config.scoring.WHIST_POINT_PER_TRICK * multiplier);
    } else {
      const shortfall = Math.max(0, parPerWhist - whistTricks);
      delta[p].gora += Math.round(shortfall * config.scoring.WHIST_POINT_PER_TRICK * multiplier);
    }
  }

  return delta;
}

function scoreMisere(contract: Contract, tricksByPlayer: Record<PlayerId, number>, config: RulesConfig): Record<PlayerId, PlayerDelta> {
  const delta = emptyScores();
  const got = tricksByPlayer[contract.declarer];
  const isOuvert = contract.kind === 'misere-ouvert';
  if (got === 0) {
    delta[contract.declarer].pulya += isOuvert ? config.scoring.MISERE_OUVERT_VALUE : config.scoring.MISERE_VALUE;
  } else {
    const perTrick = isOuvert ? config.scoring.MISERE_OUVERT_PENALTY_PER_TRICK : config.scoring.MISERE_PENALTY_PER_TRICK;
    delta[contract.declarer].gora += got * perTrick;
  }
  return delta;
}

function scoreGora(contract: Contract, tricksByPlayer: Record<PlayerId, number>, config: RulesConfig): Record<PlayerId, PlayerDelta> {
  const delta = emptyScores();
  const got = tricksByPlayer[contract.declarer];
  if (got === 10) {
    delta[contract.declarer].pulya += config.scoring.GORA_BONUS;
  } else {
    delta[contract.declarer].gora += config.scoring.GORA_PENALTY;
  }
  return delta;
}

export function computeDealResult(input: ScoringInput, config: RulesConfig): Record<PlayerId, PlayerDelta> {
  const { contract, tricksByPlayer, whistDecisions } = input;
  if (!contract) return scoreRaspasovka(tricksByPlayer, config);
  if (contract.kind === 'suit') return scoreSuitContract(contract, tricksByPlayer, whistDecisions, config);
  if (contract.kind === 'misere' || contract.kind === 'misere-ouvert') return scoreMisere(contract, tricksByPlayer, config);
  if (contract.kind === 'gora') return scoreGora(contract, tricksByPlayer, config);
  throw new Error('Unknown contract kind');
}

/** Whether a player has accumulated enough "gora" to be eligible to declare "на вислу". */
export function isEligibleForVyslu(playerGora: number, config: RulesConfig): boolean {
  return playerGora >= config.scoring.VYSLU_GORA_THRESHOLD;
}
