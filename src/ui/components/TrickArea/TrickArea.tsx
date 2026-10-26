import type { TrickCardPlay } from '../../../engine/model/gameState';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { PLAYER_NAMES } from '../../log';

export function TrickArea({ plays }: { plays: TrickCardPlay[] }) {
  return (
    <div className="trick-area">
      {plays.length === 0 && <p className="trick-empty">Стіл порожній.</p>}
      {plays.map((p) => (
        <div key={p.player} className="trick-card">
          <span className="trick-player">{PLAYER_NAMES[p.player]}</span>
          <span className={`card ${isRedSuit(p.card.suit) ? 'red' : 'black'}`}>{cardLabel(p.card)}</span>
        </div>
      ))}
    </div>
  );
}
