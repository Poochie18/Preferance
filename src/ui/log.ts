import type { GameState } from '../engine/model/gameState';
import type { DealAction } from '../engine/reducer/dealReducer';
import { formatBid } from '../engine/model/bid';
import { cardLabel } from './cardLabel';

export const PLAYER_NAMES = ['Ви', 'Бот 1', 'Бот 2'];

export function describeAction(action: DealAction): string {
  const name = PLAYER_NAMES[action.player];
  switch (action.type) {
    case 'BID':
      return action.bid === 'pass' ? `${name}: пас.` : `${name} заявляє: ${formatBid(action.bid)}.`;
    case 'EXCHANGE_TALON':
      return `${name} бере прикуп і скидає ${action.discard.map(cardLabel).join(', ')}${
        action.onVyslu ? ' (гра на вислу)' : ''
      }.`;
    case 'WHIST_DECISION': {
      const label = action.decision === 'whist' ? 'віст' : action.decision === 'half-whist' ? 'півваста' : 'пас';
      return `${name}: ${label}.`;
    }
    case 'PLAY_CARD':
      return `${name} ходить ${cardLabel(action.card)}.`;
  }
}

function contractLabel(kind: string, level: number, trump?: string): string {
  if (kind === 'suit') return `${level}${trump === 'nt' ? 'б/к' : trump}`;
  if (kind === 'misere') return 'мізер';
  if (kind === 'misere-ouvert') return 'відкритий мізер';
  return 'гора';
}

export function describeDealResult(state: GameState): string | null {
  if (state.deal.phase.tag !== 'scored') return null;
  const result = state.deal.phase.result;
  if (!result.contract) return 'Розпасовка завершена — прикуп нікому не допоміг.';
  const { contract } = result;
  const name = PLAYER_NAMES[contract.declarer];
  const label = contractLabel(contract.kind, contract.level, contract.trump);
  const got = result.tricksByPlayer[contract.declarer];
  const made = contract.kind === 'suit' ? got >= contract.level : contract.kind === 'gora' ? got === 10 : got === 0;
  return `${name} грав(ла) "${label}", взяв(ла) ${got} взяток — контракт ${made ? 'виконано' : 'провалено'}.`;
}
