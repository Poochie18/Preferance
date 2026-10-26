import { useTranslation } from '../../../i18n';
import type { Locale } from '../../../i18n/types';

const LOCALES: Locale[] = ['ru', 'uk', 'en'];
const LOCALE_LABEL: Record<Locale, string> = { ru: 'Русский', uk: 'Українська', en: 'English' };

interface Props {
  onNewGame: () => void;
  onSettings: () => void;
}

export function MainMenu({ onNewGame, onSettings }: Props) {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div className="main-menu panel">
      <h1>{t.menu.title}</h1>
      <p className="main-menu-subtitle">{t.menu.subtitle}</p>

      <div className="language-picker">
        <span>{t.menu.language}:</span>
        {LOCALES.map((l) => (
          <button key={l} className={l === locale ? 'lang-active' : ''} onClick={() => setLocale(l)}>
            {LOCALE_LABEL[l]}
          </button>
        ))}
      </div>

      <div className="main-menu-actions">
        <button className="start-button" onClick={onNewGame}>
          {t.menu.newGame}
        </button>
        <button onClick={onSettings}>{t.menu.settings}</button>
      </div>
    </div>
  );
}
