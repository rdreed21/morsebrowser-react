import React, { useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import {
  getUserTargets, getClasses, getLetterGroups, getDisplays,
  type WordListOption,
} from '@morsebrowser/core';
import { useMorseApp } from '../context/MorseAppContext';
import { usePresets } from '../hooks/usePresets';
import { loadMobileLessonFile } from '../utils/loadMobileLessonFile';
import {
  generateRandomPractice, resolvePracticeSeconds,
} from '../utils/lessonPractice';
import { useTheme } from '../utils/theme';
import { DropdownPicker } from './shared/DropdownPicker';

export function LessonsPicker() {
  const app = useMorseApp();
  const t = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const selectedDisplayRef = useRef(app.selectedDisplay);
  selectedDisplayRef.current = app.selectedDisplay;

  const userTargets = useMemo(() => getUserTargets(), []);
  const classes = useMemo(
    () => app.userTarget ? getClasses(app.userTarget) : [],
    [app.userTarget],
  );
  const letterGroups = useMemo(
    () => (app.userTarget && app.selectedClass)
      ? getLetterGroups(app.userTarget, app.selectedClass) : [],
    [app.userTarget, app.selectedClass],
  );
  const displays = useMemo(
    () => (app.userTarget && app.selectedClass && app.letterGroup)
      ? getDisplays(app.userTarget, app.selectedClass, app.letterGroup) : [],
    [app.userTarget, app.selectedClass, app.letterGroup],
  );

  const loadLesson = useCallback(async (option: WordListOption) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadMobileLessonFile(option.fileName);
      if (result.type === 'text') {
        app.setShowingText(result.content.trim().replace(/\n/g, option.newlineChunking ? '\n' : ' '));
      } else {
        const practiceSeconds = resolvePracticeSeconds(
          result.config,
          app.ifOverrideTime,
          app.overrideMins,
          app.ifCustomGroup,
        );
        const minWordSize = app.ifOverrideMinMax ? app.overrideMin : result.config.minWordSize;
        const maxWordSize = app.ifOverrideMinMax ? app.overrideMax : result.config.maxWordSize;
        app.setShowingText(generateRandomPractice({
          ...result.config, practiceSeconds, minWordSize, maxWordSize,
        }));
      }
      app.setNewlineChunking(option.newlineChunking);
      app.setCurrentIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
      app.closeLessonAccordionIfAutoClosing();
    }
  }, [app]);

  const loadLessonRef = useRef(loadLesson);
  loadLessonRef.current = loadLesson;

  const {
    settingsPresets,
    selectedSettingsPreset,
    presetsEnabled,
    selectPresetByDisplay,
    reapplyCurrentPreset,
    saveSettings,
    loadSettingsFromFile,
  } = usePresets(() => {
    const display = selectedDisplayRef.current;
    if (display) void loadLessonRef.current(display);
  });

  const handleDisplaySelect = useCallback((option: WordListOption) => {
    app.setSelectedDisplay(option);
    void loadLesson(option).then(() => reapplyCurrentPreset());
  }, [app, loadLesson, reapplyCurrentPreset]);

  const badge = app.selectedDisplay?.display;
  const presetLabel = selectedSettingsPreset.display || app.selectedPreset;

  return (
    <View style={p.container}>
      {(badge || presetLabel !== 'Your Settings') && (
        <View style={p.badgeRow}>
          {badge && (
            <View style={[p.badge, { backgroundColor: t.success }]}>
              <Text style={p.badgeText}>{badge}</Text>
            </View>
          )}
          {presetLabel !== 'Your Settings' && (
            <View style={[p.badge, { backgroundColor: t.secondary }]}>
              <Text style={p.badgeText}>⚙ {presetLabel}</Text>
            </View>
          )}
        </View>
      )}

      <View style={p.row}>
        <DropdownPicker label="TYPE" value={app.userTarget} options={userTargets} onSelect={app.setUserTarget} />
        <DropdownPicker label="CLASS" value={app.selectedClass} options={classes} onSelect={app.setSelectedClass} disabled={classes.length === 0} />
      </View>
      <DropdownPicker label="CONTENT" value={app.letterGroup} options={letterGroups} onSelect={app.setLetterGroup} disabled={letterGroups.length === 0} />

      {displays.length > 0 && (
        <DropdownPicker
          label="LESSON"
          value={app.selectedDisplay?.display ?? ''}
          placeholder="Select a lesson"
          options={displays.map(d => d.display)}
          onSelect={display => {
            const option = displays.find(d => d.display === display);
            if (option) handleDisplaySelect(option);
          }}
        />
      )}

      {settingsPresets.length > 0 && (
        <View style={p.group}>
          <DropdownPicker
            label="PRESETS"
            value={selectedSettingsPreset.display}
            placeholder="Select a preset"
            options={settingsPresets.map(preset => preset.display)}
            disabled={!presetsEnabled}
            onSelect={display => selectPresetByDisplay(display)}
          />
          <View style={p.presetActions}>
            <TouchableOpacity
              style={[p.actionBtn, { borderColor: t.accent }, !presetsEnabled && p.actionBtnDisabled]}
              onPress={() => void saveSettings()}
              disabled={!presetsEnabled}
            >
              <Text style={[p.actionBtnText, { color: t.accent }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[p.actionBtn, { borderColor: t.accent }, !presetsEnabled && p.actionBtnDisabled]}
              onPress={() => void loadSettingsFromFile()}
              disabled={!presetsEnabled}
            >
              <Text style={[p.actionBtnText, { color: t.accent }]}>Load</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {app.ifCustomGroup && app.customGroup.trim().length > 0 && (
        <TouchableOpacity
          style={[p.applyBtn, { backgroundColor: t.accent }]}
          onPress={() => void app.applyLesson()}
        >
          <Text style={p.applyBtnText}>Apply Custom Group</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator size="small" color={t.accent} />}
      {error && <Text style={[p.errorText, { color: t.danger }]}>{error}</Text>}
    </View>
  );
}

const p = StyleSheet.create({
  container: { gap: 10 },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  badge: {
    borderRadius:      10,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  badgeText: {
    color:      '#fff',
    fontSize:   12,
    fontWeight: '600',
  },
  group: { gap: 4 },
  row: {
    flexDirection: 'row',
    gap:           8,
  },
  presetActions: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     4,
  },
  actionBtn: {
    borderWidth:       1,
    borderRadius:      6,
    paddingVertical:   6,
    paddingHorizontal: 16,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnText: {
    fontWeight: '600',
    fontSize:   13,
  },
  applyBtn: {
    borderRadius:    6,
    paddingVertical: 10,
    alignItems:      'center',
  },
  applyBtnText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   14,
  },
  errorText: { fontSize: 12 },
});
