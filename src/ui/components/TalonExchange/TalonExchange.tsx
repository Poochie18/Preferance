import { useState } from 'react';
import type { Card } from '../../../engine/model/card';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { isEligibleForVyslu } from '../../../engine/rules/scoring';
import { formatBid, type Bid } from '../../../engine/model/bid';

interface Props {
  combinedHand: Card[];
  finalBid: Bid;
  declarerGora: number;
  onConfirm: (discard: [Card, Card], onVyslu: boolean) => void;
}

function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function TalonExchange({ combinedHand, finalBid, declarerGora, onConfirm }: Props) {
  const [selected, setSelected] = useState<Card[]>([]);
  const [onVyslu, setOnVyslu] = useState(false);
  const eligible = isEligibleForVyslu(declarerGora);

  function toggle(card: Card) {
    setSelected((prev) => {
      if (prev.some((c) => sameCard(c, card))) return prev.filter((c) => !sameCard(c, card));
      if (prev.length >= 2) return prev;
      return [...prev, card];
    });
  }

  return (
    <div className="panel talon-exchange">
      <h3>
        Прикуп узято. Ваша заявка: {formatBid(finalBid)}. Скиньте 2 карти ({selected.length}/2).
      </h3>
      <div className="hand">
        {combinedHand.map((c) => {
          const isSelected = selected.some((s) => sameCard(s, c));
          return (
            <button
              key={`${c.suit}${c.rank}`}
              className={`card ${isRedSuit(c.suit) ? 'red' : 'black'} ${isSelected ? 'selected' : ''}`}
              onClick={() => toggle(c)}
            >
              {cardLabel(c)}
            </button>
          );
        })}
      </div>
      {eligible && (
        <label className="vyslu-toggle">
          <input type="checkbox" checked={onVyslu} onChange={(e) => setOnVyslu(e.target.checked)} />
          Грати на вислу
        </label>
      )}
      <button disabled={selected.length !== 2} onClick={() => onConfirm([selected[0], selected[1]], onVyslu)}>
        Підтвердити
      </button>
    </div>
  );
}
