import type { Suit } from './card';

export type TrumpOption = Suit | 'nt';

/** Bidding order within a level, lowest to highest: ♠ < ♣ < ♦ < ♥ < nt (бескозырная). */
export const TRUMP_ORDER: TrumpOption[] = ['♠', '♣', '♦', '♥', 'nt'];

export const MIN_LEVEL = 6;
export const MAX_SUIT_LEVEL = 10;

export type ContractKind = 'suit' | 'misere' | 'misere-ouvert' | 'gora';

export interface SuitBid {
  kind: 'suit';
  level: number;
  trump: TrumpOption;
}

export interface SpecialBid {
  kind: 'misere' | 'misere-ouvert' | 'gora';
}

export type Bid = SuitBid | SpecialBid;

/**
 * Simplified Sochinka ladder: 6♠ < 6♣ < 6♦ < 6♥ < 6б/к < 7♠ ... < 10б/к < мізер < відкритий мізер < гора.
 * Returns a unique integer rank so bids can be totally ordered/compared.
 */
export function bidRank(bid: Bid): number {
  const span = TRUMP_ORDER.length;
  if (bid.kind === 'suit') {
    const trumpIdx = TRUMP_ORDER.indexOf(bid.trump);
    return (bid.level - MIN_LEVEL) * span + trumpIdx;
  }
  const topSuitRank = (MAX_SUIT_LEVEL - MIN_LEVEL) * span + (span - 1);
  if (bid.kind === 'misere') return topSuitRank + 1;
  if (bid.kind === 'misere-ouvert') return topSuitRank + 2;
  return topSuitRank + 3; // gora
}

export function bidEquals(a: Bid, b: Bid): boolean {
  return bidRank(a) === bidRank(b);
}

export function isHigherBid(candidate: Bid, current: Bid | undefined): boolean {
  if (!current) return true;
  return bidRank(candidate) > bidRank(current);
}

export function allPossibleBids(): Bid[] {
  const bids: Bid[] = [];
  for (let level = MIN_LEVEL; level <= MAX_SUIT_LEVEL; level++) {
    for (const trump of TRUMP_ORDER) {
      bids.push({ kind: 'suit', level, trump });
    }
  }
  bids.push({ kind: 'misere' });
  bids.push({ kind: 'misere-ouvert' });
  bids.push({ kind: 'gora' });
  return bids;
}

export function legalNextBids(current: Bid | undefined): Bid[] {
  return allPossibleBids().filter((b) => isHigherBid(b, current));
}

export function formatBid(bid: Bid): string {
  if (bid.kind === 'suit') return `${bid.level}${bid.trump === 'nt' ? 'б/к' : bid.trump}`;
  if (bid.kind === 'misere') return 'Мізер';
  if (bid.kind === 'misere-ouvert') return 'Відкритий мізер';
  return 'Гора';
}
