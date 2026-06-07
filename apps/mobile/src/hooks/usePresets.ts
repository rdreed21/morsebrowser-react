import { useCallback, useEffect, useRef, useState } from 'react';
import {
  YOUR_SETTINGS_PRESET,
  DEFAULT_PRESET_KEY_BLACKLIST,
  applySerializedSettings,
  fetchSettingsPresetsForLesson,
  resolvePresetSettings,
  snapshotToSerialized,
  type SerializedSetting,
  type SettingsOption,
} from '@morsebrowser/core';
import { useMorseApp } from '../context/MorseAppContext';
import { pickAndParseSettingsFile, shareSettingsFile } from '../utils/mobileSettingsExport';
import { buildMutatorFromApp, buildSnapshotFromApp } from '../utils/settingsSnapshot';

const COOKIE_LOCKOUT_MS = 700;

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
        if (resolved.overridden) settingsOverriddenRef.current = true;
        applySerializedSettings(
          resolved.settings,
          buildMutatorFromApp(currentApp),
          DEFAULT_PRESET_KEY_BLACKLIST,
        );
      } else if (preset.isDummy && !savedYourSettingsRef.current) {
        savedYourSettingsRef.current = snapshotToSerialized(buildSnapshotFromApp(currentApp));
      }

      if (!skipReinit && currentApp.selectedDisplay?.display && fromClick) {
        setTimeout(() => onPresetAppliedRef.current?.(), 1000);
      }
    } finally {
      applyingRef.current = false;
    }
  }, [beginCookieLockout]);

  const applyPresetRef = useRef(applyPreset);
  applyPresetRef.current = applyPreset;

  const classKey = `${app.selectedClass}|${app.letterGroup}`;
  const prevClassKeyRef = useRef('');

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

      if (classChanged && app.selectedClass && presets.length > 1) {
        const current = selectedPresetRef.current;
        if (current.isDummy || current.filename !== presets[1].filename) {
          await applyPresetRef.current(presets[1], true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [classKey, customPresets, app.selectedClass]);

  const selectPresetByDisplay = useCallback((display: string) => {
    const preset = settingsPresets.find(p => p.display === display);
    if (preset) void applyPresetRef.current(preset, false, true);
  }, [settingsPresets]);

  const reapplyCurrentPreset = useCallback(() => {
    if (app.selectedClass) {
      void applyPresetRef.current(selectedPresetRef.current, true);
    }
  }, [app.selectedClass]);

  const saveSettings = useCallback(async () => {
    await shareSettingsFile(buildSnapshotFromApp(appRef.current));
  }, []);

  const loadSettingsFromFile = useCallback(async () => {
    try {
      const imported = await pickAndParseSettingsFile();
      if (!imported) return;
      const option: SettingsOption = {
        display: 'Imported',
        filename: 'imported.json',
        isCustom: true,
        isDummy: false,
        morseSettings: imported.morseSettings,
      };
      setCustomPresets(prev => [...prev, option]);
      await applyPresetRef.current(option, false, true);
    } catch {
      /* ignore invalid files */
    }
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
