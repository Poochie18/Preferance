import type { Bid } from '../engine/model/bid';
import type { Card } from '../engine/model/card';
import type { DealResult, GameState, TrickCardPlay, WhistDecision } from '../engine/model/gameState';
import type { PlayerId } from '../engine/model/player';
import type { DealAction } from '../engine/reducer/dealReducer';
import { resolveTrick } from '../engine/rules/trick';

/**
 * One line of the in-game move history. Built only from what `viewer` is allowed
 * to know: a bot declarer's talon and discard stay hidden, the viewer's own are shown.
 */
export type HistoryEntry =
  | { kind: 'dealStart'; dealNumber: number; dealer: PlayerId }
  | { kind: 'bid'; player: PlayerId; bid: Bid | 'pass' }
  | { kind: 'passout' }
  | {
      kind: 'contract';
      player: PlayerId;
      bid: Bid;
      onVyslu: boolean;
      blind: boolean;
      talon?: Card[];
      discard?: Card[];
    }
  | { kind: 'whist'; player: PlayerId; decision: WhistDecision }
  | { kind: 'trick'; number: number; plays: TrickCardPlay[]; winner: PlayerId }
  | { kind: 'dealEnd'; result: DealResult };

export function dealStartEntry(game: GameState): HistoryEntry {
  return { kind: 'dealStart', dealNumber: game.deal.dealNumber, dealer: game.deal.dealer };
}

/** Entries produced by applying `action` to `prev`, which yielded `next`. */
export function historyForAction(
  prev: GameState,
  action: DealAction,
  next: GameState,
  viewer: PlayerId,
): HistoryEntry[] {
  const phase = prev.deal.phase;
  const entries: HistoryEntry[] = [];

  switch (action.type) {
    case 'BID': {
      entries.push({ kind: 'bid', player: action.player, bid: action.bid });
      if (next.deal.phase.tag === 'trickPlay' && next.deal.phase.contract === null) {
        entries.push({ kind: 'passout' });
      }
      break;
    }
    case 'EXCHANGE_TALON': {
      if (phase.tag !== 'talonExchange') break;
      const blind = action.discard.length === 0;
      const visible = action.player === viewer && !blind;
      entries.push({
        kind: 'contract',
        player: action.player,
        bid: phase.finalBid,
        onVyslu: action.onVyslu ?? false,
        blind,
        talon: visible ? prev.deal.talon : undefined,
        discard: visible ? action.discard : undefined,
      });
      break;
    }
    case 'WHIST_DECISION':
      entries.push({ kind: 'whist', player: action.player, decision: action.decision });
      break;
    case 'PLAY_CARD': {
      if (phase.tag !== 'trickPlay') break;
      const plays = [...phase.currentTrick, { player: action.player, card: action.card }];
      if (plays.length === 3) {
        entries.push({
          kind: 'trick',
          number: phase.tricks.length + 1,
          plays,
          winner: resolveTrick(plays, phase.contract),
        });
      }
      break;
    }
  }

  if (next.deal.phase.tag === 'scored' && phase.tag !== 'scored') {
    entries.push({ kind: 'dealEnd', result: next.deal.phase.result });
  }
  return entries;
}
