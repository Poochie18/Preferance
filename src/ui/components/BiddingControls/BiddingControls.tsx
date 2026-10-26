import { getLegalBids, type BiddingState } from '../../../engine/rules/bidding';
import { bidRank, type Bid } from '../../../engine/model/bid';
import { formatBidLocalized } from '../../formatBid';
import { useTranslation } from '../../../i18n';

interface Props {
  biddingState: BiddingState;
  onBid: (bid: Bid | 'pass') => void;
}

export function BiddingControls({ biddingState, onBid }: Props) {
  const { t } = useTranslation();
  const legal = getLegalBids(biddingState);
  return (
    <div className="panel bidding-controls">
      <h3>{t.bidding.title}</h3>
      <div className="bid-grid">
        {legal.map((bid) => (
          <button key={bidRank(bid)} onClick={() => onBid(bid)}>
            {formatBidLocalized(bid, t)}
          </button>
        ))}
      </div>
      <button className="pass-button" onClick={() => onBid('pass')}>
        {t.bidding.pass}
      </button>
    </div>
  );
}
