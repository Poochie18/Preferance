import type { PlayerTotals } from '../../../engine/model/gameState';
import { PLAYER_IDS } from '../../../engine/model/player';
import { useTranslation } from '../../../i18n';
import type { PlayerId } from '../../../engine/model/player';

interface Props {
  totals: Record<PlayerId, PlayerTotals>;
  dealNumber: number;
  pulyaLength: number;
}

/**
 * Classic score sheet, one row per player: pulya, gora, and the whists that player
 * has written on each opponent (grouped under one header so the table stays short).
 */
export function ScoreSheet({ totals, dealNumber, pulyaLength }: Props) {
  const { t } = useTranslation();
  const shownTotal = Number.isFinite(pulyaLength) ? pulyaLength : dealNumber;
  return (
    <div className="panel score-sheet">
      <table>
        <thead>
          <tr>
            <th rowSpan={2} className="score-sheet-title">
              {t.scoreSheet.dealCounter(Math.min(dealNumber, shownTotal), shownTotal)}
            </th>
            <th rowSpan={2}>{t.scoreSheet.pulya}</th>
            <th rowSpan={2}>{t.scoreSheet.gora}</th>
            <th colSpan={PLAYER_IDS.length} className="score-sheet-whists">
              {t.scoreSheet.whists} →
            </th>
          </tr>
          <tr className="score-sheet-targets">
            {PLAYER_IDS.map((target) => (
              <th key={target} className="score-sheet-whists">
                {t.playerNames[target]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLAYER_IDS.map((p) => (
            <tr key={p}>
              <th scope="row">{t.playerNames[p]}</th>
              <td>{totals[p].pulya}</td>
              <td>{totals[p].gora}</td>
              {PLAYER_IDS.map((target) => (
                <td key={target} className="score-sheet-whists">
                  {p === target ? '—' : totals[p].whists[target]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
