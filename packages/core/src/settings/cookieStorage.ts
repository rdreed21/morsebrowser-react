/**
 * Cookie helpers matching KO app persistence (js-cookie keys via saveCookie extender).
 * KO stores each setting as its own cookie — not a single localStorage blob.
 */

export const KO_COOKIE_KEYS = {
  wpm:          'wpm',
  fwpm:         'fwpm',
  syncWpm:      'syncWpm',
  ditFrequency: 'ditFrequency',
  dahFrequency: 'dahFrequency',
  syncFreq:     'syncFreq',
  volume:       'volume',
} as const;

const COOKIE_DAYS = 365;

function hasDocument(): boolean {
  return typeof document !== 'undefined' && typeof document.cookie === 'string';
}

export function getCookie(name: string): string | undefined {
  if (!hasDocument()) return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return undefined;
}

export function setCookie(name: string, value: string, days = COOKIE_DAYS): void {
  if (!hasDocument()) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

export function removeCookie(name: string): void {
  if (!hasDocument()) return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

export function getAllCookies(): Record<string, string> {
  if (!hasDocument()) return {};
  const out: Record<string, string> = {};
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      out[trimmed.slice(0, eq)] = decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return out;
}
