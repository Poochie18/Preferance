import type { WhistDecision } from '../model/gameState';

export const WHIST_DECISIONS: WhistDecision[] = ['whist', 'half-whist', 'pass'];

export function isLegalWhistDecision(value: string): value is WhistDecision {
  return (WHIST_DECISIONS as string[]).includes(value);
}
