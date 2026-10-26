import { getLegalBids, type BiddingState } from '../../../engine/rules/bidding';
import { formatBid, type Bid } from '../../../engine/model/bid';

interface Props {
  biddingState: BiddingState;
  onBid: (bid: Bid | 'pass') => void;
}

export function BiddingControls({ biddingState, onBid }: Props) {
  const legal = getLegalBids(biddingState);
  return (
    <div className="panel bidding-controls">
      <h3>Торг — ваш хід</h3>
      <div className="bid-grid">
        {legal.map((bid) => (
          <button key={formatBid(bid)} onClick={() => onBid(bid)}>
            {formatBid(bid)}
          </button>
        ))}
      </div>
      <button className="pass-button" onClick={() => onBid('pass')}>
        Пас
      </button>
    </div>
  );
}
