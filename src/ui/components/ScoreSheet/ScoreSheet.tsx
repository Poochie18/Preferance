import type { PlayerTotals } from '../../../engine/model/gameState';
import type { PlayerId } from '../../../engine/model/player';
import { PLAYER_NAMES } from '../../log';

interface Props {
  totals: Record<PlayerId, PlayerTotals>;
  dealNumber: number;
  pulyaLength: number;
}

export function ScoreSheet({ totals, dealNumber, pulyaLength }: Props) {
  return (
    <div className="panel score-sheet">
      <h3>
        Пуля: здача {Math.min(dealNumber, pulyaLength)} / {pulyaLength}
      </h3>
      <table>
        <thead>
          <tr>
            <th>Гравець</th>
            <th>Гра</th>
            <th>Гора</th>
          </tr>
        </thead>
        <tbody>
          {([0, 1, 2] as PlayerId[]).map((p) => (
            <tr key={p}>
              <td>{PLAYER_NAMES[p]}</td>
              <td>{totals[p].game}</td>
              <td>{totals[p].gora}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
