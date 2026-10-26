import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { GameSettings } from './types';
import { loadSettings, writeSettingsCookie } from './cookies';

interface SettingsContextValue {
  settings: GameSettings;
  updateSettings: (patch: Partial<GameSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const DEBOUNCED_FIELDS = new Set<keyof GameSettings>(['cardScale', 'textScale']);
const COOKIE_WRITE_DEBOUNCE_MS = 300;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      const onlyDebouncedFields = Object.keys(patch).every((key) => DEBOUNCED_FIELDS.has(key as keyof GameSettings));
      if (onlyDebouncedFields) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => writeSettingsCookie(next), COOKIE_WRITE_DEBOUNCE_MS);
      } else {
        writeSettingsCookie(next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--card-scale', String(settings.cardScale));
    document.documentElement.style.setProperty('--text-scale', String(settings.textScale));
  }, [settings.cardScale, settings.textScale]);

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
