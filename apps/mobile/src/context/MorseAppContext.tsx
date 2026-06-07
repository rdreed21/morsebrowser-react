import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { applySerializedSettings, DEFAULT_SETTINGS, snapshotToSerialized } from '@morsebrowser/core';
import type { MorseSettings, MorseTimingConfig } from '@morsebrowser/types';
import { getWords, rawTextCharCount } from '../utils/words';
import { formatPlayTime } from '../utils/formatTime';
import { loadMobileLessonFile } from '../utils/loadMobileLessonFile';
import {
  generateCustomGroupPractice,
  generateRandomPractice,
  resolvePracticeSeconds,
} from '../utils/lessonPractice';
import {
  checkVoiceCapable, loadAvailableVoices, type VoiceOption,
} from '../utils/voiceSpeech';
import type { WordListOption } from '@morsebrowser/core';
import { buildMutatorFromApp, buildSnapshotFromApp } from '../utils/settingsSnapshot';
import {
  loadPersistedSettings, savePersistedSettings, type PersistedExtras,
} from '../utils/settingsPersistence';

export type { VoiceOption };

export const DEFAULT_SHOWING_TEXT = '{CQ|c q} {LICW|l i c w}';

export interface MorseAppContextValue {
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
  words: string[];
  charCount: number;
  playingTime: ReturnType<typeof formatPlayTime>;
  timingConfig: MorseTimingConfig;
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
  trailReveal: boolean;
  trailPreDelay: number;
  trailPostDelay: number;
  trailFinal: number;
  maxRevealedTrail: number;
  setTrailReveal: (v: boolean) => void;
  setTrailPreDelay: (v: number) => void;
  setTrailPostDelay: (v: number) => void;
  setTrailFinal: (v: number) => void;
  setMaxRevealedTrail: (v: number) => void;
  numberOfRepeats: number;
  setNumberOfRepeats: (v: number) => void;
  userTarget: string;
  selectedClass: string;
  letterGroup: string;
  selectedDisplay: WordListOption | null;
  setUserTarget: (v: string) => void;
  setSelectedClass: (v: string) => void;
  setLetterGroup: (v: string) => void;
  setSelectedDisplay: (v: WordListOption | null) => void;
  ifCustomGroup: boolean;
  customGroup: string;
  ifOverrideTime: boolean;
  overrideMins: number;
  ifOverrideMinMax: boolean;
  overrideMin: number;
  overrideMax: number;
  syncSize: boolean;
  ifStickySets: boolean;
  stickySets: string;
  setIfStickySets: (v: boolean) => void;
  setStickySets: (v: string) => void;
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
  setRandomizeLessons: (v: boolean) => void;
  flaggedWords: string;
  flaggedWordsCount: number;
  setFlaggedWords: (v: string) => void;
  clearFlaggedWords: () => void;
  loadFlaggedAsText: () => void;
  addFlaggedWord: (rawWord: string) => void;
  newlineChunking: boolean;
  setNewlineChunking: (v: boolean) => void;
  morseDisabled: boolean;
  speakFirstAdditionalWordspaces: number;
  setSpeakFirstAdditionalWordspaces: (v: number) => void;
  selectedPreset: string;
  setSelectedPreset: (v: string) => void;
  autoCloseLessonAccordion: boolean;
  setAutoCloseLessonAccordion: (v: boolean) => void;
  shuffleIntraGroup: boolean;
  setShuffleIntraGroup: (v: boolean) => void;
  speedInterval: boolean;
  setSpeedInterval: (v: boolean) => void;
  intervalTimingsText: string;
  setIntervalTimingsText: (v: string) => void;
  intervalWpmText: string;
  setIntervalWpmText: (v: string) => void;
  intervalFwpmText: string;
  setIntervalFwpmText: (v: string) => void;
  speakFirst: boolean;
  setSpeakFirst: (v: boolean) => void;
  voiceCapable: boolean;
  voiceEnabled: boolean;
  voiceSpelling: boolean;
  manualVoice: boolean;
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
  setVoiceThinkingTime: (v: number) => void;
  setVoiceAfterThinkingTime: (v: number) => void;
  setVoiceVoiceIdx: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  setVoiceLastOnly: (v: boolean) => void;
  setVoicePitch: (v: number) => void;
  setVoiceRate: (v: number) => void;
  setVoiceBufferMaxLength: (v: number) => void;
  initVoices: () => void;
}

const MorseAppContext = createContext<MorseAppContextValue | null>(null);

export function MorseAppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<MorseSettings>(() => ({
    ...DEFAULT_SETTINGS,
    timing: { ...DEFAULT_SETTINGS.timing },
  }));
  const [syncWpm, setSyncWpmState] = useState(true);
  const [koVolume, setKoVolumeState] = useState(
    () => Math.round(DEFAULT_SETTINGS.timing.volume * 10) || 10,
  );
  const [darkMode, setDarkMode] = useState(false);
  const [showingText, setShowingText] = useState(DEFAULT_SHOWING_TEXT);
  const [showRaw, setShowRaw] = useState(true);
  const [newlineChunking, setNewlineChunkingState] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runningPlayMs, setRunningPlayMs] = useState(0);
  const [charsPlayed, setCharsPlayed] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [preShuffled, setPreShuffled] = useState('');
  const [loop, setLoop] = useState(false);
  const [loopNoShuffle, setLoopNoShuffle] = useState(false);

  const [ditFrequency, setDitFrequencyState] = useState(DEFAULT_SETTINGS.timing.frequency);
  const [dahFrequency, setDahFrequencyState] = useState(DEFAULT_SETTINGS.timing.frequency);
  const [syncFreq, setSyncFreqState] = useState(true);

  const [preSpace, setPreSpaceState] = useState(2);
  const [xtraWordSpaceDits, setXtraWordSpaceDitsState] = useState(1);
  const [cardSpace, setCardSpaceState] = useState(0);
  const [cardFontPx, setCardFontPxState] = useState(15);
  const [cardsVisible, setCardsVisibleState] = useState(true);

  const [trailReveal, setTrailRevealState] = useState(false);
  const [trailPreDelay, setTrailPreDelayState] = useState(0);
  const [trailPostDelay, setTrailPostDelayState] = useState(0);
  const [trailFinal, setTrailFinalState] = useState(1);
  const [maxRevealedTrail, setMaxRevealedTrailState] = useState(-1);

  const [numberOfRepeats, setNumberOfRepeatsState] = useState(0);
  const [speakFirstAdditionalWordspaces, setSpeakFirstAdditionalWordspacesState] = useState(0);

  const [userTarget, setUserTargetState] = useState('STUDENT');
  const [selectedClass, setSelectedClassState] = useState('');
  const [letterGroup, setLetterGroupState] = useState('');
  const [selectedDisplay, setSelectedDisplayState] = useState<WordListOption | null>(null);

  const [ifCustomGroup, setIfCustomGroupState] = useState(false);
  const [customGroup, setCustomGroupState] = useState('');
  const [ifOverrideTime, setIfOverrideTimeState] = useState(false);
  const [overrideMins, setOverrideMinsState] = useState(2);
  const [ifOverrideMinMax, setIfOverrideMinMaxState] = useState(false);
  const [overrideMin, setOverrideMinState] = useState(3);
  const [overrideMax, setOverrideMaxState] = useState(3);
  const [syncSize, setSyncSizeState] = useState(true);
  const [randomizeLessons, setRandomizeLessonsState] = useState(true);
  const [ifStickySets, setIfStickySetsState] = useState(false);
  const [stickySets, setStickySetsState] = useState('');

  const [selectedPreset, setSelectedPresetState] = useState('Your Settings');
  const [autoCloseLessonAccordion, setAutoCloseLessonAccordionState] = useState(false);
  const [shuffleIntraGroup, setShuffleIntraGroupState] = useState(false);
  const [speedInterval, setSpeedIntervalState] = useState(false);
  const [intervalTimingsText, setIntervalTimingsTextState] = useState('');
  const [intervalWpmText, setIntervalWpmTextState] = useState('');
  const [intervalFwpmText, setIntervalFwpmTextState] = useState('');
  const [speakFirst, setSpeakFirstState] = useState(false);

  const [voiceCapable, setVoiceCapable] = useState(false);
  const [voiceEnabled, setVoiceEnabledState] = useState(false);
  const [voiceSpelling, setVoiceSpellingState] = useState(true);
  const [manualVoice, setManualVoiceState] = useState(false);
  const [voiceThinkingTime, setVoiceThinkingTimeState] = useState(0);
  const [voiceAfterThinkingTime, setVoiceAfterThinkingTimeState] = useState(0);
  const [voiceVoices, setVoiceVoices] = useState<VoiceOption[]>([]);
  const [voiceVoiceIdx, setVoiceVoiceIdxState] = useState(-1);
  const [voiceVolume, setVoiceVolumeState] = useState(10);
  const [voiceLastOnly, setVoiceLastOnlyState] = useState(false);
  const [voicePitch, setVoicePitchState] = useState(1);
  const [voiceRate, setVoiceRateState] = useState(1);
  const [voiceBufferMaxLength, setVoiceBufferMaxLengthState] = useState(1);

  const [flaggedWords, setFlaggedWordsState] = useState('');
  const lastFlaggedMsRef = React.useRef(0);

  const setCharWPM = useCallback((v: number) => {
    const charWPM = Math.max(1, Math.round(v));
    const effectiveWPM = syncWpm ? charWPM : Math.min(settings.timing.effectiveWPM, charWPM);
    setSettings(s => ({
      ...s,
      timing: { ...s.timing, charWPM, effectiveWPM, volume: koVolume / 10 },
    }));
  }, [syncWpm, settings.timing.effectiveWPM, koVolume]);

  const setEffectiveWPM = useCallback((v: number) => {
    const effectiveWPM = Math.min(Math.max(1, Math.round(v)), settings.timing.charWPM);
    setSettings(s => ({ ...s, timing: { ...s.timing, effectiveWPM, volume: koVolume / 10 } }));
  }, [settings.timing.charWPM, koVolume]);

  const setSyncWpm = useCallback((v: boolean) => {
    setSyncWpmState(v);
    if (v) setSettings(s => ({
      ...s,
      timing: { ...s.timing, effectiveWPM: s.timing.charWPM },
    }));
  }, []);

  const setKoVolume = useCallback((v: number) => {
    const vol = Math.min(10, Math.max(1, Math.round(v)));
    setKoVolumeState(vol);
    setSettings(s => ({ ...s, timing: { ...s.timing, volume: vol / 10 } }));
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);
  const setDarkModeDirect = useCallback((v: boolean) => setDarkMode(v), []);
  const setShowRawDirect = useCallback((v: boolean) => setShowRaw(v), []);

  useEffect(() => {
    void checkVoiceCapable().then(setVoiceCapable);
  }, []);

  const voiceThinkingTimeWpm = useMemo(() => {
    if (!voiceThinkingTime) return '--';
    return Math.round(3.6 / voiceThinkingTime);
  }, [voiceThinkingTime]);

  const initVoices = useCallback(() => {
    void loadAvailableVoices().then(voices => {
      setVoiceVoices(voices);
      if (voiceVoiceIdx < 0 && voices.length > 0) {
        const enIdx = voices.findIndex(v =>
          v.language?.startsWith('en-US') || v.language?.startsWith('en_US'),
        );
        setVoiceVoiceIdxState(enIdx >= 0 ? enIdx : 0);
      }
    });
  }, [voiceVoiceIdx]);

  const setVoiceEnabled = useCallback((v: boolean) => {
    setVoiceEnabledState(v);
    if (v && manualVoice) setManualVoiceState(false);
  }, [manualVoice]);

  const setVoiceSpelling = useCallback((v: boolean) => setVoiceSpellingState(v), []);
  const setManualVoice = useCallback((v: boolean) => {
    setManualVoiceState(v);
    if (v) setVoiceEnabledState(true);
  }, []);
  const setSpeakFirst = useCallback((v: boolean) => setSpeakFirstState(v), []);
  const setVoiceThinkingTime = useCallback((v: number) => {
    setVoiceThinkingTimeState(Math.min(10, Math.max(0, v)));
  }, []);
  const setVoiceAfterThinkingTime = useCallback((v: number) => {
    setVoiceAfterThinkingTimeState(Math.min(10, Math.max(0, v)));
  }, []);
  const setVoiceVoiceIdx = useCallback((v: number) => setVoiceVoiceIdxState(v), []);
  const setVoiceVolume = useCallback((v: number) => {
    setVoiceVolumeState(Math.min(10, Math.max(0, Math.round(v))));
  }, []);
  const setVoiceLastOnly = useCallback((v: boolean) => setVoiceLastOnlyState(v), []);
  const setVoicePitch = useCallback((v: number) => {
    setVoicePitchState(Math.min(2, Math.max(0, v)));
  }, []);
  const setVoiceRate = useCallback((v: number) => {
    setVoiceRateState(Math.min(10, Math.max(0.1, v)));
  }, []);
  const setVoiceBufferMaxLength = useCallback((v: number) => {
    setVoiceBufferMaxLengthState(Math.min(999, Math.max(1, Math.round(v))));
  }, []);

  const setSelectedPreset = useCallback((v: string) => setSelectedPresetState(v), []);
  const setAutoCloseLessonAccordion = useCallback((v: boolean) => setAutoCloseLessonAccordionState(v), []);
  const setShuffleIntraGroup = useCallback((v: boolean) => setShuffleIntraGroupState(v), []);
  const setSpeedInterval = useCallback((v: boolean) => setSpeedIntervalState(v), []);
  const setIntervalTimingsText = useCallback((v: string) => setIntervalTimingsTextState(v), []);
  const setIntervalWpmText = useCallback((v: string) => setIntervalWpmTextState(v), []);
  const setIntervalFwpmText = useCallback((v: string) => setIntervalFwpmTextState(v), []);

  const clearText = useCallback(() => {
    setShowingText('');
    setCurrentIndex(0);
  }, []);

  const setNewlineChunking = useCallback((v: boolean) => setNewlineChunkingState(v), []);

  const clampFreq = (v: number) => Math.min(1200, Math.max(100, Math.round(v / 10) * 10));

  const setDitFrequency = useCallback((v: number) => {
    const freq = clampFreq(v);
    setDitFrequencyState(freq);
    setSettings(s => ({ ...s, timing: { ...s.timing, frequency: freq } }));
    if (syncFreq) setDahFrequencyState(freq);
  }, [syncFreq]);

  const setDahFrequency = useCallback((v: number) => {
    setDahFrequencyState(clampFreq(v));
  }, []);

  const setSyncFreq = useCallback((v: boolean) => {
    setSyncFreqState(v);
    if (v) setDahFrequencyState(ditFrequency);
  }, [ditFrequency]);

  const setPreSpace = useCallback((v: number) => setPreSpaceState(Math.min(1200, Math.max(0, v))), []);
  const setXtraWordSpaceDits = useCallback((v: number) => setXtraWordSpaceDitsState(Math.min(10, Math.max(1, Math.round(v)))), []);
  const setCardSpace = useCallback((v: number) => setCardSpaceState(Math.min(10, Math.max(0, Math.round(v)))), []);
  const setCardFontPx = useCallback((v: number) => setCardFontPxState(Math.min(1200, Math.max(1, Math.round(v)))), []);
  const setCardsVisible = useCallback((v: boolean) => setCardsVisibleState(v), []);

  const setTrailReveal = useCallback((v: boolean) => {
    setTrailRevealState(v);
    if (!v) setMaxRevealedTrailState(-1);
  }, []);
  const setTrailPreDelay = useCallback((v: number) => setTrailPreDelayState(Math.max(0, v)), []);
  const setTrailPostDelay = useCallback((v: number) => setTrailPostDelayState(Math.max(0, v)), []);
  const setTrailFinal = useCallback((v: number) => setTrailFinalState(Math.max(0, v)), []);
  const setMaxRevealedTrail = useCallback((v: number) => setMaxRevealedTrailState(v), []);

  const setNumberOfRepeats = useCallback((v: number) => setNumberOfRepeatsState(Math.min(10, Math.max(0, Math.round(v)))), []);
  const setSpeakFirstAdditionalWordspaces = useCallback((v: number) => setSpeakFirstAdditionalWordspacesState(Math.min(10, Math.max(0, Math.round(v)))), []);

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

  const setIfCustomGroup = useCallback((v: boolean) => setIfCustomGroupState(v), []);
  const setCustomGroup = useCallback((v: string) => setCustomGroupState(v), []);
  const setIfOverrideTime = useCallback((v: boolean) => setIfOverrideTimeState(v), []);
  const setOverrideMins = useCallback((v: number) => setOverrideMinsState(Math.max(0, v)), []);
  const setIfOverrideMinMax = useCallback((v: boolean) => setIfOverrideMinMaxState(v), []);

  const setOverrideMin = useCallback((v: number) => {
    const n = Math.max(1, Math.round(v));
    setOverrideMinState(n);
    if (syncSize) setOverrideMaxState(n);
  }, [syncSize]);

  const setOverrideMax = useCallback((v: number) => {
    setOverrideMaxState(Math.max(overrideMin, Math.round(v)));
  }, [overrideMin]);

  const setSyncSize = useCallback((v: boolean) => {
    setSyncSizeState(v);
    if (v) setOverrideMaxState(overrideMin);
  }, [overrideMin]);

  const setIfStickySets = useCallback((v: boolean) => setIfStickySetsState(v), []);
  const setStickySets = useCallback((v: string) => setStickySetsState(v), []);
  const setRandomizeLessons = useCallback((v: boolean) => setRandomizeLessonsState(v), []);

  const applyEnabled = useMemo(() => {
    if (ifCustomGroup) return customGroup.trim().length > 0;
    return !!selectedDisplay?.display;
  }, [ifCustomGroup, customGroup, selectedDisplay]);

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
      return;
    }
    if (!selectedDisplay) return;
    try {
      const result = await loadMobileLessonFile(selectedDisplay.fileName);
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
      setNewlineChunkingState(selectedDisplay.newlineChunking);
    } catch {
      /* lesson files optional — custom group path always works */
    }
  }, [
    ifCustomGroup, customGroup, ifOverrideTime, overrideMins, overrideMin, overrideMax,
    ifStickySets, stickySets, selectedDisplay,
  ]);

  const shuffleWords = useCallback((fromLoopRestart = false) => {
    if (!isShuffled || fromLoopRestart) {
      if (!isShuffled) setPreShuffled(showingText);
      const parts = showingText.split(/\s+/);
      setShowingText([...parts].sort(() => Math.random() - 0.5).join(' '));
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
    } else if (loopNoShuffle) {
      setLoop(false);
      setLoopNoShuffle(false);
    } else {
      setLoopNoShuffle(true);
    }
  }, [loop, loopNoShuffle]);

  const setFlaggedWords = useCallback((v: string) => setFlaggedWordsState(v), []);

  const clearFlaggedWords = useCallback(() => {
    if (flaggedWords.trim()) setFlaggedWordsState('');
  }, [flaggedWords]);

  const loadFlaggedAsText = useCallback(() => {
    if (!flaggedWords.trim()) return;
    setShowingText(flaggedWords.trim());
    setShowRaw(true);
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

  const flaggedWordsCount = useMemo(
    () => (flaggedWords.trim() ? getWords(flaggedWords, false).length : 0),
    [flaggedWords],
  );

  const words = useMemo(
    () => getWords(showingText, newlineChunking),
    [showingText, newlineChunking],
  );
  const charCount = useMemo(() => rawTextCharCount(showingText), [showingText]);
  const playingTime = useMemo(() => formatPlayTime(runningPlayMs), [runningPlayMs]);

  const timingConfig = useMemo<MorseTimingConfig>(() => ({
    ...settings.timing,
    frequency: ditFrequency,
    ditFrequency,
    dahFrequency: syncFreq ? ditFrequency : dahFrequency,
    volume: koVolume / 10,
  }), [settings.timing, ditFrequency, dahFrequency, syncFreq, koVolume]);

  const value = useMemo<MorseAppContextValue>(() => ({
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
    setShowRaw: setShowRawDirect,
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
    words,
    charCount,
    playingTime,
    timingConfig,
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
    trailReveal,
    trailPreDelay,
    trailPostDelay,
    trailFinal,
    maxRevealedTrail,
    setTrailReveal,
    setTrailPreDelay,
    setTrailPostDelay,
    setTrailFinal,
    setMaxRevealedTrail,
    numberOfRepeats,
    setNumberOfRepeats,
    userTarget,
    selectedClass,
    letterGroup,
    selectedDisplay,
    setUserTarget,
    setSelectedClass,
    setLetterGroup,
    setSelectedDisplay: setSelectedDisplayState,
    ifCustomGroup,
    customGroup,
    ifOverrideTime,
    overrideMins,
    ifOverrideMinMax,
    overrideMin,
    overrideMax,
    syncSize,
    ifStickySets,
    stickySets,
    setIfStickySets,
    setStickySets,
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
    setRandomizeLessons,
    flaggedWords,
    flaggedWordsCount,
    setFlaggedWords,
    clearFlaggedWords,
    loadFlaggedAsText,
    addFlaggedWord,
    morseDisabled: false,
    speakFirstAdditionalWordspaces,
    setSpeakFirstAdditionalWordspaces,
    selectedPreset,
    setSelectedPreset,
    autoCloseLessonAccordion,
    setAutoCloseLessonAccordion,
    shuffleIntraGroup,
    setShuffleIntraGroup,
    speedInterval,
    setSpeedInterval,
    intervalTimingsText,
    setIntervalTimingsText,
    intervalWpmText,
    setIntervalWpmText,
    intervalFwpmText,
    setIntervalFwpmText,
    speakFirst,
    setSpeakFirst,
    voiceCapable,
    voiceEnabled,
    voiceSpelling,
    manualVoice,
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
    setVoiceThinkingTime,
    setVoiceAfterThinkingTime,
    setVoiceVoiceIdx,
    setVoiceVolume,
    setVoiceLastOnly,
    setVoicePitch,
    setVoiceRate,
    setVoiceBufferMaxLength,
    initVoices,
  }), [
    settings, syncWpm, setCharWPM, setEffectiveWPM, setSyncWpm,
    koVolume, setKoVolume, darkMode, toggleDarkMode,
    showingText, showRaw, clearText, newlineChunking,
    hideList, currentIndex, isPlaying, isPaused,
    runningPlayMs, charsPlayed, isShuffled, shuffleWords,
    loop, loopNoShuffle, toggleLoop, words, charCount,
    playingTime, timingConfig, ditFrequency, dahFrequency, syncFreq,
    setDitFrequency, setDahFrequency, setSyncFreq,
    preSpace, xtraWordSpaceDits, cardSpace, cardFontPx, cardsVisible,
    trailReveal, trailPreDelay, trailPostDelay, trailFinal, maxRevealedTrail,
    numberOfRepeats, userTarget, selectedClass, letterGroup, selectedDisplay,
    ifCustomGroup, customGroup, ifOverrideTime, overrideMins,
    ifOverrideMinMax, overrideMin, overrideMax, syncSize,
    ifStickySets, stickySets,
    applyEnabled, applyLesson, randomizeLessons,
    flaggedWords, flaggedWordsCount, clearFlaggedWords, loadFlaggedAsText, addFlaggedWord,
    speakFirstAdditionalWordspaces,
    selectedPreset, autoCloseLessonAccordion, shuffleIntraGroup,
    speedInterval, intervalTimingsText, intervalWpmText, intervalFwpmText,
    speakFirst, voiceCapable, voiceEnabled, voiceSpelling, manualVoice,
    voiceThinkingTime, voiceThinkingTimeWpm, voiceAfterThinkingTime,
    voiceVoices, voiceVoiceIdx, voiceVolume, voiceLastOnly, voicePitch,
    voiceRate, voiceBufferMaxLength, initVoices,
  ]);

  // Restore persisted settings once on startup (AsyncStorage), mirroring how the web
  // app restores cookie-backed settings on load.
  const persistLoadedRef = React.useRef(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const persisted = await loadPersistedSettings();
      if (cancelled || !persisted) {
        persistLoadedRef.current = true;
        return;
      }
      applySerializedSettings(persisted.snapshot, buildMutatorFromApp(value));
      const e = persisted.extras;
      if (e.ditFrequency !== undefined) setDitFrequency(e.ditFrequency);
      if (e.dahFrequency !== undefined) setDahFrequency(e.dahFrequency);
      if (e.syncFreq !== undefined) setSyncFreq(e.syncFreq);
      if (e.preSpace !== undefined) setPreSpace(e.preSpace);
      if (e.cardFontPx !== undefined) setCardFontPx(e.cardFontPx);
      if (e.cardsVisible !== undefined) setCardsVisible(e.cardsVisible);
      if (e.trailReveal !== undefined) setTrailReveal(e.trailReveal);
      if (e.trailPreDelay !== undefined) setTrailPreDelay(e.trailPreDelay);
      if (e.trailPostDelay !== undefined) setTrailPostDelay(e.trailPostDelay);
      if (e.trailFinal !== undefined) setTrailFinal(e.trailFinal);
      if (e.maxRevealedTrail !== undefined) setMaxRevealedTrail(e.maxRevealedTrail);
      if (e.flaggedWords !== undefined) setFlaggedWords(e.flaggedWords);
      persistLoadedRef.current = true;
    })();
    return () => { cancelled = true; };
    // Runs once on mount — intentionally not re-running when callbacks change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist settings on change, debounced so rapid edits (typing, dragging) collapse
  // into a single AsyncStorage write.
  const lastPersistedRef = React.useRef<string | null>(null);
  const persistTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!persistLoadedRef.current) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const snapshot = snapshotToSerialized(buildSnapshotFromApp(value));
      const extras: PersistedExtras = {
        ditFrequency: value.ditFrequency,
        dahFrequency: value.dahFrequency,
        syncFreq: value.syncFreq,
        preSpace: value.preSpace,
        cardFontPx: value.cardFontPx,
        cardsVisible: value.cardsVisible,
        trailReveal: value.trailReveal,
        trailPreDelay: value.trailPreDelay,
        trailPostDelay: value.trailPostDelay,
        trailFinal: value.trailFinal,
        maxRevealedTrail: value.maxRevealedTrail,
        flaggedWords: value.flaggedWords,
      };
      const serialized = JSON.stringify({ snapshot, extras });
      if (serialized === lastPersistedRef.current) return;
      lastPersistedRef.current = serialized;
      void savePersistedSettings(snapshot, extras);
    }, 500);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [value]);

  return (
    <MorseAppContext.Provider value={value}>
      {children}
    </MorseAppContext.Provider>
  );
}

export function useMorseApp(): MorseAppContextValue {
  const ctx = useContext(MorseAppContext);
  if (!ctx) throw new Error('useMorseApp must be used within MorseAppProvider');
  return ctx;
}
