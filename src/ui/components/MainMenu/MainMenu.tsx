import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';
import { useGame } from '../../context/GameContext';
import type { BotDifficulty } from '../../../ai/types';

const DIFFICULTIES: BotDifficulty[] = ['easy', 'medium', 'hard'];

interface Props {
  onSettings: () => void;
}

export function MainMenu({ onSettings }: Props) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { startGame } = useGame();

  return (
    <div className="main-menu panel">
      <h1>{t.menu.title}</h1>
      <p className="main-menu-subtitle">{t.menu.subtitle}</p>

      <div className="difficulty-pickers">
        <label>
          {t.newGame.bot1}
          <select
            value={settings.bot1Difficulty}
            onChange={(e) => updateSettings({ bot1Difficulty: e.target.value as BotDifficulty })}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {t.newGame.difficulty[d]}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t.newGame.bot2}
          <select
            value={settings.bot2Difficulty}
            onChange={(e) => updateSettings({ bot2Difficulty: e.target.value as BotDifficulty })}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {t.newGame.difficulty[d]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="main-menu-actions">
        <button className="start-button" onClick={startGame}>
          {t.menu.newGame}
        </button>
        <button onClick={onSettings}>{t.menu.settings}</button>
      </div>
    </div>
  );
}
