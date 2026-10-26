import type { PlayerTotals } from '../../../engine/model/gameState';
import type { PlayerId } from '../../../engine/model/player';
import { useTranslation } from '../../../i18n';

interface Props {
  totals: Record<PlayerId, PlayerTotals>;
  dealNumber: number;
  pulyaLength: number;
}

export function ScoreSheet({ totals, dealNumber, pulyaLength }: Props) {
  const { t } = useTranslation();
  const shownTotal = Number.isFinite(pulyaLength) ? pulyaLength : dealNumber;
  return (
    <div className="panel score-sheet">
      <h3>{t.scoreSheet.pulya(Math.min(dealNumber, shownTotal), shownTotal)}</h3>
      <table>
        <thead>
          <tr>
            <th>{t.scoreSheet.player}</th>
            <th>{t.scoreSheet.game}</th>
            <th>{t.scoreSheet.gora}</th>
          </tr>
        </thead>
        <tbody>
          {([0, 1, 2] as PlayerId[]).map((p) => (
            <tr key={p}>
              <td>{t.playerNames[p]}</td>
              <td>{totals[p].game}</td>
              <td>{totals[p].gora}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
