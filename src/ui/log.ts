import type { DealAction } from '../engine/reducer/dealReducer';
import type { GameState } from '../engine/model/gameState';
import type { Bid } from '../engine/model/bid';
import { cardLabel } from './cardLabel';
import { formatBidLocalized } from './formatBid';
import type { TranslationKeys } from '../i18n/types';

export type LogEntry =
  | { kind: 'new-game' }
  | { kind: 'new-pulya' }
  | { kind: 'deal-header'; n: number }
  | { kind: 'bid-pass'; player: number }
  | { kind: 'bid-declare'; player: number; bid: Bid }
  | { kind: 'talon-exchange'; player: number; discard: string; onVyslu: boolean }
  | { kind: 'whist-decision'; player: number; decision: 'whist' | 'half-whist' | 'pass' }
  | { kind: 'play-card'; player: number; card: string }
  | { kind: 'deal-result-raspasovka' }
  | { kind: 'deal-result-contract'; player: number; bid: Bid; tricks: number; made: boolean };

export function describeAction(action: DealAction): LogEntry {
  switch (action.type) {
    case 'BID':
      return action.bid === 'pass'
        ? { kind: 'bid-pass', player: action.player }
        : { kind: 'bid-declare', player: action.player, bid: action.bid };
    case 'EXCHANGE_TALON':
      return {
        kind: 'talon-exchange',
        player: action.player,
        discard: action.discard.map(cardLabel).join(', '),
        onVyslu: action.onVyslu ?? false,
      };
    case 'WHIST_DECISION':
      return { kind: 'whist-decision', player: action.player, decision: action.decision };
    case 'PLAY_CARD':
      return { kind: 'play-card', player: action.player, card: cardLabel(action.card) };
  }
}

export function describeDealResult(state: GameState): LogEntry | null {
  if (state.deal.phase.tag !== 'scored') return null;
  const result = state.deal.phase.result;
  if (!result.contract) return { kind: 'deal-result-raspasovka' };
  const { contract } = result;
  const got = result.tricksByPlayer[contract.declarer];
  const made = contract.kind === 'suit' ? got >= contract.level : contract.kind === 'gora' ? got === 10 : got === 0;
  const bid: Bid =
    contract.kind === 'suit'
      ? { kind: 'suit', level: contract.level, trump: contract.trump ?? 'nt' }
      : { kind: contract.kind };
  return { kind: 'deal-result-contract', player: contract.declarer, bid, tricks: got, made };
}

export function renderLogEntry(entry: LogEntry, t: TranslationKeys): string {
  const name = (p: number) => t.playerNames[p];
  switch (entry.kind) {
    case 'new-game':
      return t.log.newGameStarted;
    case 'new-pulya':
      return t.log.newPulyaStarted;
    case 'deal-header':
      return t.log.dealHeader(entry.n);
    case 'bid-pass':
      return t.log.bidPass(name(entry.player));
    case 'bid-declare':
      return t.log.bidDeclare(name(entry.player), formatBidLocalized(entry.bid, t));
    case 'talon-exchange':
      return entry.onVyslu
        ? t.log.talonExchangeVyslu(name(entry.player), entry.discard)
        : t.log.talonExchange(name(entry.player), entry.discard);
    case 'whist-decision':
      if (entry.decision === 'whist') return t.log.whistWhist(name(entry.player));
      if (entry.decision === 'half-whist') return t.log.whistHalf(name(entry.player));
      return t.log.whistPass(name(entry.player));
    case 'play-card':
      return t.log.playCard(name(entry.player), entry.card);
    case 'deal-result-raspasovka':
      return t.log.raspasovkaResult;
    case 'deal-result-contract':
      return t.log.contractResult(name(entry.player), formatBidLocalized(entry.bid, t), entry.tricks, entry.made);
  }
}
