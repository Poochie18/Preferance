import type { CSSProperties } from 'react';
import { getLegalBids, type BiddingState } from '../../../engine/rules/bidding';
import { allPossibleBids, bidEquals, bidRank, MIN_LEVEL, TRUMP_ORDER, type Bid } from '../../../engine/model/bid';
import { formatBidLocalized } from '../../formatBid';
import { useTranslation } from '../../../i18n';

interface Props {
  biddingState: BiddingState;
  onBid: (bid: Bid | 'pass') => void;
}

/** Fixed cell for every bid: levels as rows (6 at the top), trumps as columns in rank order, specials last. */
function cellPosition(bid: Bid, specialIndex: number): CSSProperties {
  if (bid.kind === 'suit') {
    return { gridRow: bid.level - MIN_LEVEL + 1, gridColumn: TRUMP_ORDER.indexOf(bid.trump) + 1 };
  }
  return { gridRow: specialIndex + 1, gridColumn: TRUMP_ORDER.length + 1 };
}

/**
 * The whole bid ladder as a fixed table, so nothing moves while bidding goes on:
 * bids at or below the current high bid stay in place but are disabled.
 */
export function BiddingControls({ biddingState, onBid }: Props) {
  const { t } = useTranslation();
  const legal = getLegalBids(biddingState);
  const { highBid } = biddingState;
  let specialIndex = 0;
  return (
    <div className="panel bidding-controls">
      <div className="controls-header">
        <h3>{t.bidding.title}</h3>
        <button className="primary-action" onClick={() => onBid('pass')}>
          {t.bidding.pass}
        </button>
      </div>
      <div className="bid-grid">
        {allPossibleBids().map((bid) => {
          const isCurrent = !!highBid && bidEquals(bid, highBid);
          const classes = [bid.kind === 'suit' ? '' : 'bid-special', isCurrent ? 'is-current' : ''].filter(Boolean);
          return (
            <button
              key={bidRank(bid)}
              className={classes.join(' ') || undefined}
              style={cellPosition(bid, bid.kind === 'suit' ? 0 : specialIndex++)}
              disabled={!legal.some((l) => bidEquals(l, bid))}
              onClick={() => onBid(bid)}
            >
              {formatBidLocalized(bid, t)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
