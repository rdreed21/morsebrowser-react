import { YOUR_SETTINGS_PRESET, DEFAULT_PRESET_KEY_BLACKLIST } from '../presets/types';
import {
  buildPresetOptions,
  mergeLegacyMixin,
  applyPresetOverrides,
  resolvePresetSetFile,
  fetchSettingsPresetsForLesson,
} from '../presets/presetLoader';
import { applySerializedSettings, snapshotToSerialized } from '../presets/settingsApplier';

describe('presets', () => {
  it('buildPresetOptions includes Your Settings first', () => {
    const options = buildPresetOptions([{ display: 'Default 12/8', filename: 'BC1_Default.json' }]);
    expect(options[0]).toEqual(YOUR_SETTINGS_PRESET);
    expect(options[1]?.display).toBe('Default 12/8');
  });

  it('resolvePresetSetFile maps BC1 class', () => {
    expect(resolvePresetSetFile('BC1', '')).toBe('bc1.json');
  });

  it('mergeLegacyMixin adds missing shuffle keys', () => {
    const merged = mergeLegacyMixin([{ key: 'wpm', value: 12 }]);
    expect(merged.some(s => s.key === 'isShuffledSet')).toBe(true);
    expect(merged.some(s => s.key === 'shuffleIntraGroup')).toBe(true);
  });

  it('applyPresetOverrides matches lesson file names', () => {
    const base = [{ key: 'ifStickySets', value: false }];
    const { settings, overridden } = applyPresetOverrides(base, '', 'IB228BK5.json');
    expect(overridden).toBe(true);
    expect(settings.find(s => s.key === 'ifStickySets')?.value).toBe(true);
  });

  it('applySerializedSettings maps speakFirstRepeats to numberOfRepeats', () => {
    let repeats = -1;
    applySerializedSettings(
      [{ key: 'speakFirstRepeats', value: 3 }],
      { setNumberOfRepeats: (v: number) => { repeats = v; } } as never,
    );
    expect(repeats).toBe(3);
  });

  it('applyPresetOverrides keeps overridden true when later rules miss', () => {
    const base = [{ key: 'ifStickySets', value: false }];
    const { overridden } = applyPresetOverrides(base, '', 'IB228BK5.json');
    expect(overridden).toBe(true);
  });

  it('applySerializedSettings maps wpm to char WPM setter', () => {
    const calls: Array<[string, unknown]> = [];
    applySerializedSettings(
      [{ key: 'wpm', value: 18 }, { key: 'fwpm', value: 15 }],
      {
        setCharWPM: (v: number) => calls.push(['charWPM', v]),
        setEffectiveWPM: (v: number) => calls.push(['effectiveWPM', v]),
      } as never,
    );
    expect(calls).toContainEqual(['charWPM', 18]);
    expect(calls).toContainEqual(['effectiveWPM', 15]);
  });

  it('snapshotToSerialized round-trips core speed fields', () => {
    const serialized = snapshotToSerialized({
      charWPM: 20,
      effectiveWPM: 18,
      syncWpm: true,
      koVolume: 7,
      xtraWordSpaceDits: 2,
      stickySets: 'BK',
      ifStickySets: false,
      hideList: true,
      showRaw: false,
      darkMode: false,
      autoCloseLessonAccordion: false,
      ifCustomGroup: false,
      customGroup: '',
      voiceEnabled: false,
      voiceSpelling: true,
      voiceThinkingTime: 0,
      voiceAfterThinkingTime: 0,
      voiceLastOnly: false,
      manualVoice: false,
      speakFirst: false,
      numberOfRepeats: 0,
      speakFirstAdditionalWordspaces: 0,
      newlineChunking: false,
      syncSize: true,
      ifOverrideMinMax: false,
      overrideMin: 3,
      overrideMax: 3,
      cardSpace: 0,
      speedInterval: false,
      intervalTimingsText: '',
      intervalWpmText: '',
      intervalFwpmText: '',
      voiceBufferMaxLength: 1,
      voiceVolume: 10,
      isShuffled: false,
      shuffleIntraGroup: false,
    });
    expect(serialized.find(s => s.key === 'wpm')?.value).toBe(20);
    expect(serialized.find(s => s.key === 'fwpm')?.value).toBe(18);
  });

  it('applies volume and voiceVolume like KO (not blacklisted)', () => {
    const calls: Array<[string, unknown]> = [];
    applySerializedSettings(
      [{ key: 'volume', value: 7 }, { key: 'voiceVolume', value: 4 }],
      {
        setKoVolume: (v: number) => calls.push(['koVolume', v]),
        setVoiceVolume: (v: number) => calls.push(['voiceVolume', v]),
      } as never,
      DEFAULT_PRESET_KEY_BLACKLIST,
    );
    expect(calls).toContainEqual(['koVolume', 7]);
    expect(calls).toContainEqual(['voiceVolume', 4]);
  });

  it('volume keys survive a snapshot -> serialize -> apply round-trip', () => {
    const serialized = snapshotToSerialized({
      charWPM: 20,
      effectiveWPM: 18,
      syncWpm: true,
      koVolume: 6,
      xtraWordSpaceDits: 1,
      stickySets: '',
      ifStickySets: false,
      hideList: false,
      showRaw: false,
      darkMode: false,
      autoCloseLessonAccordion: false,
      ifCustomGroup: false,
      customGroup: '',
      voiceEnabled: false,
      voiceSpelling: false,
      voiceThinkingTime: 0,
      voiceAfterThinkingTime: 0,
      voiceLastOnly: false,
      manualVoice: false,
      speakFirst: false,
      numberOfRepeats: 0,
      speakFirstAdditionalWordspaces: 0,
      newlineChunking: false,
      syncSize: false,
      ifOverrideMinMax: false,
      overrideMin: 3,
      overrideMax: 3,
      cardSpace: 0,
      speedInterval: false,
      intervalTimingsText: '',
      intervalWpmText: '',
      intervalFwpmText: '',
      voiceBufferMaxLength: 1,
      voiceVolume: 3,
      isShuffled: false,
      shuffleIntraGroup: false,
    });
    let koVolume = -1;
    let voiceVolume = -1;
    // Proxy: real setters for the volume keys, no-ops for everything else.
    const mutator = new Proxy({
      setKoVolume: (v: number) => { koVolume = v; },
      setVoiceVolume: (v: number) => { voiceVolume = v; },
    }, {
      get: (target, prop) => (prop in target
        ? target[prop as keyof typeof target]
        : () => {}),
    });
    applySerializedSettings(serialized, mutator as never, DEFAULT_PRESET_KEY_BLACKLIST);
    expect(koVolume).toBe(6);
    expect(voiceVolume).toBe(3);
  });

  it('loads preset set for BC1 via fetch', async () => {
    const fetchMock = jest.fn(async (url: string) => {
      if (url.endsWith('/presets/sets/bc1.json')) {
        return {
          ok: true,
          json: async () => ({
            options: [{ display: 'Default 12/8', filename: 'BC1_Default.json' }],
          }),
        };
      }
      return { ok: false };
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const presets = await fetchSettingsPresetsForLesson('BC1', '');
    expect(presets).toHaveLength(2);
    expect(presets[1].display).toBe('Default 12/8');
  });
});
