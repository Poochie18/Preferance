import type { ReactElement } from 'react';
import { useTranslation } from '../../../i18n';
import type { Locale } from '../../../i18n/types';
import { FlagGB, FlagRU, FlagUA } from './flags';

const LOCALES: Locale[] = ['ru', 'uk', 'en'];
const LOCALE_FLAG: Record<Locale, () => ReactElement> = { ru: FlagRU, uk: FlagUA, en: FlagGB };
const LOCALE_TITLE: Record<Locale, string> = { ru: 'Русский', uk: 'Українська', en: 'English' };

export function LanguageCorner() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="language-corner">
      {LOCALES.map((l) => {
        const Flag = LOCALE_FLAG[l];
        return (
          <button
            key={l}
            className={`flag-button ${l === locale ? 'flag-active' : ''}`}
            title={LOCALE_TITLE[l]}
            aria-label={LOCALE_TITLE[l]}
            onClick={() => setLocale(l)}
          >
            <Flag />
          </button>
        );
      })}
    </div>
  );
}
