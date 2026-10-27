import { useState, type CSSProperties } from 'react';
import type { Card } from '../../../engine/model/card';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { isEligibleForVyslu } from '../../../engine/rules/scoring';
import type { Bid } from '../../../engine/model/bid';
import { formatBidLocalized } from '../../formatBid';
import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';
import { sortHand, startsSuitGroup, suitGroupBreaks } from '../../handSort';
import { CardIndex } from '../CardIndex/CardIndex';
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
      <div className="controls-header">
        <h3>{t.talon.title(formatBidLocalized(finalBid, t), selected.length)}</h3>
        <div className="controls-header-actions">
          {eligible && (
            <label className="vyslu-toggle">
              <input type="checkbox" checked={onVyslu} onChange={(e) => setOnVyslu(e.target.checked)} />
              {t.talon.playOnVyslu}
            </label>
          )}
          <button
            className="primary-action"
            disabled={selected.length !== 2}
            onClick={() => onConfirm([selected[0], selected[1]], onVyslu)}
          >
            {t.talon.confirm}
          </button>
        </div>
      </div>
      <div className="hand" style={{ '--count': sorted.length, '--breaks': suitGroupBreaks(sorted) } as CSSProperties}>
        {sorted.map((c, i) => {
          const isSelected = selected.some((s) => sameCard(s, c));
          return (
            <button
              key={`${c.suit}${c.rank}`}
              aria-label={cardLabel(c)}
              className={`card ${isRedSuit(c.suit) ? 'red' : 'black'} ${isSelected ? 'selected' : ''} ${startsSuitGroup(sorted, i) ? 'suit-start' : ''}`}
              onClick={() => toggle(c)}
            >
              <CardIndex card={c} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
