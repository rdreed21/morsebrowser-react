import React, {
  createContext, useCallback, useContext, useMemo, useState, useEffect, useRef,
} from 'react';

export interface VoiceOption { idx: number; name: string; }
import {
  loadSettings, saveSettings, DEFAULT_SETTINGS, getCookie, setCookie, loadLessonFile,
  getApplicableSpeed,
} from '@morsebrowser/core';
import {
  generateCustomGroupPractice, generateRandomPractice, resolvePracticeSeconds,
} from '../utils/lessonPractice';
import type { WordListOption } from '@morsebrowser/core';
import type { MorseSettings } from '@morsebrowser/types';
import { getWords, rawTextCharCount } from '../utils/words';
import { formatPlayTime } from '../utils/formatTime';
import { getUrlParam, isDevBuild } from '../utils/urlParams';
import { hasLessonDeepLinkParams } from '../utils/lessonDeepLink';
import {
  createDefaultAccordionOpen,
  SETTINGS_ACCORDION_IDS,
  type SettingsAccordionId,
} from '../utils/settingsAccordion';

/** KO licwdefaults.json showingText */
export const DEFAULT_SHOWING_TEXT = '{CQ|c q} {LICW|l i c w}';

interface MorseAppContextValue {
  settings: MorseSettings;
  charWPM: number;
  effectiveWPM: number;
  syncWpm: boolean;
  setCharWPM: (v: number) => void;
  setEffectiveWPM: (v: number) => void;
  setSyncWpm: (v: boolean) => void;
  koVolume: number;
  setKoVolume: (v: number) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
  showingText: string;
  setShowingText: (t: string) => void;
  showRaw: boolean;
  setShowRaw: (v: boolean) => void;
  clearText: () => void;
  newlineChunking: boolean;
  setNewlineChunking: (v: boolean) => void;
  hideList: boolean;
  setHideList: (v: boolean) => void;
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  runningPlayMs: number;
  setRunningPlayMs: React.Dispatch<React.SetStateAction<number>>;
  charsPlayed: number;
  setCharsPlayed: React.Dispatch<React.SetStateAction<number>>;
  isShuffled: boolean;
  setIsShuffled: (v: boolean) => void;
  shuffleWords: (fromLoopRestart?: boolean) => void;
  loop: boolean;
  loopNoShuffle: boolean;
  toggleLoop: () => void;
  announceAccessibility: (msg: string) => void;
  words: string[];
  charCount: number;
  playingTime: ReturnType<typeof formatPlayTime>;
  timingConfig: MorseSettings['timing'];
  logoClick: () => void;
  isQueryStringSettingsOn: () => boolean;
  lessonDeepLinkPending: boolean;
  completeLessonDeepLink: () => void;
  applyLessonDeepLinkSelection: (
    className: string,
    letterGroupName: string,
    display: WordListOption | null,
  ) => void;
  isDev: boolean;
  morseDisabled: boolean;
  isSettingsAccordionOpen: (panelId: SettingsAccordionId) => boolean;
  toggleSettingsAccordion: (panelId: SettingsAccordionId) => void;
  collapseSettingsAccordions: () => void;
  closeLessonAccordionIfAutoClosing: () => void;
  userTarget: string;
  selectedClass: string;
  letterGroup: string;
  selectedDisplay: WordListOption | null;
  selectedPreset: string;
  setUserTarget: (v: string) => void;
  setSelectedClass: (v: string) => void;
  setLetterGroup: (v: string) => void;
  setSelectedDisplay: (v: WordListOption | null) => void;
  setSelectedPreset: (v: string) => void;
  ditFrequency: number;
  dahFrequency: number;
  syncFreq: boolean;
  setDitFrequency: (v: number) => void;
  setDahFrequency: (v: number) => void;
  setSyncFreq: (v: boolean) => void;
  preSpace: number;
  xtraWordSpaceDits: number;
  cardSpace: number;
  cardFontPx: number;
  cardsVisible: boolean;
  setPreSpace: (v: number) => void;
  setXtraWordSpaceDits: (v: number) => void;
  setCardSpace: (v: number) => void;
  setCardFontPx: (v: number) => void;
  setCardsVisible: (v: boolean) => void;
  ifCustomGroup: boolean;
  customGroup: string;
  ifOverrideTime: boolean;
  overrideMins: number;
  ifOverrideMinMax: boolean;
  overrideMin: number;
  overrideMax: number;
  syncSize: boolean;
  setIfCustomGroup: (v: boolean) => void;
  setCustomGroup: (v: string) => void;
  setIfOverrideTime: (v: boolean) => void;
  setOverrideMins: (v: number) => void;
  setIfOverrideMinMax: (v: boolean) => void;
  setOverrideMin: (v: number) => void;
  setOverrideMax: (v: number) => void;
  setSyncSize: (v: boolean) => void;
  applyEnabled: boolean;
  applyLesson: () => Promise<void>;
  randomizeLessons: boolean;
  autoCloseLessonAccordion: boolean;
  ifStickySets: boolean;
  stickySets: string;
  shuffleIntraGroup: boolean;
  speedInterval: boolean;
  intervalTimingsText: string;
  intervalWpmText: string;
  intervalFwpmText: string;
  numberOfRepeats: number;
  speakFirstAdditionalWordspaces: number;
  trailReveal: boolean;
  trailPreDelay: number;
  trailPostDelay: number;
  trailFinal: number;
  maxRevealedTrail: number;
  setRandomizeLessons: (v: boolean) => void;
  setAutoCloseLessonAccordion: (v: boolean) => void;
  setIfStickySets: (v: boolean) => void;
  setStickySets: (v: string) => void;
  setShuffleIntraGroup: (v: boolean) => void;
  setSpeedInterval: (v: boolean) => void;
  setIntervalTimingsText: (v: string) => void;
  setIntervalWpmText: (v: string) => void;
  setIntervalFwpmText: (v: string) => void;
  setNumberOfRepeats: (v: number) => void;
  setSpeakFirstAdditionalWordspaces: (v: number) => void;
  noiseType: 'off' | 'white' | 'brown' | 'pink';
  noiseVolume: number;
  setNoiseType: (v: 'off' | 'white' | 'brown' | 'pink') => void;
  setNoiseVolume: (v: number) => void;
  rssEnabled: boolean;
  rssFeedUrl: string;
  proxyUrl: string;
  rssPollMins: number;
  rssPlayMins: number;
  setRssFeedUrl: (v: string) => void;
  setProxyUrl: (v: string) => void;
  setRssPollMins: (v: number) => void;
  setRssPlayMins: (v: number) => void;
  setTrailReveal: (v: boolean) => void;
  setTrailPreDelay: (v: number) => void;
  setTrailPostDelay: (v: number) => void;
  setTrailFinal: (v: number) => void;
  setMaxRevealedTrail: (v: number) => void;
  voiceCapable: boolean;
  voiceEnabled: boolean;
  voiceSpelling: boolean;
  manualVoice: boolean;
  speakFirst: boolean;
  voiceThinkingTime: number;
  voiceThinkingTimeWpm: string | number;
  voiceAfterThinkingTime: number;
  voiceVoices: VoiceOption[];
  voiceVoiceIdx: number;
  voiceVolume: number;
  voiceLastOnly: boolean;
  voicePitch: number;
  voiceRate: number;
  voiceBufferMaxLength: number;
  setVoiceEnabled: (v: boolean) => void;
  setVoiceSpelling: (v: boolean) => void;
  setManualVoice: (v: boolean) => void;
  setSpeakFirst: (v: boolean) => void;
  setVoiceThinkingTime: (v: number) => void;
  setVoiceAfterThinkingTime: (v: number) => void;
  setVoiceVoiceIdx: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  setVoiceLastOnly: (v: boolean) => void;
  setVoicePitch: (v: number) => void;
  setVoiceRate: (v: number) => void;
  setVoiceBufferMaxLength: (v: number) => void;
  initVoices: () => void;
  flaggedWords: string;
  flaggedWordsCount: number;
  setFlaggedWords: (v: string) => void;
  clearFlaggedWords: () => void;
  loadFlaggedAsText: () => void;
  addFlaggedWord: (rawWord: string) => void;
}

const MorseAppContext = createContext<MorseAppContextValue | null>(null);

function readDarkMode(): boolean {
  const v = getCookie('darkMode');
  return v === 'true' || v === '1';
}

function readShowRaw(): boolean {
  const v = getCookie('showRaw');
  if (v === undefined) return true;
  return v === 'true' || v === '1';
}

function readNumCookie(key: string, fallback: number): number {
  const v = getCookie(key);
  if (v === undefined) return fallback;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function readBoolCookie(key: string, fallback: boolean): boolean {
  const v = getCookie(key);
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

function readStrCookie(key: string, fallback: string): string {
  const v = getCookie(key);
  return v === undefined ? fallback : v;
}

function readRssEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('rssEnabled');
}

function applyTheme(dark: boolean): void {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

export function MorseAppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<MorseSettings>(() => loadSettings());
  const [syncWpm, setSyncWpmState] = useState(() => getCookie('syncWpm') !== 'false');
  const [koVolume, setKoVolumeState] = useState(
    () => Math.round(settings.timing.volume * 10) || 10,
  );
  const [darkMode, setDarkMode] = useState(readDarkMode);
  const [showingText, setShowingText] = useState(DEFAULT_SHOWING_TEXT);
  const [showRaw, setShowRawState] = useState(readShowRaw);
  const [newlineChunking, setNewlineChunkingState] = useState(
    () => readBoolCookie('newlineChunking', false),
  );
  const [hideList, setHideList] = useState(() => getCookie('hideList') === 'true');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runningPlayMs, setRunningPlayMs] = useState(0);
  const [charsPlayed, setCharsPlayed] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [preShuffled, setPreShuffled] = useState('');
  const [loop, setLoop] = useState(() => readBoolCookie('loop', false));
  const [loopNoShuffle, setLoopNoShuffle] = useState(false);
  const announcerRef = useRef<HTMLDivElement | null>(null);
  const logoClickCountRef = useRef(0);
  const queryStringSettingsOnRef = useRef(false);
  const [lessonDeepLinkPending, setLessonDeepLinkPending] = useState(hasLessonDeepLinkParams);

  const [userTarget, setUserTargetState] = useState('STUDENT');
  const [selectedClass, setSelectedClassState] = useState('');
  const [letterGroup, setLetterGroupState] = useState('');
  const [selectedDisplay, setSelectedDisplayState] = useState<WordListOption | null>(null);
  const [selectedPreset, setSelectedPresetState] = useState('Your Settings');

  const [ditFrequency, setDitFrequencyState] = useState(
    () => readNumCookie('ditFrequency', settings.timing.frequency),
  );
  const [dahFrequency, setDahFrequencyState] = useState(
    () => readNumCookie('dahFrequency', settings.timing.frequency),
  );
  const [syncFreq, setSyncFreqState] = useState(() => readBoolCookie('syncFreq', true));
  const [preSpace, setPreSpaceState] = useState(() => readNumCookie('preSpace', 2));
  const [xtraWordSpaceDits, setXtraWordSpaceDitsState] = useState(
    () => readNumCookie('xtraWordSpaceDits', 1),
  );
  const [cardSpace, setCardSpaceState] = useState(() => readNumCookie('cardSpace', 0));
  const [cardFontPx, setCardFontPxState] = useState(() => readNumCookie('cardFontPx', 15));
  const [cardsVisible, setCardsVisibleState] = useState(() => readBoolCookie('cardsVisible', true));

  const [ifCustomGroup, setIfCustomGroupState] = useState(() => readBoolCookie('ifCustomGroup', false));
  const [customGroup, setCustomGroupState] = useState(() => readStrCookie('customGroup', ''));
  const [ifOverrideTime, setIfOverrideTimeState] = useState(() => readBoolCookie('ifOverrideTime', false));
  const [overrideMins, setOverrideMinsState] = useState(() => readNumCookie('overrideMins', 2));
  const [ifOverrideMinMax, setIfOverrideMinMaxState] = useState(() => readBoolCookie('ifOverrideMinMax', false));
  const [overrideMin, setOverrideMinState] = useState(() => readNumCookie('overrideMin', 3));
  const [overrideMax, setOverrideMaxState] = useState(() => readNumCookie('overrideMax', 3));
  const [syncSize, setSyncSizeState] = useState(() => readBoolCookie('syncSize', true));
  const [randomizeLessons, setRandomizeLessonsState] = useState(() => readBoolCookie('randomizeLessons', true));
  const [autoCloseLessonAccordion, setAutoCloseLessonAccordionState] = useState(
    () => readBoolCookie('autoCloseLessonAccordian', false),
  );
  const [settingsAccordionOpen, setSettingsAccordionOpen] = useState(
    createDefaultAccordionOpen,
  );
  const [ifStickySets, setIfStickySetsState] = useState(() => readBoolCookie('ifStickySets', false));
  const [stickySets, setStickySetsState] = useState(() => readStrCookie('stickySets', 'BK'));
  const [shuffleIntraGroup, setShuffleIntraGroupState] = useState(
    () => readBoolCookie('shuffleIntraGroup', false),
  );
  const [speedInterval, setSpeedIntervalState] = useState(() => readBoolCookie('speedInterval', false));
  const [intervalTimingsText, setIntervalTimingsTextState] = useState(
    () => readStrCookie('intervalTimingsText', ''),
  );
  const [intervalWpmText, setIntervalWpmTextState] = useState(() => readStrCookie('intervalWpmText', ''));
  const [intervalFwpmText, setIntervalFwpmTextState] = useState(() => readStrCookie('intervalFwpmText', ''));
  const [numberOfRepeats, setNumberOfRepeatsState] = useState(() => readNumCookie('numberOfRepeats', 0));
  const [speakFirstAdditionalWordspaces, setSpeakFirstAdditionalWordspacesState] = useState(
    () => readNumCookie('speakFirstAdditionalWordspaces', 0),
  );
  const [noiseType, setNoiseTypeState] = useState<'off' | 'white' | 'brown' | 'pink'>(() => {
    const v = readStrCookie('noiseType', 'off');
    return (v === 'white' || v === 'brown' || v === 'pink') ? v : 'off';
  });
  const [noiseVolume, setNoiseVolumeState] = useState(() => readNumCookie('noiseVolume', 2));
  const [rssEnabled] = useState(readRssEnabled);
  const [rssFeedUrl, setRssFeedUrlState] = useState(
    () => readStrCookie('rssFeedUrl', 'https://moxie.foxnews.com/feedburner/latest.xml'),
  );
  const [proxyUrl, setProxyUrlState] = useState(() => {
    // The proxy is concatenated with the feed URL (`${proxyUrl}${feedUrl}`),
    // so the default must end in '/' even if VITE_RSS_PROXY was set without one.
    const envProxy = (import.meta.env.VITE_RSS_PROXY || '').trim();
    const defaultProxy = envProxy
      ? (envProxy.endsWith('/') ? envProxy : `${envProxy}/`)
      : 'http://127.0.0.1:8085/';
    return readStrCookie('proxydUrl', defaultProxy);
  });
  const [rssPollMins, setRssPollMinsState] = useState(() => readNumCookie('rssPollMins', 5));
  const [rssPlayMins, setRssPlayMinsState] = useState(() => readNumCookie('rssPlayMins', 5));
  const [trailReveal, setTrailRevealState] = useState(() => readBoolCookie('trailReveal', false));
  const [trailPreDelay, setTrailPreDelayState] = useState(() => readNumCookie('trailPreDelay', 0));
  const [trailPostDelay, setTrailPostDelayState] = useState(() => readNumCookie('trailPostDelay', 0));
  const [trailFinal, setTrailFinalState] = useState(() => readNumCookie('trailFinal', 1));
  const [maxRevealedTrail, setMaxRevealedTrailState] = useState(-1);

  const voiceCapable = useMemo(
    () => typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && 'SpeechSynthesisUtterance' in window,
    [],
  );
  const [voiceEnabled, setVoiceEnabledState] = useState(() => readBoolCookie('voiceEnabled', false));
  const [voiceSpelling, setVoiceSpellingState] = useState(() => readBoolCookie('voiceSpelling', true));
  const [manualVoice, setManualVoiceState] = useState(() => readBoolCookie('voiceRecap', false));
  const [speakFirst, setSpeakFirstState] = useState(() => readBoolCookie('speakFirst', false));
  const [voiceThinkingTime, setVoiceThinkingTimeState] = useState(
    () => readNumCookie('voiceThinkingTime', 0),
  );
  const [voiceAfterThinkingTime, setVoiceAfterThinkingTimeState] = useState(
    () => readNumCookie('voiceAfterThinkingTime', 0),
  );
  const [voiceVoices, setVoiceVoices] = useState<VoiceOption[]>([]);
  const [voiceVoiceIdx, setVoiceVoiceIdxState] = useState(-1);
  const [voiceVolume, setVoiceVolumeState] = useState(() => readNumCookie('voiceVolume', 10));
  const [voiceLastOnly, setVoiceLastOnlyState] = useState(() => readBoolCookie('voiceLastOnly', false));
  const [voicePitch, setVoicePitchState] = useState(() => readNumCookie('voicePitch', 1));
  const [voiceRate, setVoiceRateState] = useState(() => readNumCookie('voiceRate', 1));
  const [voiceBufferMaxLength, setVoiceBufferMaxLengthState] = useState(
    () => readNumCookie('voiceBufferMaxLength', 1),
  );
  const [morseDisabled] = useState(() => getUrlParam('morseDisabled') === 'true');
  const isDev = useMemo(() => isDevBuild(), []);
  const [flaggedWords, setFlaggedWordsState] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('flaggedWords') ?? '';
    } catch {
      return '';
    }
  });
  const lastFlaggedMsRef = useRef(0);

  useEffect(() => { applyTheme(darkMode); }, [darkMode]);

  useEffect(() => {
    try {
      if (flaggedWords.trim()) {
        localStorage.setItem('flaggedWords', flaggedWords);
      } else {
        localStorage.removeItem('flaggedWords');
      }
    } catch {
      // Storage unavailable (private mode, etc.).
    }
  }, [flaggedWords]);

  const persistSettings = useCallback((next: MorseSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const setCharWPM = useCallback((v: number) => {
    const charWPM = Math.max(1, Math.round(v));
    const effectiveWPM = syncWpm ? charWPM : Math.min(settings.timing.effectiveWPM, charWPM);
    persistSettings({
      ...settings,
      timing: { ...settings.timing, charWPM, effectiveWPM, volume: koVolume / 10 },
    });
  }, [syncWpm, settings, koVolume, persistSettings]);

  const setEffectiveWPM = useCallback((v: number) => {
    const effectiveWPM = Math.min(Math.max(1, Math.round(v)), settings.timing.charWPM);
    persistSettings({
      ...settings,
      timing: { ...settings.timing, effectiveWPM, volume: koVolume / 10 },
    });
  }, [settings, koVolume, persistSettings]);

  const setSyncWpm = useCallback((v: boolean) => {
    setSyncWpmState(v);
    setCookie('syncWpm', String(v));
    if (v) setCharWPM(settings.timing.charWPM);
  }, [settings.timing.charWPM, setCharWPM]);

  const clampFreq = (v: number) => Math.min(1200, Math.max(100, Math.round(v / 10) * 10));

  const setDitFrequency = useCallback((v: number) => {
    const freq = clampFreq(v);
    setDitFrequencyState(freq);
    setCookie('ditFrequency', String(freq));
    persistSettings({
      ...settings,
      timing: { ...settings.timing, frequency: freq, volume: koVolume / 10 },
    });
    if (syncFreq) {
      setDahFrequencyState(freq);
      setCookie('dahFrequency', String(freq));
    }
  }, [settings, koVolume, syncFreq, persistSettings]);

  const setDahFrequency = useCallback((v: number) => {
    const freq = clampFreq(v);
    setDahFrequencyState(freq);
    setCookie('dahFrequency', String(freq));
  }, []);

  const setSyncFreq = useCallback((v: boolean) => {
    setSyncFreqState(v);
    setCookie('syncFreq', String(v));
    if (v) {
      setDahFrequencyState(ditFrequency);
      setCookie('dahFrequency', String(ditFrequency));
    }
  }, [ditFrequency]);

  const setPreSpace = useCallback((v: number) => {
    const n = Math.min(1200, Math.max(0, v));
    setPreSpaceState(n);
    setCookie('preSpace', String(n));
  }, []);

  const setXtraWordSpaceDits = useCallback((v: number) => {
    const n = Math.min(10, Math.max(1, Math.round(v)));
    setXtraWordSpaceDitsState(n);
    setCookie('xtraWordSpaceDits', String(n));
  }, []);

  const setCardSpace = useCallback((v: number) => {
    const n = Math.min(10, Math.max(0, Math.round(v)));
    setCardSpaceState(n);
    setCookie('cardSpace', String(n));
  }, []);

  const setCardFontPx = useCallback((v: number) => {
    const n = Math.min(1200, Math.max(1, Math.round(v)));
    setCardFontPxState(n);
    setCookie('cardFontPx', String(n));
  }, []);

  const setCardsVisible = useCallback((v: boolean) => {
    setCardsVisibleState(v);
    setCookie('cardsVisible', String(v));
  }, []);

  const setIfCustomGroup = useCallback((v: boolean) => {
    setIfCustomGroupState(v);
    setCookie('ifCustomGroup', String(v));
  }, []);

  const setCustomGroup = useCallback((v: string) => {
    setCustomGroupState(v);
    setCookie('customGroup', v);
  }, []);

  const setIfOverrideTime = useCallback((v: boolean) => {
    setIfOverrideTimeState(v);
    setCookie('ifOverrideTime', String(v));
  }, []);

  const setOverrideMins = useCallback((v: number) => {
    const n = Math.max(0, v);
    setOverrideMinsState(n);
    setCookie('overrideMins', String(n));
  }, []);

  const setIfOverrideMinMax = useCallback((v: boolean) => {
    setIfOverrideMinMaxState(v);
    setCookie('ifOverrideMinMax', String(v));
  }, []);

  const setOverrideMin = useCallback((v: number) => {
    const n = Math.max(1, Math.round(v));
    setOverrideMinState(n);
    setCookie('overrideMin', String(n));
    if (syncSize) {
      setOverrideMaxState(n);
      setCookie('overrideMax', String(n));
    }
  }, [syncSize]);

  const setOverrideMax = useCallback((v: number) => {
    const n = Math.max(overrideMin, Math.round(v));
    setOverrideMaxState(n);
    setCookie('overrideMax', String(n));
  }, [overrideMin]);

  const setSyncSize = useCallback((v: boolean) => {
    setSyncSizeState(v);
    setCookie('syncSize', String(v));
    if (v) {
      setOverrideMaxState(overrideMin);
      setCookie('overrideMax', String(overrideMin));
    }
  }, [overrideMin]);

  const setNewlineChunking = useCallback((v: boolean) => {
    setNewlineChunkingState(v);
    setCookie('newlineChunking', String(v));
  }, []);

  const setRandomizeLessons = useCallback((v: boolean) => {
    setRandomizeLessonsState(v);
    setCookie('randomizeLessons', String(v));
  }, []);

  const setAutoCloseLessonAccordion = useCallback((v: boolean) => {
    setAutoCloseLessonAccordionState(v);
    setCookie('autoCloseLessonAccordian', String(v));
  }, []);

  const setIfStickySets = useCallback((v: boolean) => {
    setIfStickySetsState(v);
    setCookie('ifStickySets', String(v));
  }, []);

  const setStickySets = useCallback((v: string) => {
    setStickySetsState(v);
    setCookie('stickySets', v);
  }, []);

  const setShuffleIntraGroup = useCallback((v: boolean) => {
    setShuffleIntraGroupState(v);
    setCookie('shuffleIntraGroup', String(v));
  }, []);

  const setSpeedInterval = useCallback((v: boolean) => {
    setSpeedIntervalState(v);
    setCookie('speedInterval', String(v));
  }, []);

  const setIntervalTimingsText = useCallback((v: string) => {
    setIntervalTimingsTextState(v);
    setCookie('intervalTimingsText', v);
  }, []);

  const setIntervalWpmText = useCallback((v: string) => {
    setIntervalWpmTextState(v);
    setCookie('intervalWpmText', v);
  }, []);

  const setIntervalFwpmText = useCallback((v: string) => {
    setIntervalFwpmTextState(v);
    setCookie('intervalFwpmText', v);
  }, []);

  const setNumberOfRepeats = useCallback((v: number) => {
    const n = Math.min(10, Math.max(0, Math.round(v)));
    setNumberOfRepeatsState(n);
    setCookie('numberOfRepeats', String(n));
  }, []);

  const setSpeakFirstAdditionalWordspaces = useCallback((v: number) => {
    const n = Math.min(10, Math.max(0, Math.round(v)));
    setSpeakFirstAdditionalWordspacesState(n);
    setCookie('speakFirstAdditionalWordspaces', String(n));
  }, []);

  const setNoiseType = useCallback((v: 'off' | 'white' | 'brown' | 'pink') => {
    setNoiseTypeState(v);
    setCookie('noiseType', v);
  }, []);

  const setNoiseVolume = useCallback((v: number) => {
    const n = Math.min(10, Math.max(1, Math.round(v)));
    setNoiseVolumeState(n);
    setCookie('noiseVolume', String(n));
  }, []);

  const setRssFeedUrl = useCallback((v: string) => {
    setRssFeedUrlState(v);
    setCookie('rssFeedUrl', v);
  }, []);

  const setProxyUrl = useCallback((v: string) => {
    setProxyUrlState(v);
    setCookie('proxydUrl', v);
  }, []);

  const setRssPollMins = useCallback((v: number) => {
    const n = Math.max(0, v);
    setRssPollMinsState(n);
    setCookie('rssPollMins', String(n));
  }, []);

  const setRssPlayMins = useCallback((v: number) => {
    const n = Math.max(0, v);
    setRssPlayMinsState(n);
    setCookie('rssPlayMins', String(n));
  }, []);

  const setTrailReveal = useCallback((v: boolean) => {
    setTrailRevealState(v);
    setCookie('trailReveal', String(v));
    if (!v) setMaxRevealedTrailState(-1);
  }, []);

  const setTrailPreDelay = useCallback((v: number) => {
    const n = Math.max(0, v);
    setTrailPreDelayState(n);
    setCookie('trailPreDelay', String(n));
  }, []);

  const setTrailPostDelay = useCallback((v: number) => {
    const n = Math.max(0, v);
    setTrailPostDelayState(n);
    setCookie('trailPostDelay', String(n));
  }, []);

  const setTrailFinal = useCallback((v: number) => {
    const n = Math.max(0, v);
    setTrailFinalState(n);
    setCookie('trailFinal', String(n));
  }, []);

  const setMaxRevealedTrail = useCallback((v: number) => {
    setMaxRevealedTrailState(v);
  }, []);

  const voiceThinkingTimeWpm = useMemo(() => {
    if (!voiceThinkingTime) return '--';
    const wpm = 3.6 / voiceThinkingTime;
    return wpm % 2 === 0 ? Math.round(wpm) : Math.round(wpm * 10) / 10;
  }, [voiceThinkingTime]);

  const initVoices = useCallback(() => {
    if (!voiceCapable) return;
    const list = window.speechSynthesis.getVoices().map((v, idx) => ({ idx, name: v.name }));
    setVoiceVoices(list);
    const savedName = readStrCookie('voiceVoiceName', '');
    if (savedName) {
      const match = list.find(v => v.name === savedName);
      if (match) setVoiceVoiceIdxState(match.idx);
    }
  }, [voiceCapable]);

  useEffect(() => {
    if (!voiceCapable) return;
    const onVoices = () => initVoices();
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    initVoices();
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
  }, [voiceCapable, initVoices]);

  const setVoiceEnabled = useCallback((v: boolean) => {
    setVoiceEnabledState(v);
    setCookie('voiceEnabled', String(v));
    if (!v) {
      setSpeakFirstState(false);
      setCookie('speakFirst', 'false');
    }
  }, []);

  const setVoiceSpelling = useCallback((v: boolean) => {
    setVoiceSpellingState(v);
    setCookie('voiceSpelling', String(v));
  }, []);

  const setManualVoice = useCallback((v: boolean) => {
    setManualVoiceState(v);
    setCookie('voiceRecap', String(v));
  }, []);

  const setSpeakFirst = useCallback((v: boolean) => {
    setSpeakFirstState(v);
    setCookie('speakFirst', String(v));
  }, []);

  const setVoiceThinkingTime = useCallback((v: number) => {
    const n = Math.min(10, Math.max(0, v));
    setVoiceThinkingTimeState(n);
    setCookie('voiceThinkingTime', String(n));
  }, []);

  const setVoiceAfterThinkingTime = useCallback((v: number) => {
    const n = Math.min(10, Math.max(0, v));
    setVoiceAfterThinkingTimeState(n);
    setCookie('voiceAfterThinkingTime', String(n));
  }, []);

  const setVoiceVoiceIdx = useCallback((v: number) => {
    setVoiceVoiceIdxState(v);
    const name = voiceVoices.find(vo => vo.idx === v)?.name ?? '';
    if (name) setCookie('voiceVoiceName', name);
  }, [voiceVoices]);

  const setVoiceVolume = useCallback((v: number) => {
    const n = Math.min(10, Math.max(0, Math.round(v)));
    setVoiceVolumeState(n);
    setCookie('voiceVolume', String(n));
  }, []);

  const setVoiceLastOnly = useCallback((v: boolean) => {
    setVoiceLastOnlyState(v);
    setCookie('voiceLastOnly', String(v));
  }, []);

  const setVoicePitch = useCallback((v: number) => {
    const n = Math.min(2, Math.max(0, v));
    setVoicePitchState(n);
    setCookie('voicePitch', String(n));
  }, []);

  const setVoiceRate = useCallback((v: number) => {
    const n = Math.min(10, Math.max(0.1, v));
    setVoiceRateState(n);
    setCookie('voiceRate', String(n));
  }, []);

  const setVoiceBufferMaxLength = useCallback((v: number) => {
    const n = Math.min(999, Math.max(1, Math.round(v)));
    setVoiceBufferMaxLengthState(n);
    setCookie('voiceBufferMaxLength', String(n));
  }, []);

  const flaggedWordsCount = useMemo(
    () => (flaggedWords.trim() ? getWords(flaggedWords, false).length : 0),
    [flaggedWords],
  );

  const setFlaggedWords = useCallback((v: string) => {
    setFlaggedWordsState(v);
  }, []);

  const clearFlaggedWords = useCallback(() => {
    if (flaggedWords.trim()) setFlaggedWordsState('');
  }, [flaggedWords]);

  const loadFlaggedAsText = useCallback(() => {
    if (!flaggedWords.trim()) return;
    setShowingText(flaggedWords.trim());
    setShowRawState(true);
    setCookie('showRaw', 'true');
    setCurrentIndex(0);
  }, [flaggedWords]);

  const addFlaggedWord = useCallback((rawWord: string) => {
    const now = Date.now();
    const msSince = now - lastFlaggedMsRef.current;
    lastFlaggedMsRef.current = now;
    const words = flaggedWords.trim() ? getWords(flaggedWords, false) : [];
    const last = words[words.length - 1];
    if (last === rawWord && msSince < 500) {
      words.pop();
    } else {
      words.push(rawWord);
    }
    setFlaggedWordsState(words.length ? words.join(' ') : '');
  }, [flaggedWords]);

  const applyEnabled = useMemo(() => {
    if (ifCustomGroup) return customGroup.trim().length > 0;
    return !!selectedDisplay?.display;
  }, [ifCustomGroup, customGroup, selectedDisplay]);

  const closeLessonAccordionIfAutoClosing = useCallback(() => {
    if (!autoCloseLessonAccordion) return;
    setSettingsAccordionOpen(prev => ({
      ...prev,
      [SETTINGS_ACCORDION_IDS.lessons]: false,
    }));
  }, [autoCloseLessonAccordion]);

  const applyLesson = useCallback(async () => {
    setCurrentIndex(0);
    setMaxRevealedTrailState(-1);
    if (ifCustomGroup && customGroup.trim()) {
      setShowingText(generateCustomGroupPractice({
        letters: customGroup.trim(),
        practiceSeconds: overrideMins * 60,
        minWordSize: overrideMin,
        maxWordSize: overrideMax,
        stickySets: ifStickySets ? stickySets : undefined,
      }));
      closeLessonAccordionIfAutoClosing();
      return;
    }
    if (!selectedDisplay) return;
    try {
      const result = await loadLessonFile(selectedDisplay.fileName);
      if (result.type === 'text') {
        setShowingText(result.content.trim().replace(/\n/g, selectedDisplay.newlineChunking ? '\n' : ' '));
      } else {
        const practiceSeconds = resolvePracticeSeconds(
          result.config,
          ifOverrideTime,
          overrideMins,
          ifCustomGroup,
        );
        setShowingText(generateRandomPractice({ ...result.config, practiceSeconds }));
      }
      setNewlineChunking(selectedDisplay.newlineChunking);
    } catch {
      /* lesson files optional — custom group path always works */
    }
  }, [
    ifCustomGroup, customGroup, ifOverrideTime, overrideMins, overrideMin, overrideMax,
    ifStickySets, stickySets, selectedDisplay, setNewlineChunking,
    closeLessonAccordionIfAutoClosing,
  ]);

  const setKoVolume = useCallback((v: number) => {
    const vol = Math.min(10, Math.max(1, Math.round(v)));
    setKoVolumeState(vol);
    persistSettings({
      ...settings,
      timing: { ...settings.timing, volume: vol / 10 },
    });
    setCookie('volume', String(vol));
  }, [settings, persistSettings]);

  const setDarkModeDirect = useCallback((v: boolean) => {
    setDarkMode(v);
    setCookie('darkMode', String(v));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkModeDirect(!darkMode);
  }, [darkMode, setDarkModeDirect]);

  const setShowRaw = useCallback((v: boolean) => {
    setShowRawState(v);
    setCookie('showRaw', String(v));
  }, []);

  const clearText = useCallback(() => {
    setShowingText('');
    setCurrentIndex(0);
  }, []);

  const setUserTarget = useCallback((v: string) => {
    setUserTargetState(v);
    setSelectedClassState('');
    setLetterGroupState('');
    setSelectedDisplayState(null);
  }, []);

  const setSelectedClass = useCallback((v: string) => {
    setSelectedClassState(v);
    setLetterGroupState('');
    setSelectedDisplayState(null);
  }, []);

  const setLetterGroup = useCallback((v: string) => {
    setLetterGroupState(v);
    setSelectedDisplayState(null);
  }, []);

  /** Set class + content + lesson in one batch (avoids cascade clears mid deep-link). */
  const applyLessonDeepLinkSelection = useCallback((
    className: string,
    letterGroupName: string,
    display: WordListOption | null,
  ) => {
    setSelectedClassState(className);
    setLetterGroupState(letterGroupName);
    setSelectedDisplayState(display);
  }, []);

  const completeLessonDeepLink = useCallback(() => {
    setLessonDeepLinkPending(false);
  }, []);

  const shuffleWords = useCallback((fromLoopRestart = false) => {
    if (!isShuffled || fromLoopRestart) {
      if (!isShuffled) {
        setPreShuffled(showingText);
      }
      const parts = showingText.split(/\s+/);
      const shuffled = [...parts].sort(() => Math.random() - 0.5).join(' ');
      setShowingText(shuffled);
      setIsShuffled(true);
    } else {
      setShowingText(preShuffled);
      setIsShuffled(false);
    }
    setCurrentIndex(0);
  }, [isShuffled, showingText, preShuffled]);

  const toggleLoop = useCallback(() => {
    if (!loop) {
      setLoop(true);
      setLoopNoShuffle(false);
      setCookie('loop', 'true');
    } else if (loopNoShuffle) {
      setLoop(false);
      setLoopNoShuffle(false);
      setCookie('loop', 'false');
    } else {
      setLoopNoShuffle(true);
    }
  }, [loop, loopNoShuffle]);

  const announceAccessibility = useCallback((msg: string) => {
    const el = announcerRef.current ?? document.querySelector('[role="status"][aria-live="polite"]');
    if (el) {
      el.textContent = msg;
    }
  }, []);

  const isQueryStringSettingsOn = useCallback(
    () => queryStringSettingsOnRef.current,
    [],
  );

  const logoClick = useCallback(() => {
    logoClickCountRef.current += 1;
    if (logoClickCountRef.current % 4 === 0) {
      queryStringSettingsOnRef.current = !queryStringSettingsOnRef.current;
    }
  }, []);

  const isSettingsAccordionOpen = useCallback(
    (panelId: SettingsAccordionId) => settingsAccordionOpen[panelId],
    [settingsAccordionOpen],
  );

  const toggleSettingsAccordion = useCallback((panelId: SettingsAccordionId) => {
    setSettingsAccordionOpen(prev => ({ ...prev, [panelId]: !prev[panelId] }));
  }, []);

  const collapseSettingsAccordions = useCallback(() => {
    setSettingsAccordionOpen({
      ...createDefaultAccordionOpen(),
      [SETTINGS_ACCORDION_IDS.lessons]: true,
    });
  }, []);

  useEffect(() => { setCookie('hideList', String(hideList)); }, [hideList]);

  const words = useMemo(
    () => getWords(showingText, newlineChunking),
    [showingText, newlineChunking],
  );
  const charCount = useMemo(() => rawTextCharCount(showingText), [showingText]);
  const playingTime = useMemo(() => formatPlayTime(runningPlayMs), [runningPlayMs]);

  const timingConfig = useMemo(() => {
    const resolvedDah = syncFreq ? ditFrequency : dahFrequency;
    const base = {
      ...settings.timing,
      frequency: ditFrequency,
      ditFrequency,
      dahFrequency: resolvedDah,
      volume: koVolume / 10,
    };
    if (isPlaying && speedInterval && intervalTimingsText.trim()) {
      const speeds = getApplicableSpeed(runningPlayMs, {
        charWPM: settings.timing.charWPM,
        effectiveWPM: settings.timing.effectiveWPM,
        speedInterval,
        intervalTimingsText,
        intervalWpmText,
        intervalFwpmText,
      });
      return { ...base, charWPM: speeds.charWPM, effectiveWPM: speeds.effectiveWPM };
    }
    return base;
  }, [
    settings.timing, ditFrequency, dahFrequency, syncFreq, koVolume, isPlaying,
    speedInterval, intervalTimingsText, intervalWpmText, intervalFwpmText,
    runningPlayMs,
  ]);

  const value = useMemo((): MorseAppContextValue => ({
    settings,
    charWPM: settings.timing.charWPM,
    effectiveWPM: settings.timing.effectiveWPM,
    syncWpm,
    setCharWPM,
    setEffectiveWPM,
    setSyncWpm,
    koVolume,
    setKoVolume,
    darkMode,
    toggleDarkMode,
    setDarkMode: setDarkModeDirect,
    showingText,
    setShowingText,
    showRaw,
    setShowRaw,
    clearText,
    newlineChunking,
    setNewlineChunking,
    hideList,
    setHideList,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    isPaused,
    setIsPaused,
    runningPlayMs,
    setRunningPlayMs,
    charsPlayed,
    setCharsPlayed,
    isShuffled,
    setIsShuffled,
    shuffleWords,
    loop,
    loopNoShuffle,
    toggleLoop,
    announceAccessibility,
    words,
    charCount,
    playingTime,
    timingConfig,
    logoClick,
    isQueryStringSettingsOn,
    lessonDeepLinkPending,
    completeLessonDeepLink,
    applyLessonDeepLinkSelection,
    isDev,
    morseDisabled,
    isSettingsAccordionOpen,
    toggleSettingsAccordion,
    collapseSettingsAccordions,
    closeLessonAccordionIfAutoClosing,
    userTarget,
    selectedClass,
    letterGroup,
    selectedDisplay,
    selectedPreset,
    setUserTarget,
    setSelectedClass,
    setLetterGroup,
    setSelectedDisplay: setSelectedDisplayState,
    setSelectedPreset: setSelectedPresetState,
    ditFrequency,
    dahFrequency,
    syncFreq,
    setDitFrequency,
    setDahFrequency,
    setSyncFreq,
    preSpace,
    xtraWordSpaceDits,
    cardSpace,
    cardFontPx,
    cardsVisible,
    setPreSpace,
    setXtraWordSpaceDits,
    setCardSpace,
    setCardFontPx,
    setCardsVisible,
    ifCustomGroup,
    customGroup,
    ifOverrideTime,
    overrideMins,
    ifOverrideMinMax,
    overrideMin,
    overrideMax,
    syncSize,
    setIfCustomGroup,
    setCustomGroup,
    setIfOverrideTime,
    setOverrideMins,
    setIfOverrideMinMax,
    setOverrideMin,
    setOverrideMax,
    setSyncSize,
    applyEnabled,
    applyLesson,
    randomizeLessons,
    autoCloseLessonAccordion,
    ifStickySets,
    stickySets,
    shuffleIntraGroup,
    speedInterval,
    intervalTimingsText,
    intervalWpmText,
    intervalFwpmText,
    numberOfRepeats,
    speakFirstAdditionalWordspaces,
    noiseType,
    noiseVolume,
    rssEnabled,
    rssFeedUrl,
    proxyUrl,
    rssPollMins,
    rssPlayMins,
    trailReveal,
    trailPreDelay,
    trailPostDelay,
    trailFinal,
    maxRevealedTrail,
    setRandomizeLessons,
    setAutoCloseLessonAccordion,
    setIfStickySets,
    setStickySets,
    setShuffleIntraGroup,
    setSpeedInterval,
    setIntervalTimingsText,
    setIntervalWpmText,
    setIntervalFwpmText,
    setNumberOfRepeats,
    setSpeakFirstAdditionalWordspaces,
    setNoiseType,
    setNoiseVolume,
    setRssFeedUrl,
    setProxyUrl,
    setRssPollMins,
    setRssPlayMins,
    setTrailReveal,
    setTrailPreDelay,
    setTrailPostDelay,
    setTrailFinal,
    setMaxRevealedTrail,
    voiceCapable,
    voiceEnabled,
    voiceSpelling,
    manualVoice,
    speakFirst,
    voiceThinkingTime,
    voiceThinkingTimeWpm,
    voiceAfterThinkingTime,
    voiceVoices,
    voiceVoiceIdx,
    voiceVolume,
    voiceLastOnly,
    voicePitch,
    voiceRate,
    voiceBufferMaxLength,
    setVoiceEnabled,
    setVoiceSpelling,
    setManualVoice,
    setSpeakFirst,
    setVoiceThinkingTime,
    setVoiceAfterThinkingTime,
    setVoiceVoiceIdx,
    setVoiceVolume,
    setVoiceLastOnly,
    setVoicePitch,
    setVoiceRate,
    setVoiceBufferMaxLength,
    initVoices,
    flaggedWords,
    flaggedWordsCount,
    setFlaggedWords,
    clearFlaggedWords,
    loadFlaggedAsText,
    addFlaggedWord,
  }), [
    settings, syncWpm, setCharWPM, setEffectiveWPM, setSyncWpm,
    koVolume, setKoVolume, darkMode, toggleDarkMode, setDarkModeDirect, showingText,
    showRaw, setShowRaw, clearText, newlineChunking,
    hideList, currentIndex, isPlaying, isPaused, runningPlayMs,
    charsPlayed, isShuffled, setIsShuffled, shuffleWords, loop, loopNoShuffle, toggleLoop,
    announceAccessibility, words, charCount,
    playingTime, timingConfig, logoClick, isQueryStringSettingsOn,
    lessonDeepLinkPending, completeLessonDeepLink, applyLessonDeepLinkSelection,
    isDev, morseDisabled,
    isSettingsAccordionOpen, toggleSettingsAccordion, collapseSettingsAccordions,
    closeLessonAccordionIfAutoClosing,
    userTarget, selectedClass, letterGroup, selectedDisplay, selectedPreset,
    setUserTarget, setSelectedClass, setLetterGroup,
    ditFrequency, dahFrequency, syncFreq, setDitFrequency, setDahFrequency, setSyncFreq,
    preSpace, xtraWordSpaceDits, cardSpace, cardFontPx, cardsVisible,
    setPreSpace, setXtraWordSpaceDits, setCardSpace, setCardFontPx, setCardsVisible,
    ifCustomGroup, customGroup, ifOverrideTime, overrideMins, ifOverrideMinMax,
    overrideMin, overrideMax, syncSize, applyEnabled, applyLesson,
    randomizeLessons, autoCloseLessonAccordion, ifStickySets, stickySets,
    shuffleIntraGroup, speedInterval, intervalTimingsText, intervalWpmText,
    intervalFwpmText, numberOfRepeats, speakFirstAdditionalWordspaces,
    noiseType, noiseVolume, rssEnabled, rssFeedUrl, proxyUrl, rssPollMins, rssPlayMins,
    setNoiseType, setNoiseVolume, setRssFeedUrl, setProxyUrl, setRssPollMins, setRssPlayMins,
    trailReveal, trailPreDelay, trailPostDelay, trailFinal, maxRevealedTrail,
    setIfCustomGroup, setCustomGroup, setIfOverrideTime, setOverrideMins,
    setIfOverrideMinMax, setOverrideMin, setOverrideMax, setSyncSize,
    setRandomizeLessons, setAutoCloseLessonAccordion, setIfStickySets, setStickySets,
    setShuffleIntraGroup, setSpeedInterval, setIntervalTimingsText, setIntervalWpmText,
    setIntervalFwpmText, setNumberOfRepeats, setSpeakFirstAdditionalWordspaces,
    setTrailReveal, setTrailPreDelay, setTrailPostDelay,
    setTrailFinal, setMaxRevealedTrail, setNewlineChunking,
    voiceCapable, voiceEnabled, voiceSpelling, manualVoice, speakFirst,
    voiceThinkingTime, voiceThinkingTimeWpm, voiceAfterThinkingTime,
    voiceVoices, voiceVoiceIdx, voiceVolume, voiceLastOnly, voicePitch,
    voiceRate, voiceBufferMaxLength, setVoiceEnabled, setVoiceSpelling,
    setManualVoice, setSpeakFirst, setVoiceThinkingTime, setVoiceAfterThinkingTime,
    setVoiceVoiceIdx, setVoiceVolume, setVoiceLastOnly, setVoicePitch,
    setVoiceRate, setVoiceBufferMaxLength, initVoices,
    flaggedWords, flaggedWordsCount, clearFlaggedWords, loadFlaggedAsText, addFlaggedWord,
  ]);

  return (
    <MorseAppContext.Provider value={value}>
      {children}
      <div
        ref={announcerRef}
        className="sr-only"
        role="status"
        aria-live="polite"
      />
    </MorseAppContext.Provider>
  );
}

export function useMorseApp(): MorseAppContextValue {
  const ctx = useContext(MorseAppContext);
  if (!ctx) throw new Error('useMorseApp must be used within MorseAppProvider');
  return ctx;
}

export { DEFAULT_SETTINGS };
