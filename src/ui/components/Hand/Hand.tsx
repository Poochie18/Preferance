import type { Card } from '../../../engine/model/card';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { sortHand } from '../../handSort';
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
    <div className="hand">
      {sorted.map((c) => {
        const legal = !legalCards || legalCards.some((l) => l.suit === c.suit && l.rank === c.rank);
        return (
          <button
            key={`${c.suit}${c.rank}`}
            className={`card ${isRedSuit(c.suit) ? 'red' : 'black'} ${legal ? '' : 'disabled'}`}
            disabled={!legal || !onPlay}
            onClick={() => onPlay?.(c)}
          >
            {cardLabel(c)}
          </button>
        );
      })}
    </div>
  );
}
