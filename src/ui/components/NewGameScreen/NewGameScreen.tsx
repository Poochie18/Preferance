import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import type { BotDifficulty } from '../../../ai/types';

const DIFFICULTIES: BotDifficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABEL: Record<BotDifficulty, string> = { easy: 'Легкий', medium: 'Середній', hard: 'Важкий' };

export function NewGameScreen() {
  const { startGame } = useGame();
  const [bot1, setBot1] = useState<BotDifficulty>('easy');
  const [bot2, setBot2] = useState<BotDifficulty>('easy');

  return (
    <div className="new-game">
      <h1>Преферанс — Сочинка</h1>
      <p>Ви граєте проти двох ботів. Одна пуля — 10 здач.</p>
      <div className="difficulty-pickers">
        <label>
          Бот 1:
          <select value={bot1} onChange={(e) => setBot1(e.target.value as BotDifficulty)}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Бот 2:
          <select value={bot2} onChange={(e) => setBot2(e.target.value as BotDifficulty)}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="start-button" onClick={() => startGame({ bot1Difficulty: bot1, bot2Difficulty: bot2 })}>
        Почати гру
      </button>
    </div>
  );
}
