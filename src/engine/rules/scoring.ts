import type { TrumpOption } from '../model/bid';
import type { Contract, PlayerDelta, WhistDecision } from '../model/gameState';
import { otherPlayers, type PlayerId } from '../model/player';

/**
 * Standard "classic Sochinka" point constants. Approximate/representative values —
 * club tables vary, so everything the scorer needs lives here in one place and can
 * be retuned after playtesting without touching the scoring logic itself.
 */
export const SOCHINKA_SCORING_TABLE = {
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
  PULYA_LENGTH: 10,
};

export interface ScoringInput {
  /** null => rozpasovka (no declarer/trump; fewest tricks "wins" the hand). */
  contract: Contract | null;
  tricksByPlayer: Record<PlayerId, number>;
  whistDecisions: Partial<Record<PlayerId, WhistDecision>>;
}

function emptyDeltas(): Record<PlayerId, PlayerDelta> {
  return { 0: { game: 0, gora: 0 }, 1: { game: 0, gora: 0 }, 2: { game: 0, gora: 0 } };
}

function scoreRaspasovka(tricksByPlayer: Record<PlayerId, number>): Record<PlayerId, PlayerDelta> {
  const delta = emptyDeltas();
  const players: PlayerId[] = [0, 1, 2];
  const minTricks = Math.min(...players.map((p) => tricksByPlayer[p]));
  for (const p of players) {
    if (tricksByPlayer[p] > minTricks) {
      delta[p].gora += tricksByPlayer[p] * SOCHINKA_SCORING_TABLE.RASPASOVKA_PENALTY_PER_TRICK;
    }
  }
  return delta;
}

function scoreSuitContract(
  contract: Contract,
  tricksByPlayer: Record<PlayerId, number>,
  whistDecisions: Partial<Record<PlayerId, WhistDecision>>,
): Record<PlayerId, PlayerDelta> {
  const delta = emptyDeltas();
  const { declarer, level } = contract;
  const suitValue = SOCHINKA_SCORING_TABLE.SUIT_VALUE[contract.trump ?? 'nt'];
  const got = tricksByPlayer[declarer];
  const declarerSucceeded = got >= level;

  if (declarerSucceeded) {
    delta[declarer].game += level * suitValue;
  } else {
    delta[declarer].gora += (level - got) * suitValue;
  }

  const opponents = otherPlayers(declarer);
  const activeOpponents = opponents.filter((p) => (whistDecisions[p] ?? 'pass') !== 'pass');
  const tricksToDefend = 10 - level;
  const parPerWhist = activeOpponents.length > 0 ? Math.floor(tricksToDefend / activeOpponents.length) : 0;

  for (const p of opponents) {
    const decision = whistDecisions[p] ?? 'pass';
    if (decision === 'pass') continue;
    const multiplier = decision === 'half-whist' ? 0.5 : 1;
    const whistTricks = tricksByPlayer[p];
    if (!declarerSucceeded) {
      delta[p].game += Math.round(whistTricks * SOCHINKA_SCORING_TABLE.WHIST_POINT_PER_TRICK * multiplier);
    } else {
      const shortfall = Math.max(0, parPerWhist - whistTricks);
      delta[p].gora += Math.round(shortfall * SOCHINKA_SCORING_TABLE.WHIST_POINT_PER_TRICK * multiplier);
    }
  }

  return delta;
}

function scoreMisere(
  contract: Contract,
  tricksByPlayer: Record<PlayerId, number>,
): Record<PlayerId, PlayerDelta> {
  const delta = emptyDeltas();
  const got = tricksByPlayer[contract.declarer];
  const isOuvert = contract.kind === 'misere-ouvert';
  if (got === 0) {
    delta[contract.declarer].game += isOuvert
      ? SOCHINKA_SCORING_TABLE.MISERE_OUVERT_VALUE
      : SOCHINKA_SCORING_TABLE.MISERE_VALUE;
  } else {
    const perTrick = isOuvert
      ? SOCHINKA_SCORING_TABLE.MISERE_OUVERT_PENALTY_PER_TRICK
      : SOCHINKA_SCORING_TABLE.MISERE_PENALTY_PER_TRICK;
    delta[contract.declarer].gora += got * perTrick;
  }
  return delta;
}

function scoreGora(
  contract: Contract,
  tricksByPlayer: Record<PlayerId, number>,
): Record<PlayerId, PlayerDelta> {
  const delta = emptyDeltas();
  const got = tricksByPlayer[contract.declarer];
  if (got === 10) {
    delta[contract.declarer].game += SOCHINKA_SCORING_TABLE.GORA_BONUS;
  } else {
    delta[contract.declarer].gora += SOCHINKA_SCORING_TABLE.GORA_PENALTY;
  }
  return delta;
}

export function computeDealResult(input: ScoringInput): Record<PlayerId, PlayerDelta> {
  const { contract, tricksByPlayer, whistDecisions } = input;
  if (!contract) return scoreRaspasovka(tricksByPlayer);
  if (contract.kind === 'suit') return scoreSuitContract(contract, tricksByPlayer, whistDecisions);
  if (contract.kind === 'misere' || contract.kind === 'misere-ouvert') return scoreMisere(contract, tricksByPlayer);
  if (contract.kind === 'gora') return scoreGora(contract, tricksByPlayer);
  throw new Error('Unknown contract kind');
}

/** Whether a player has accumulated enough "gora" to be eligible to declare "на вислу". */
export function isEligibleForVyslu(playerGora: number): boolean {
  return playerGora >= SOCHINKA_SCORING_TABLE.VYSLU_GORA_THRESHOLD;
}
