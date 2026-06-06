/**
 * Settings persistence — keys match KO app cookies for upgrade path.
 * KO uses individual js-cookie keys (wpm, fwpm, ditFrequency, volume, …).
 */
import type { MorseSettings } from '@morsebrowser/types';
import {
  KO_COOKIE_KEYS,
  getAllCookies,
  getCookie,
  removeCookie,
  setCookie,
} from './cookieStorage';

/** KO licwdefaults.json timing values */
export const DEFAULT_SETTINGS: MorseSettings = {
  timing: { charWPM: 12, effectiveWPM: 12, frequency: 500, volume: 1.0, rampTime: 0.005 },
  lessonId: 'lesson_1',
};

/** KO volume cookie is 0–10 integer; core uses 0.0–1.0 */
function koVolumeToNormalized(koVolume: number): number {
  return Math.min(1, Math.max(0, koVolume / 10));
}

function normalizedVolumeToKo(volume: number): number {
  return Math.round(Math.min(1, Math.max(0, volume)) * 10);
}

function parseIntCookie(key: string, fallback: number): number {
  const raw = getCookie(key);
  if (raw === undefined) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Load settings from KO cookies, falling back to defaults */
export function loadSettings(): MorseSettings {
  try {
    const cookies = getAllCookies();
    const hasKoCookies = KO_COOKIE_KEYS.wpm in cookies || KO_COOKIE_KEYS.fwpm in cookies;
    if (!hasKoCookies) return { ...DEFAULT_SETTINGS };

    const charWPM      = parseIntCookie(KO_COOKIE_KEYS.wpm,  DEFAULT_SETTINGS.timing.charWPM);
    const effectiveWPM = parseIntCookie(KO_COOKIE_KEYS.fwpm, DEFAULT_SETTINGS.timing.effectiveWPM);
    const frequency    = parseIntCookie(KO_COOKIE_KEYS.ditFrequency, DEFAULT_SETTINGS.timing.frequency);
    const koVolume     = parseIntCookie(KO_COOKIE_KEYS.volume, normalizedVolumeToKo(DEFAULT_SETTINGS.timing.volume));

    return {
      timing: {
        charWPM,
        effectiveWPM: Math.min(effectiveWPM, charWPM),
        frequency,
        volume: koVolumeToNormalized(koVolume),
        rampTime: DEFAULT_SETTINGS.timing.rampTime,
      },
      lessonId: DEFAULT_SETTINGS.lessonId,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Persist timing settings using KO cookie key names */
export function saveSettings(s: MorseSettings): void {
  const { timing } = s;
  setCookie(KO_COOKIE_KEYS.wpm,          String(Math.round(timing.charWPM)));
  setCookie(KO_COOKIE_KEYS.fwpm,         String(Math.round(Math.min(timing.effectiveWPM, timing.charWPM))));
  setCookie(KO_COOKIE_KEYS.ditFrequency, String(Math.round(timing.frequency)));
  setCookie(KO_COOKIE_KEYS.dahFrequency, String(Math.round(timing.frequency)));
  setCookie(KO_COOKIE_KEYS.volume,         String(normalizedVolumeToKo(timing.volume)));
  setCookie(KO_COOKIE_KEYS.syncWpm,      String(timing.charWPM === timing.effectiveWPM));
  setCookie(KO_COOKIE_KEYS.syncFreq,     'true');
}

export function resetSettings(): void {
  for (const key of Object.values(KO_COOKIE_KEYS)) {
    removeCookie(key);
  }
}
