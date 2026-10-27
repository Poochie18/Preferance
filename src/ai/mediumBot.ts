import type { BotStrategy } from './types';
import { decideBid, decideTalonDiscard, decideWhist, type DecisionOptions } from './decisions';
import { chooseCard } from './play';

/** Same bidding margin as the hard bot, but never tries misère or no-trump. */
const OPTIONS: DecisionOptions = { talonBonus: 1.5, allowMisere: false, allowNoTrump: false };

/**
 * Same hand evaluation and role-aware play as the hard bot, but skips misère/no-trump
 * and doesn't remember played cards (only sees the current trick).
 */
export const mediumBot: BotStrategy = {
  decideBid: (view, legalBids) => decideBid(view, legalBids, OPTIONS),
  decideTalonDiscard: decideTalonDiscard,
  decideWhist: decideWhist,
  decideCardToPlay: (view, legalCards) => chooseCard(view, legalCards, { memory: false }),
};
