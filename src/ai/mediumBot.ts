import type { BotStrategy } from './types';
import type { Bid } from '../engine/model/bid';
import { bestSuit, estimateMaxLevel } from './handEvaluation';

const MIN_BIDDING_POWER = 10;

/** Weighted hand-strength heuristics for bidding/talon/whist; naive "win cheaply or shed" play. */
export const mediumBot: BotStrategy = {
  decideBid(view, legalBids) {
    const best = bestSuit(view.myHand);
    if (best.power < MIN_BIDDING_POWER) return 'pass';
    const maxLevel = estimateMaxLevel(view.myHand);
    const candidates = legalBids.filter(
      (b): b is Extract<Bid, { kind: 'suit' }> => b.kind === 'suit' && b.trump === best.suit && b.level <= maxLevel,
    );
    if (candidates.length === 0) return 'pass';
    return candidates.reduce((a, b) => (a.level < b.level ? a : b));
  },

  decideTalonDiscard(_view, combinedHand) {
    const best = bestSuit(combinedHand);
    const sorted = [...combinedHand].sort((a, b) => {
      if (a.suit === best.suit && b.suit !== best.suit) return 1;
      if (b.suit === best.suit && a.suit !== best.suit) return -1;
      return a.rank - b.rank;
    });
    return [sorted[0], sorted[1]];
  },

  decideWhist(view) {
    const maxLevel = estimateMaxLevel(view.myHand);
    if (maxLevel >= 7) return 'whist';
    if (maxLevel >= 6) return 'half-whist';
    return 'pass';
  },

  decideCardToPlay(_view, legalCards) {
    const sorted = [...legalCards].sort((a, b) => a.rank - b.rank);
    return sorted[0];
  },
};
