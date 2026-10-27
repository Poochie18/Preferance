import type { CSSProperties } from 'react';
import type { Card } from '../../../engine/model/card';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { sortHand, startsSuitGroup, suitGroupBreaks } from '../../handSort';
import { CardIndex } from '../CardIndex/CardIndex';
import { useSettings } from '../../../settings/context';

interface HandProps {
  cards: Card[];
  legalCards?: Card[];
  onPlay?: (card: Card) => void;
}

export function Hand({ cards, legalCards, onPlay }: HandProps) {
  const { settings } = useSettings();
  const sorted = sortHand(cards, settings.suitLayout);
  return (
    <div className="hand" style={{ '--count': sorted.length, '--breaks': suitGroupBreaks(sorted) } as CSSProperties}>
      {sorted.map((c, i) => {
        const legal = !legalCards || legalCards.some((l) => l.suit === c.suit && l.rank === c.rank);
        return (
          <button
            key={`${c.suit}${c.rank}`}
            aria-label={cardLabel(c)}
            className={`card ${isRedSuit(c.suit) ? 'red' : 'black'} ${legal ? '' : 'disabled'} ${startsSuitGroup(sorted, i) ? 'suit-start' : ''}`}
            disabled={!legal || !onPlay}
            onClick={() => onPlay?.(c)}
          >
            <CardIndex card={c} />
          </button>
        );
      })}
    </div>
  );
}
