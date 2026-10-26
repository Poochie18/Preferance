import { DEFAULT_SETTINGS } from './defaults';
import type { GameSettings } from './types';

const COOKIE_NAME = 'preferans_settings';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function readSettingsCookie(): Partial<GameSettings> | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const value = match.slice(COOKIE_NAME.length + 1);
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export function writeSettingsCookie(settings: GameSettings): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}; max-age=${MAX_AGE_SECONDS}; path=/; SameSite=Lax`;
}

export function loadSettings(): GameSettings {
  const stored = readSettingsCookie();
  return { ...DEFAULT_SETTINGS, ...stored };
}
