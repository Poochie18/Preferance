import { useGame } from '../../context/GameContext';
import { useSettings } from '../../../settings/context';
import { useTranslation } from '../../../i18n';
import type { BotDifficulty } from '../../../ai/types';

const DIFFICULTIES: BotDifficulty[] = ['easy', 'medium', 'hard'];

export function NewGameScreen({ onBack }: { onBack: () => void }) {
  const { startGame } = useGame();
  const { settings, updateSettings } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="new-game panel">
      <h1>{t.newGame.title}</h1>
      <p>{t.newGame.subtitle}</p>
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
      <button className="start-button" onClick={startGame}>
        {t.newGame.start}
      </button>
      <button className="back-button" onClick={onBack}>
        {t.newGame.back}
      </button>
    </div>
  );
}
