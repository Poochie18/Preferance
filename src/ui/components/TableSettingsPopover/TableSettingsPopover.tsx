import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';

interface Props {
  paused: boolean;
  pauseEnabled: boolean;
  onTogglePause: () => void;
  onClose: () => void;
}

export function TableSettingsPopover({ paused, pauseEnabled, onTogglePause, onClose }: Props) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const s = t.settings;

  return (
    <div className="panel table-settings-popover">
      <div className="table-settings-header">
        <h3>{t.menu.settings}</h3>
        <button className="popover-close" onClick={onClose} aria-label={s.back}>
          ×
        </button>
      </div>

      {pauseEnabled && (
        <button className="popover-pause-button" onClick={onTogglePause}>
          {paused ? t.table.resume : t.table.pause}
        </button>
      )}

      <fieldset className="scale-field">
        <legend>{s.cardScale.label}</legend>
        <input
          type="range"
          min={0.75}
          max={2.5}
          step={0.05}
          value={settings.cardScale}
          onChange={(e) => updateSettings({ cardScale: Number(e.target.value) })}
        />
        <div className="scale-preview">
          <span
            className="card black"
            style={{
              width: `${54 * settings.cardScale}px`,
              height: `${76 * settings.cardScale}px`,
              fontSize: `${18 * settings.cardScale}px`,
            }}
          >
            ♠A
          </span>
        </div>
      </fieldset>

      <fieldset className="scale-field">
        <legend>{s.textScale.label}</legend>
        <input
          type="range"
          min={0.85}
          max={1.6}
          step={0.05}
          value={settings.textScale}
          onChange={(e) => updateSettings({ textScale: Number(e.target.value) })}
        />
        <div className="scale-preview">
          <span style={{ fontSize: `${16 * settings.textScale}px` }}>{s.textScale.example}</span>
        </div>
      </fieldset>
    </div>
  );
}
