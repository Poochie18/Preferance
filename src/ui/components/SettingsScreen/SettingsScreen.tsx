import { useTranslation } from '../../../i18n';
import { useSettings } from '../../../settings/context';
import { BackButton } from '../BackButton/BackButton';
import type {
  FinalDealMode,
  GameType,
  MisereBiddingMode,
  PointsTarget,
  RozpasovkaExit,
  SuitLayout,
  WhistPenaltyMode,
  WhistStyle,
  WinCondition,
} from '../../../settings/types';

const GAME_TYPES: GameType[] = ['sochi', 'rostov', 'leningrad'];
const POINTS_TARGETS: PointsTarget[] = [10, 20, 30, 40, 50];
const ROZPASOVKA_EXITS: RozpasovkaExit[] = ['6-6-6', '6-7-7', '6-7-8'];

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const s = t.settings;

  return (
    <div className="settings-screen panel">
      <BackButton onClick={onBack} label={t.newGame.back} />
      <h1>{s.title}</h1>

      <div className="settings-grid">
        <fieldset>
          <legend>{s.gameType.label}</legend>
          {GAME_TYPES.map((gt) => (
            <label key={gt} className="radio-row">
              <input
                type="radio"
                name="gameType"
                checked={settings.gameType === gt}
                onChange={() => updateSettings({ gameType: gt })}
              />
              {s.gameType[gt]}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>{s.winCondition.label}</legend>
          <label className="radio-row">
            <input
              type="radio"
              name="winCondition"
              checked={settings.winCondition === 'points'}
              onChange={() => updateSettings({ winCondition: 'points' as WinCondition })}
            />
            {s.winCondition.points}
          </label>
          {settings.winCondition === 'points' && (
            <select
              value={settings.pointsTarget}
              onChange={(e) => updateSettings({ pointsTarget: Number(e.target.value) as PointsTarget })}
            >
              {POINTS_TARGETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
          <label className="radio-row">
            <input
              type="radio"
              name="winCondition"
              checked={settings.winCondition === 'time'}
              onChange={() => updateSettings({ winCondition: 'time' as WinCondition })}
            />
            {s.winCondition.time}
          </label>
          {settings.winCondition === 'time' && (
            <span className="inline-number">
              <input
                type="number"
                min={5}
                max={240}
                value={settings.timeTargetMinutes}
                onChange={(e) => updateSettings({ timeTargetMinutes: Number(e.target.value) })}
              />{' '}
              {s.winCondition.minutes}
            </span>
          )}
        </fieldset>

        <fieldset>
          <legend>{s.whistStyle.label}</legend>
          {(['gentlemanly', 'cutthroat'] as WhistStyle[]).map((v) => (
            <label key={v} className="radio-row">
              <input
                type="radio"
                name="whistStyle"
                checked={settings.whistStyle === v}
                onChange={() => updateSettings({ whistStyle: v })}
              />
              {s.whistStyle[v]}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>{s.whistPenaltyMode.label}</legend>
          <label className="radio-row">
            <input
              type="radio"
              name="whistPenaltyMode"
              checked={settings.whistPenaltyMode === 'responsible'}
              onChange={() => updateSettings({ whistPenaltyMode: 'responsible' as WhistPenaltyMode })}
            />
            {s.whistPenaltyMode.responsible}
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="whistPenaltyMode"
              checked={settings.whistPenaltyMode === 'half-responsible'}
              onChange={() => updateSettings({ whistPenaltyMode: 'half-responsible' as WhistPenaltyMode })}
            />
            {s.whistPenaltyMode.halfResponsible}
          </label>
        </fieldset>

        <fieldset>
          <legend>{s.rozpasovkaExit.label}</legend>
          <select
            value={settings.rozpasovkaExit}
            onChange={(e) => updateSettings({ rozpasovkaExit: e.target.value as RozpasovkaExit })}
          >
            {ROZPASOVKA_EXITS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset>
          <legend>{s.finalDealMode.label}</legend>
          {(['settled', 'whisted'] as FinalDealMode[]).map((v) => (
            <label key={v} className="radio-row">
              <input
                type="radio"
                name="finalDealMode"
                checked={settings.finalDealMode === v}
                onChange={() => updateSettings({ finalDealMode: v })}
              />
              {s.finalDealMode[v]}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>{s.misereBiddingMode.label}</legend>
          <label className="radio-row">
            <input
              type="radio"
              name="misereBiddingMode"
              checked={settings.misereBiddingMode === 'with-talon'}
              onChange={() => updateSettings({ misereBiddingMode: 'with-talon' as MisereBiddingMode })}
            />
            {s.misereBiddingMode.withTalon}
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="misereBiddingMode"
              checked={settings.misereBiddingMode === 'blind'}
              onChange={() => updateSettings({ misereBiddingMode: 'blind' as MisereBiddingMode })}
            />
            {s.misereBiddingMode.blind}
          </label>
        </fieldset>

        <fieldset>
          <legend>{s.suitLayout.label}</legend>
          {(['grouped-by-color', 'alternating'] as SuitLayout[]).map((v) => (
            <label key={v} className="radio-row">
              <input
                type="radio"
                name="suitLayout"
                checked={settings.suitLayout === v}
                onChange={() => updateSettings({ suitLayout: v })}
              />
              {v === 'grouped-by-color' ? s.suitLayout.groupedByColor : s.suitLayout.alternating}
            </label>
          ))}
        </fieldset>

        <fieldset>
          <label className="radio-row">
            <input
              type="checkbox"
              checked={settings.pauseEnabled}
              onChange={(e) => updateSettings({ pauseEnabled: e.target.checked })}
            />
            {s.pauseEnabled.label}
          </label>
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

      <div className="scale-section">
        <fieldset className="scale-field card-scale-field">
          <legend>{s.cardScale.label}</legend>
          <input
            type="range"
            min={0.75}
            max={2.5}
            step={0.05}
            value={settings.cardScale}
            onChange={(e) => updateSettings({ cardScale: Number(e.target.value) })}
          />
          <div className="scale-preview card-scale-preview">
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
      </div>
    </div>
  );
}
