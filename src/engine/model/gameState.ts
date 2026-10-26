import type { Card } from './card';
import type { PlayerId } from './player';
import type { Bid, ContractKind, TrumpOption } from './bid';
import type { RulesConfig } from '../rules/rulesConfig';

export type WhistDecision = 'whist' | 'half-whist' | 'pass';

export interface Contract {
  declarer: PlayerId;
  kind: ContractKind;
  /** Tricks declarer commits to take; 0 for misere/misere-ouvert (must take none), 10 for gora. */
  level: number;
  trump?: TrumpOption;
  /** Set when declarer opted to play this contract "на вислу" after crossing the gora threshold. */
  onVyslu?: boolean;
}

export interface BidEntry {
  player: PlayerId;
  bid: Bid | 'pass';
}

export interface TrickCardPlay {
  player: PlayerId;
  card: Card;
}

export interface CompletedTrick {
  plays: TrickCardPlay[];
  winner: PlayerId;
}

export interface PlayerDelta {
  game: number;
  gora: number;
}

export interface DealResult {
  contract: Contract | null; // null => rozpasovka
  tricksByPlayer: Record<PlayerId, number>;
  whistDecisions: Partial<Record<PlayerId, WhistDecision>>;
  pointsDelta: Record<PlayerId, PlayerDelta>;
}

export type DealPhase =
  | { tag: 'bidding'; turn: PlayerId; bids: BidEntry[]; highBid?: Bid; highBidder?: PlayerId; passed: PlayerId[] }
  | { tag: 'talonExchange'; declarer: PlayerId; finalBid: Bid }
  | { tag: 'contractDeclared'; contract: Contract }
  | {
      tag: 'whistDecisions';
      contract: Contract;
      turn: PlayerId;
      order: PlayerId[];
      decisions: Partial<Record<PlayerId, WhistDecision>>;
    }
  | {
      tag: 'trickPlay';
      contract: Contract | null;
      whistDecisions: Partial<Record<PlayerId, WhistDecision>>;
      tricks: CompletedTrick[];
      currentTrick: TrickCardPlay[];
      turn: PlayerId;
    }
  | { tag: 'scored'; result: DealResult };

export interface DealState {
  dealNumber: number;
  dealer: PlayerId;
  hands: Record<PlayerId, Card[]>;
  talon: Card[];
  /** Declarer's 2 discarded cards; counted as declarer's own tricks at scoring time. */
  discard: Card[];
  phase: DealPhase;
}

export interface PlayerTotals {
  game: number;
  gora: number;
}

export interface GameState {
  totals: Record<PlayerId, PlayerTotals>;
  pulyaLength: number;
  rulesConfig: RulesConfig;
  sessionStartedAt: number;
  deal: DealState;
  history: DealResult[];
}

export interface PlayerView {
  viewer: PlayerId;
  dealNumber: number;
  pulyaLength: number;
  dealer: PlayerId;
  myHand: Card[];
  handCounts: Record<PlayerId, number>;
  /** Revealed only to the declarer once picked up, or to everyone for misere-ouvert. */
  openHands?: Partial<Record<PlayerId, Card[]>>;
  phase: DealPhase;
  totals: Record<PlayerId, PlayerTotals>;
}
