import type { Locale, TranslationKeys } from './types';
import { ru } from './ru';
import { uk } from './uk';
import { en } from './en';
import { useSettings } from '../settings/context';

export type { Locale, TranslationKeys };

export const TRANSLATIONS: Record<Locale, TranslationKeys> = { ru, uk, en };

export function useTranslation(): { t: TranslationKeys; locale: Locale; setLocale: (locale: Locale) => void } {
  const { settings, updateSettings } = useSettings();
  return {
    t: TRANSLATIONS[settings.language],
    locale: settings.language,
    setLocale: (locale: Locale) => updateSettings({ language: locale }),
  };
}
