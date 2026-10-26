import type { LogEntry } from '../../log';
import { renderLogEntry } from '../../log';
import { useTranslation } from '../../../i18n';

export function GameLog({ lines }: { lines: LogEntry[] }) {
  const { t } = useTranslation();
  return (
    <div className="panel game-log">
      <h3>{t.gameLog.title}</h3>
      <div className="game-log-lines">
        {lines.slice(-50).map((entry, i) => (
          <div key={i}>{renderLogEntry(entry, t)}</div>
        ))}
      </div>
    </div>
  );
}
