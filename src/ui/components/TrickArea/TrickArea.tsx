import type { TrickCardPlay } from '../../../engine/model/gameState';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { useTranslation } from '../../../i18n';

export function TrickArea({ plays }: { plays: TrickCardPlay[] }) {
  const { t } = useTranslation();
  return (
    <div className="trick-area">
      {plays.length === 0 && <p className="trick-empty">{t.trick.empty}</p>}
      {plays.map((p) => (
        <div key={p.player} className="trick-card">
          <span className="trick-player">{t.playerNames[p.player]}</span>
          <span className={`card ${isRedSuit(p.card.suit) ? 'red' : 'black'}`}>{cardLabel(p.card)}</span>
        </div>
      ))}
    </div>
  );
}
