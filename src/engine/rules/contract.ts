import type { Bid } from '../model/bid';
import type { PlayerId } from '../model/player';
import type { Contract } from '../model/gameState';

export function contractFromBid(declarer: PlayerId, bid: Bid, onVyslu = false): Contract {
  if (bid.kind === 'suit') {
    return { declarer, kind: 'suit', level: bid.level, trump: bid.trump, onVyslu };
  }
  if (bid.kind === 'gora') {
    return { declarer, kind: 'gora', level: 10, onVyslu };
  }
  // misere / misere-ouvert: declarer commits to taking zero tricks
  return { declarer, kind: bid.kind, level: 0, onVyslu };
}

/** Total tricks (out of 10) the declarer must take to fulfill this contract. */
export function tricksNeededForContract(contract: Contract): number {
  if (contract.kind === 'suit') return contract.level;
  if (contract.kind === 'misere' || contract.kind === 'misere-ouvert') return 0;
  if (contract.kind === 'gora') return 10;
  throw new Error('Unknown contract kind');
}

export function contractHasTrump(contract: Contract): boolean {
  return contract.kind === 'suit' && contract.trump !== 'nt' && contract.trump !== undefined;
}
