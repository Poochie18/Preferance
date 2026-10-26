import type { WhistDecision } from '../../../engine/model/gameState';
import { useTranslation } from '../../../i18n';

interface Props {
  onDecide: (decision: WhistDecision) => void;
}

export function WhistControls({ onDecide }: Props) {
  const { t } = useTranslation();
  return (
    <div className="panel whist-controls">
      <h3>{t.whist.title}</h3>
      <button onClick={() => onDecide('whist')}>{t.whist.whist}</button>
      <button onClick={() => onDecide('half-whist')}>{t.whist.halfWhist}</button>
      <button onClick={() => onDecide('pass')}>{t.whist.pass}</button>
    </div>
  );
}
