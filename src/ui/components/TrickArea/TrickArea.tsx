import type { CompletedTrick, TrickCardPlay } from '../../../engine/model/gameState';
import { cardLabel, isRedSuit } from '../../cardLabel';
import { useTranslation } from '../../../i18n';

interface Props {
  plays: TrickCardPlay[];
  /** Shown, with its winner marked, until the next trick's first card lands. */
  lastTrick?: CompletedTrick;
}

export function TrickArea({ plays, lastTrick }: Props) {
  const { t } = useTranslation();
  const showLast = plays.length === 0 && !!lastTrick;
  const shown = showLast ? lastTrick.plays : plays;
  return (
    <div className={`trick-area ${showLast ? 'is-last' : ''}`}>
      {shown.length === 0 && <p className="trick-empty">{t.trick.empty}</p>}
      {shown.map((p) => {
        const isWinner = showLast && p.player === lastTrick.winner;
        return (
          <div key={p.player} className={`trick-card ${isWinner ? 'is-winner' : ''}`}>
            <span className="trick-player">{isWinner ? t.trick.takenBy(t.playerNames[p.player]) : t.playerNames[p.player]}</span>
            <span className={`card ${isRedSuit(p.card.suit) ? 'red' : 'black'}`}>{cardLabel(p.card)}</span>
          </div>
        );
      })}
    </div>
  );
}
