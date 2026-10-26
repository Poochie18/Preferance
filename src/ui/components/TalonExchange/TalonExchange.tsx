import { useState } from 'react';
import type { Card } from '../../../engine/model/card';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { isEligibleForVyslu } from '../../../engine/rules/scoring';
import type { Bid } from '../../../engine/model/bid';
import { formatBidLocalized } from '../../formatBid';
import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';
import { sortHand } from '../../handSort';
import type { RulesConfig } from '../../../engine/rules/rulesConfig';

interface Props {
  combinedHand: Card[];
  finalBid: Bid;
  declarerGora: number;
  rulesConfig: RulesConfig;
  onConfirm: (discard: [Card, Card], onVyslu: boolean) => void;
}

function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function TalonExchange({ combinedHand, finalBid, declarerGora, rulesConfig, onConfirm }: Props) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [selected, setSelected] = useState<Card[]>([]);
  const [onVyslu, setOnVyslu] = useState(false);
  const eligible = isEligibleForVyslu(declarerGora, rulesConfig);
  const sorted = sortHand(combinedHand, settings.suitLayout);

  function toggle(card: Card) {
    setSelected((prev) => {
      if (prev.some((c) => sameCard(c, card))) return prev.filter((c) => !sameCard(c, card));
      if (prev.length >= 2) return prev;
      return [...prev, card];
    });
  }

  return (
    <div className="panel talon-exchange">
      <h3>{t.talon.title(formatBidLocalized(finalBid, t), selected.length)}</h3>
      <div className="hand">
        {sorted.map((c) => {
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
          {t.talon.playOnVyslu}
        </label>
      )}
      <button disabled={selected.length !== 2} onClick={() => onConfirm([selected[0], selected[1]], onVyslu)}>
        {t.talon.confirm}
      </button>
    </div>
  );
}
