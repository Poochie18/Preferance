import type { WhistDecision } from '../../../engine/model/gameState';

interface Props {
  onDecide: (decision: WhistDecision) => void;
}

export function WhistControls({ onDecide }: Props) {
  return (
    <div className="panel whist-controls">
      <h3>Ваше рішення по вісту</h3>
      <button onClick={() => onDecide('whist')}>Віст</button>
      <button onClick={() => onDecide('half-whist')}>Півваста</button>
      <button onClick={() => onDecide('pass')}>Пас</button>
    </div>
  );
}
