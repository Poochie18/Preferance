import type { BotStrategy } from './types';
import { decideBid, decideTalonDiscard, decideWhist, type DecisionOptions } from './decisions';
import { chooseCard } from './play';

// The hand estimate runs about 1.3 tricks short of what declarers actually take (talon,
// play); 1.5 was tuned in bot-vs-bot runs: contracts made ~82% of the time.
const OPTIONS: DecisionOptions = { talonBonus: 1.5, allowMisere: true, allowNoTrump: true };

/**
 * Trick-counting hand evaluation (bids only what the hand can take, misère and no-trump
 * included), whists against the par it would be charged for, and role-aware card play
 * with full memory of played cards and shown-out suits.
 */
export const hardBot: BotStrategy = {
  decideBid: (view, legalBids) => decideBid(view, legalBids, OPTIONS),
  decideTalonDiscard: decideTalonDiscard,
  decideWhist: decideWhist,
  decideCardToPlay: (view, legalCards) => chooseCard(view, legalCards, { memory: true }),
};
