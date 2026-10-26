import type { BotStrategy } from './types';
import type { Bid } from '../engine/model/bid';
import type { Card } from '../engine/model/card';

function highCardCount(hand: Card[]): number {
  return hand.filter((c) => c.rank >= 12).length; // Q, K, A
}

function countsBySuit(hand: Card[]): Partial<Record<Card['suit'], number>> {
  const counts: Partial<Record<Card['suit'], number>> = {};
  for (const c of hand) counts[c.suit] = (counts[c.suit] ?? 0) + 1;
  return counts;
}

/** Lowest-effort strategy: crude card-count heuristics, no memory, no lookahead. */
export const easyBot: BotStrategy = {
  decideBid(view, legalBids) {
    if (highCardCount(view.myHand) < 3) return 'pass';
    const sixBids = legalBids.filter(
      (b): b is Extract<Bid, { kind: 'suit' }> => b.kind === 'suit' && b.level === 6,
    );
    if (sixBids.length === 0) return 'pass';
    const counts = countsBySuit(view.myHand);
    let best = sixBids[0];
    for (const b of sixBids) {
      const bestCount = b.trump === 'nt' ? 0 : (counts[b.trump] ?? 0);
      const currentBestCount = best.trump === 'nt' ? 0 : (counts[best.trump] ?? 0);
      if (bestCount > currentBestCount) best = b;
    }
    return best;
  },

  decideTalonDiscard(_view, combinedHand) {
    const sorted = [...combinedHand].sort((a, b) => a.rank - b.rank);
    return [sorted[0], sorted[1]];
  },

  decideWhist(view) {
    return highCardCount(view.myHand) >= 2 ? 'whist' : 'pass';
  },

  decideCardToPlay(_view, legalCards) {
    const sorted = [...legalCards].sort((a, b) => a.rank - b.rank);
    return sorted[0];
  },
};
