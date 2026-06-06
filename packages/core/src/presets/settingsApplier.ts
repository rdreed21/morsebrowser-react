import type { SerializedSetting } from './types';

export interface MorseSettingsSnapshot {
  charWPM: number;
  effectiveWPM: number;
  syncWpm: boolean;
  koVolume: number;
  xtraWordSpaceDits: number;
  stickySets: string;
  ifStickySets: boolean;
  hideList: boolean;
  showRaw: boolean;
  darkMode: boolean;
  autoCloseLessonAccordion: boolean;
  ifCustomGroup: boolean;
  customGroup: string;
  voiceEnabled: boolean;
  voiceSpelling: boolean;
  voiceThinkingTime: number;
  voiceAfterThinkingTime: number;
  voiceLastOnly: boolean;
  manualVoice: boolean;
  speakFirst: boolean;
  numberOfRepeats: number;
  speakFirstAdditionalWordspaces: number;
  newlineChunking: boolean;
  syncSize: boolean;
  ifOverrideMinMax: boolean;
  overrideMin: number;
  overrideMax: number;
  cardSpace: number;
  speedInterval: boolean;
  intervalTimingsText: string;
  intervalWpmText: string;
  intervalFwpmText: string;
  voiceBufferMaxLength: number;
  voiceVolume: number;
  isShuffled: boolean;
  shuffleIntraGroup: boolean;
}

export interface PresetSettingsMutator {
  setCharWPM: (v: number) => void;
  setEffectiveWPM: (v: number) => void;
  setSyncWpm: (v: boolean) => void;
  setKoVolume: (v: number) => void;
  setXtraWordSpaceDits: (v: number) => void;
  setStickySets: (v: string) => void;
  setIfStickySets: (v: boolean) => void;
  setHideList: (v: boolean) => void;
  setShowRaw: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  setAutoCloseLessonAccordion: (v: boolean) => void;
  setIfCustomGroup: (v: boolean) => void;
  setCustomGroup: (v: string) => void;
  setVoiceEnabled: (v: boolean) => void;
  setVoiceSpelling: (v: boolean) => void;
  setVoiceThinkingTime: (v: number) => void;
  setVoiceAfterThinkingTime: (v: number) => void;
  setVoiceLastOnly: (v: boolean) => void;
  setManualVoice: (v: boolean) => void;
  setSpeakFirst: (v: boolean) => void;
  setNumberOfRepeats: (v: number) => void;
  setSpeakFirstAdditionalWordspaces: (v: number) => void;
  setNewlineChunking: (v: boolean) => void;
  setSyncSize: (v: boolean) => void;
  setIfOverrideMinMax: (v: boolean) => void;
  setOverrideMin: (v: number) => void;
  setOverrideMax: (v: number) => void;
  setCardSpace: (v: number) => void;
  setSpeedInterval: (v: boolean) => void;
  setIntervalTimingsText: (v: string) => void;
  setIntervalWpmText: (v: string) => void;
  setIntervalFwpmText: (v: string) => void;
  setVoiceBufferMaxLength: (v: number) => void;
  setIsShuffled: (v: boolean) => void;
  setShuffleIntraGroup: (v: boolean) => void;
}

function booleanize(val: unknown): boolean {
  if (val === true || val === 'true' || val === '1') return true;
  if (val === false || val === 'false' || val === '0') return false;
  return Boolean(val);
}

function asNumber(val: unknown, fallback = 0): number {
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return Number.isFinite(n) ? n : fallback;
}

function asString(val: unknown): string {
  return val === undefined || val === null ? '' : String(val);
}

type KeyHandler = (value: unknown, mutator: PresetSettingsMutator) => void;

const KEY_HANDLERS: Record<string, KeyHandler> = {
  wpm: (v, m) => m.setCharWPM(asNumber(v, 20)),
  fwpm: (v, m) => m.setEffectiveWPM(asNumber(v, 20)),
  syncWpm: (v, m) => m.setSyncWpm(booleanize(v)),
  xtraWordSpaceDits: (v, m) => {
    let n = asNumber(v, 1);
    if (n === 0) n = 1;
    m.setXtraWordSpaceDits(n);
  },
  stickySets: (v, m) => m.setStickySets(asString(v)),
  ifStickySets: (v, m) => m.setIfStickySets(booleanize(v)),
  hideList: (v, m) => m.setHideList(booleanize(v)),
  showRaw: (v, m) => m.setShowRaw(booleanize(v)),
  darkMode: (v, m) => m.setDarkMode(booleanize(v)),
  autoCloseLessonAccordian: (v, m) => m.setAutoCloseLessonAccordion(booleanize(v)),
  ifCustomGroup: (v, m) => m.setIfCustomGroup(booleanize(v)),
  customGroup: (v, m) => m.setCustomGroup(asString(v)),
  voiceEnabled: (v, m) => m.setVoiceEnabled(booleanize(v)),
  voiceSpelling: (v, m) => m.setVoiceSpelling(booleanize(v)),
  voiceThinkingTime: (v, m) => m.setVoiceThinkingTime(asNumber(v, 0)),
  voiceAfterThinkingTime: (v, m) => m.setVoiceAfterThinkingTime(asNumber(v, 0)),
  voiceLastOnly: (v, m) => m.setVoiceLastOnly(booleanize(v)),
  voiceRecap: (v, m) => m.setManualVoice(booleanize(v)),
  speakFirst: (v, m) => m.setSpeakFirst(booleanize(v)),
  numberOfRepeats: (v, m) => m.setNumberOfRepeats(asNumber(v, 0)),
  speakFirstRepeats: (v, m) => m.setNumberOfRepeats(asNumber(v, 0)),
  speakFirstAdditionalWordspaces: (v, m) => m.setSpeakFirstAdditionalWordspaces(asNumber(v, 0)),
  keepLines: (v, m) => m.setNewlineChunking(booleanize(v)),
  syncSize: (v, m) => m.setSyncSize(booleanize(v)),
  overrideSize: (v, m) => m.setIfOverrideMinMax(booleanize(v)),
  overrideSizeMin: (v, m) => m.setOverrideMin(asNumber(v, 3)),
  overrideSizeMax: (v, m) => m.setOverrideMax(asNumber(v, 3)),
  cardSpace: (v, m) => m.setCardSpace(asNumber(v, 0)),
  speedInterval: (v, m) => m.setSpeedInterval(booleanize(v)),
  intervalTimingsText: (v, m) => m.setIntervalTimingsText(asString(v)),
  intervalWpmText: (v, m) => m.setIntervalWpmText(asString(v)),
  intervalFwpmText: (v, m) => m.setIntervalFwpmText(asString(v)),
  voiceBufferMaxLength: (v, m) => m.setVoiceBufferMaxLength(asNumber(v, 1)),
  isShuffledSet: (v, m) => m.setIsShuffled(booleanize(v)),
  shuffleIntraGroup: (v, m) => m.setShuffleIntraGroup(booleanize(v)),
};

export function applySerializedSettings(
  entries: SerializedSetting[],
  mutator: PresetSettingsMutator,
  keyBlacklist: readonly string[] = [],
): void {
  const blacklist = new Set(keyBlacklist);
  for (const entry of entries) {
    if (blacklist.has(entry.key)) continue;
    const handler = KEY_HANDLERS[entry.key];
    if (handler) handler(entry.value, mutator);
  }
}

export function snapshotToSerialized(snapshot: MorseSettingsSnapshot): SerializedSetting[] {
  return [
    { key: 'wpm', value: snapshot.charWPM },
    { key: 'fwpm', value: snapshot.effectiveWPM },
    { key: 'xtraWordSpaceDits', value: snapshot.xtraWordSpaceDits },
    { key: 'volume', value: snapshot.koVolume },
    { key: 'stickySets', value: snapshot.stickySets },
    { key: 'ifStickySets', value: snapshot.ifStickySets },
    { key: 'syncWpm', value: snapshot.syncWpm },
    { key: 'hideList', value: snapshot.hideList },
    { key: 'showRaw', value: snapshot.showRaw },
    { key: 'darkMode', value: snapshot.darkMode },
    { key: 'autoCloseLessonAccordian', value: snapshot.autoCloseLessonAccordion },
    { key: 'ifCustomGroup', value: snapshot.ifCustomGroup },
    { key: 'customGroup', value: snapshot.customGroup },
    { key: 'voiceEnabled', value: snapshot.voiceEnabled },
    { key: 'voiceSpelling', value: snapshot.voiceSpelling },
    { key: 'voiceThinkingTime', value: snapshot.voiceThinkingTime },
    { key: 'voiceAfterThinkingTime', value: snapshot.voiceAfterThinkingTime },
    { key: 'voiceVolume', value: snapshot.voiceVolume },
    { key: 'voiceLastOnly', value: snapshot.voiceLastOnly },
    { key: 'voiceRecap', value: snapshot.manualVoice },
    { key: 'speakFirst', value: snapshot.speakFirst },
    { key: 'numberOfRepeats', value: snapshot.numberOfRepeats },
    { key: 'speakFirstAdditionalWordspaces', value: snapshot.speakFirstAdditionalWordspaces },
    { key: 'keepLines', value: snapshot.newlineChunking },
    { key: 'syncSize', value: snapshot.syncSize },
    { key: 'overrideSize', value: snapshot.ifOverrideMinMax },
    { key: 'overrideSizeMin', value: snapshot.overrideMin },
    { key: 'overrideSizeMax', value: snapshot.overrideMax },
    { key: 'cardSpace', value: snapshot.cardSpace },
    { key: 'speedInterval', value: snapshot.speedInterval },
    { key: 'intervalTimingsText', value: snapshot.intervalTimingsText },
    { key: 'intervalWpmText', value: snapshot.intervalWpmText },
    { key: 'intervalFwpmText', value: snapshot.intervalFwpmText },
    { key: 'voiceBufferMaxLength', value: snapshot.voiceBufferMaxLength },
    { key: 'isShuffledSet', value: snapshot.isShuffled },
    { key: 'shuffleIntraGroup', value: snapshot.shuffleIntraGroup },
  ];
}
