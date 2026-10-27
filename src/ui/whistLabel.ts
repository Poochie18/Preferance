import type { WhistDecision } from '../engine/model/gameState';
import type { TranslationKeys } from '../i18n/types';

export function whistLabel(decision: WhistDecision, t: TranslationKeys): string {
  if (decision === 'whist') return t.whist.whist;
  if (decision === 'half-whist') return t.whist.halfWhist;
  return t.whist.pass;
}
