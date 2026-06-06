import {
  DEFAULT_SETTINGS, loadSettings, saveSettings, resetSettings,
} from '../settings/settingsManager';
import { KO_COOKIE_KEYS } from '../settings/cookieStorage';

function mockDocumentCookie(initial = ''): void {
  let store = initial;
  Object.defineProperty(global, 'document', {
    value: {
      get cookie() { return store; },
      set cookie(value: string) {
        const [pair] = value.split(';');
        const eq = pair.indexOf('=');
        const name = pair.slice(0, eq);
        const val = pair.slice(eq + 1);
        if (val === '' || value.includes('1970')) {
          store = store.split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith(`${name}=`))
            .join('; ');
        } else {
          const existing = store ? `${store}; ` : '';
          const filtered = existing.split('; ')
            .filter(s => s && !s.startsWith(`${name}=`))
            .join('; ');
          store = filtered ? `${filtered}; ${name}=${val}` : `${name}=${val}`;
        }
      },
    },
    configurable: true,
  });
}

describe('settingsManager', () => {
  beforeEach(() => {
    mockDocumentCookie('');
  });

  it('defaults match KO licwdefaults timing', () => {
    expect(DEFAULT_SETTINGS.timing.charWPM).toBe(12);
    expect(DEFAULT_SETTINGS.timing.effectiveWPM).toBe(12);
    expect(DEFAULT_SETTINGS.timing.frequency).toBe(500);
  });

  it('loads from KO cookie keys', () => {
    mockDocumentCookie('wpm=20; fwpm=15; ditFrequency=600; volume=8');
    const s = loadSettings();
    expect(s.timing.charWPM).toBe(20);
    expect(s.timing.effectiveWPM).toBe(15);
    expect(s.timing.frequency).toBe(600);
    expect(s.timing.volume).toBeCloseTo(0.8, 5);
  });

  it('saves using KO cookie key names', () => {
    saveSettings({
      timing: { charWPM: 18, effectiveWPM: 12, frequency: 550, volume: 0.5, rampTime: 0.005 },
      lessonId: 'lesson_1',
    });
    expect(document.cookie).toContain(`${KO_COOKIE_KEYS.wpm}=18`);
    expect(document.cookie).toContain(`${KO_COOKIE_KEYS.fwpm}=12`);
    expect(document.cookie).toContain(`${KO_COOKIE_KEYS.ditFrequency}=550`);
    expect(document.cookie).toContain(`${KO_COOKIE_KEYS.volume}=5`);
  });

  it('reset clears KO cookies', () => {
    saveSettings(DEFAULT_SETTINGS);
    resetSettings();
    expect(document.cookie).not.toContain(KO_COOKIE_KEYS.wpm);
  });
});
