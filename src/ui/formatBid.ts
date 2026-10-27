import type { Bid } from '../engine/model/bid';
import type { Contract } from '../engine/model/gameState';
import type { TranslationKeys } from '../i18n/types';

export function formatBidLocalized(bid: Bid, t: TranslationKeys): string {
  if (bid.kind === 'suit') return `${bid.level}${bid.trump === 'nt' ? t.bidding.noTrump : bid.trump}`;
  if (bid.kind === 'misere') return t.contractLabel.misere;
  if (bid.kind === 'misere-ouvert') return t.contractLabel.misereOuvert;
  return t.contractLabel.gora;
}

export function formatContractLocalized(contract: Contract, t: TranslationKeys): string {
  const bid: Bid =
    contract.kind === 'suit' ? { kind: 'suit', level: contract.level, trump: contract.trump ?? 'nt' } : { kind: contract.kind };
  return formatBidLocalized(bid, t);
}
