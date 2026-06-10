import { useCallback, useEffect, useRef, useState } from 'react';
import {
  YOUR_SETTINGS_PRESET,
  DEFAULT_PRESET_KEY_BLACKLIST,
  applySerializedSettings,
  downloadSettingsFile,
  fetchSettingsPresetsForLesson,
  parseImportedSettingsFile,
  resolvePresetSettings,
  snapshotToSerialized,
  type MorseSettingsSnapshot,
  type PresetSettingsMutator,
  type SerializedSetting,
  type SettingsOption,
} from '@morsebrowser/core';
import { useMorseApp } from '../context/MorseAppContext';
import {
  removeLessonQueryParam,
  upsertLessonQueryParam,
} from '../utils/lessonQueryString';
import { getUrlParam, hasUrlParam } from '../utils/urlParams';

const COOKIE_LOCKOUT_MS = 700;

function buildSnapshotFromApp(app: ReturnType<typeof useMorseApp>): MorseSettingsSnapshot {
  return {
    charWPM: app.charWPM,
    effectiveWPM: app.effectiveWPM,
    syncWpm: app.syncWpm,
    koVolume: app.koVolume,
    xtraWordSpaceDits: app.xtraWordSpaceDits,
    stickySets: app.stickySets,
    ifStickySets: app.ifStickySets,
    hideList: app.hideList,
    showRaw: app.showRaw,
    darkMode: app.darkMode,
    autoCloseLessonAccordion: app.autoCloseLessonAccordion,
    ifCustomGroup: app.ifCustomGroup,
    customGroup: app.customGroup,
    voiceEnabled: app.voiceEnabled,
    voiceSpelling: app.voiceSpelling,
    voiceThinkingTime: app.voiceThinkingTime,
    voiceAfterThinkingTime: app.voiceAfterThinkingTime,
    voiceLastOnly: app.voiceLastOnly,
    manualVoice: app.manualVoice,
    speakFirst: app.speakFirst,
    numberOfRepeats: app.numberOfRepeats,
    speakFirstAdditionalWordspaces: app.speakFirstAdditionalWordspaces,
    newlineChunking: app.newlineChunking,
    syncSize: app.syncSize,
    ifOverrideMinMax: app.ifOverrideMinMax,
    overrideMin: app.overrideMin,
    overrideMax: app.overrideMax,
    cardSpace: app.cardSpace,
    speedInterval: app.speedInterval,
    intervalTimingsText: app.intervalTimingsText,
    intervalWpmText: app.intervalWpmText,
    intervalFwpmText: app.intervalFwpmText,
    voiceBufferMaxLength: app.voiceBufferMaxLength,
    voiceVolume: app.voiceVolume,
    isShuffled: app.isShuffled,
    shuffleIntraGroup: app.shuffleIntraGroup,
  };
}

function buildMutatorFromApp(app: ReturnType<typeof useMorseApp>): PresetSettingsMutator {
  return {
    setCharWPM: app.setCharWPM,
    setEffectiveWPM: app.setEffectiveWPM,
    setSyncWpm: app.setSyncWpm,
    setKoVolume: app.setKoVolume,
    setVoiceVolume: app.setVoiceVolume,
    setXtraWordSpaceDits: app.setXtraWordSpaceDits,
    setStickySets: app.setStickySets,
    setIfStickySets: app.setIfStickySets,
    setHideList: app.setHideList,
    setShowRaw: app.setShowRaw,
    setDarkMode: app.setDarkMode,
    setAutoCloseLessonAccordion: app.setAutoCloseLessonAccordion,
    setIfCustomGroup: app.setIfCustomGroup,
    setCustomGroup: app.setCustomGroup,
    setVoiceEnabled: app.setVoiceEnabled,
    setVoiceSpelling: app.setVoiceSpelling,
    setVoiceThinkingTime: app.setVoiceThinkingTime,
    setVoiceAfterThinkingTime: app.setVoiceAfterThinkingTime,
    setVoiceLastOnly: app.setVoiceLastOnly,
    setManualVoice: app.setManualVoice,
    setSpeakFirst: app.setSpeakFirst,
    setNumberOfRepeats: app.setNumberOfRepeats,
    setSpeakFirstAdditionalWordspaces: app.setSpeakFirstAdditionalWordspaces,
    setNewlineChunking: app.setNewlineChunking,
    setSyncSize: app.setSyncSize,
    setIfOverrideMinMax: app.setIfOverrideMinMax,
    setOverrideMin: app.setOverrideMin,
    setOverrideMax: app.setOverrideMax,
    setCardSpace: app.setCardSpace,
    setSpeedInterval: app.setSpeedInterval,
    setIntervalTimingsText: app.setIntervalTimingsText,
    setIntervalWpmText: app.setIntervalWpmText,
    setIntervalFwpmText: app.setIntervalFwpmText,
    setVoiceBufferMaxLength: app.setVoiceBufferMaxLength,
    setIsShuffled: app.setIsShuffled,
    setShuffleIntraGroup: app.setShuffleIntraGroup,
  };
}

export function usePresets(onPresetApplied?: () => void) {
  const app = useMorseApp();
  const appRef = useRef(app);
  appRef.current = app;

  const onPresetAppliedRef = useRef(onPresetApplied);
  onPresetAppliedRef.current = onPresetApplied;

  const [settingsPresets, setSettingsPresets] = useState<SettingsOption[]>([YOUR_SETTINGS_PRESET]);
  const [customPresets, setCustomPresets] = useState<SettingsOption[]>([]);
  const customPresetsRef = useRef(customPresets);
  customPresetsRef.current = customPresets;

  const [selectedSettingsPreset, setSelectedSettingsPreset] = useState<SettingsOption>(YOUR_SETTINGS_PRESET);
  const [allowSaveCookies, setAllowSaveCookies] = useState(true);

  const savedYourSettingsRef = useRef<SerializedSetting[] | null>(null);
  const settingsOverriddenRef = useRef(false);
  const presetsReadyRef = useRef(false);
  const queryPresetHandledRef = useRef(false);
  const hadLessonDeepLinkParamsRef = useRef(hasUrlParam('selectedClass')
    || hasUrlParam('selectedGroup')
    || hasUrlParam('selectedLesson'));
  const lockoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedPresetRef = useRef<SettingsOption>(YOUR_SETTINGS_PRESET);
  const applyingRef = useRef(false);

  const beginCookieLockout = useCallback(() => {
    setAllowSaveCookies(false);
    if (lockoutTimerRef.current) clearTimeout(lockoutTimerRef.current);
    lockoutTimerRef.current = setTimeout(() => {
      setAllowSaveCookies(true);
      lockoutTimerRef.current = null;
    }, COOKIE_LOCKOUT_MS);
  }, []);

  const applyPreset = useCallback(async (
    preset: SettingsOption,
    skipReinit = false,
    fromClick = false,
  ) => {
    if (!presetsReadyRef.current || applyingRef.current) return;
    applyingRef.current = true;

    try {
      const currentApp = appRef.current;

      if (fromClick) {
        removeLessonQueryParam('selectedPreset');
      }

      const last = selectedPresetRef.current;
      if (last.isDummy && !settingsOverriddenRef.current) {
        savedYourSettingsRef.current = snapshotToSerialized(buildSnapshotFromApp(currentApp));
      }

      beginCookieLockout();
      selectedPresetRef.current = preset;
      setSelectedSettingsPreset(preset);
      currentApp.setSelectedPreset(preset.display);

      if (preset.isDummy) {
        settingsOverriddenRef.current = false;
      }

      const resolved = await resolvePresetSettings(
        preset,
        currentApp.letterGroup,
        currentApp.selectedDisplay?.fileName,
        savedYourSettingsRef.current,
        DEFAULT_PRESET_KEY_BLACKLIST,
      );

      if (resolved) {
        if (resolved.overridden) {
          settingsOverriddenRef.current = true;
        }
        applySerializedSettings(
          resolved.settings,
          buildMutatorFromApp(currentApp),
          DEFAULT_PRESET_KEY_BLACKLIST,
        );
      } else if (preset.isDummy && !savedYourSettingsRef.current) {
        savedYourSettingsRef.current = snapshotToSerialized(buildSnapshotFromApp(currentApp));
      }

      if (!skipReinit && currentApp.selectedDisplay?.display) {
        window.setTimeout(() => onPresetAppliedRef.current?.(), 1000);
      }

      if (
        currentApp.isQueryStringSettingsOn() &&
        preset.display !== YOUR_SETTINGS_PRESET.display
      ) {
        upsertLessonQueryParam('selectedPreset', preset.display);
      }
    } finally {
      applyingRef.current = false;
    }
  }, [beginCookieLockout]);

  const applyPresetRef = useRef(applyPreset);
  applyPresetRef.current = applyPreset;

  const classKey = `${app.selectedClass}|${app.letterGroup}`;
  const prevClassKeyRef = useRef('');

  // Load preset list when class/content or custom presets change.
  useEffect(() => {
    presetsReadyRef.current = true;
    const classChanged = prevClassKeyRef.current !== classKey;
    prevClassKeyRef.current = classKey;

    let cancelled = false;

    void (async () => {
      const presets = await fetchSettingsPresetsForLesson(
        app.selectedClass,
        app.letterGroup,
        customPresetsRef.current,
      );
      if (cancelled) return;

      setSettingsPresets(presets);

      if (
        classChanged
        && app.selectedClass
        && presets.length > 1
        && !hasUrlParam('selectedPreset')
        && !app.lessonDeepLinkPending
      ) {
        const current = selectedPresetRef.current;
        if (current.isDummy || current.filename !== presets[1].filename) {
          await applyPresetRef.current(presets[1], true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [classKey, customPresets, app.selectedClass, app.lessonDeepLinkPending]);

  // After Tom-style lesson deep link finishes, apply default preset once if needed.
  useEffect(() => {
    if (!hadLessonDeepLinkParamsRef.current) return;
    if (app.lessonDeepLinkPending || hasUrlParam('selectedPreset')) return;
    if (!app.selectedClass || settingsPresets.length <= 1) return;

    hadLessonDeepLinkParamsRef.current = false;
    const current = selectedPresetRef.current;
    const defaultPreset = settingsPresets[1];
    if (!defaultPreset) return;
    if (!current.isDummy && current.filename === defaultPreset.filename) return;

    void applyPresetRef.current(defaultPreset, true);
  }, [app.lessonDeepLinkPending, app.selectedClass, settingsPresets]);

  // Deep-link ?selectedPreset= once presets are loaded.
  useEffect(() => {
    if (queryPresetHandledRef.current || settingsPresets.length <= 1) return;
    const qs = getUrlParam('selectedPreset');
    if (!qs) return;

    const match = settingsPresets.find(p => p.display.toUpperCase() === qs.toUpperCase());
    if (match) {
      queryPresetHandledRef.current = true;
      void applyPresetRef.current(match, false);
      if (!appRef.current.isQueryStringSettingsOn()) {
        window.setTimeout(() => removeLessonQueryParam('selectedPreset'), 1000);
      }
    }
  }, [settingsPresets, app.lessonDeepLinkPending]);

  const selectPresetByDisplay = useCallback((display: string) => {
    const preset = settingsPresets.find(p => p.display === display);
    if (preset) void applyPresetRef.current(preset, false, true);
  }, [settingsPresets]);

  const reapplyCurrentPreset = useCallback(() => {
    if (app.selectedClass) {
      void applyPresetRef.current(selectedPresetRef.current, true);
    }
  }, [app.selectedClass]);

  const saveSettings = useCallback(() => {
    downloadSettingsFile(buildSnapshotFromApp(appRef.current));
  }, []);

  const loadSettingsFromFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportedSettingsFile(String(reader.result));
        const option: SettingsOption = {
          display: file.name.split('.')[0],
          filename: file.name,
          isCustom: true,
          isDummy: false,
          morseSettings: imported.morseSettings,
        };
        setCustomPresets(prev => [...prev, option]);
        void applyPresetRef.current(option, false, true);
      } catch {
        // ignore invalid files
      }
    };
    reader.readAsText(file);
  }, []);

  const presetsEnabled = allowSaveCookies && settingsPresets.length > 0;

  return {
    settingsPresets,
    selectedSettingsPreset,
    presetsEnabled,
    selectPresetByDisplay,
    reapplyCurrentPreset,
    saveSettings,
    loadSettingsFromFile,
  };
}
