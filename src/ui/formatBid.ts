import type { Bid } from '../engine/model/bid';
import type { TranslationKeys } from '../i18n/types';

export function formatBidLocalized(bid: Bid, t: TranslationKeys): string {
  if (bid.kind === 'suit') return `${bid.level}${bid.trump === 'nt' ? t.bidding.noTrump : bid.trump}`;
  if (bid.kind === 'misere') return t.contractLabel.misere;
  if (bid.kind === 'misere-ouvert') return t.contractLabel.misereOuvert;
  return t.contractLabel.gora;
}
