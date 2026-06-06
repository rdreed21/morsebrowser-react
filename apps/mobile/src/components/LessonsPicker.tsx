import React, { useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
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
import type { Theme } from '../utils/theme';

interface PickerProps {
  label: string;
  selected: string;
  options: string[];
  onSelect: (v: string) => void;
  disabled?: boolean;
}

function chipStyles(t: Theme, active: boolean) {
  return {
    chip: {
      borderWidth: 1,
      borderColor: active ? t.accent : t.chipBorder,
      borderRadius: 16,
      paddingVertical: 5,
      paddingHorizontal: 12,
      backgroundColor: active ? t.accent : 'transparent',
    } as const,
    text: {
      fontSize: 13,
      color: active ? t.chipTextActive : t.chipText,
      fontWeight: '500' as const,
    },
  };
}

function InlinePicker({ label, selected, options, onSelect, disabled }: PickerProps) {
  const t = useTheme();
  if (options.length === 0) return null;
  return (
    <View style={p.group}>
      <Text style={[p.groupLabel, { color: t.textMuted }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={p.chips}>
          {options.map(opt => {
            const active = selected === opt;
            const cs = chipStyles(t, active);
            return (
              <TouchableOpacity
                key={opt}
                style={[cs.chip, disabled && p.chipDisabled]}
                onPress={() => !disabled && onSelect(opt)}
              >
                <Text style={cs.text}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

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
        app.setShowingText(generateRandomPractice({ ...result.config, practiceSeconds }));
      }
      app.setNewlineChunking(option.newlineChunking);
      app.setCurrentIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
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

      <InlinePicker label="TYPE" selected={app.userTarget} options={userTargets} onSelect={app.setUserTarget} />
      <InlinePicker label="CLASS" selected={app.selectedClass} options={classes} onSelect={app.setSelectedClass} disabled={classes.length === 0} />
      <InlinePicker label="CONTENT" selected={app.letterGroup} options={letterGroups} onSelect={app.setLetterGroup} disabled={letterGroups.length === 0} />

      {displays.length > 0 && (
        <View style={p.group}>
          <Text style={[p.groupLabel, { color: t.textMuted }]}>LESSON</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={p.chips}>
              {displays.map(d => {
                const active = app.selectedDisplay?.fileName === d.fileName;
                const cs = chipStyles(t, active);
                return (
                  <TouchableOpacity
                    key={d.fileName}
                    style={cs.chip}
                    onPress={() => handleDisplaySelect(d)}
                  >
                    <Text style={cs.text}>{d.display}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {settingsPresets.length > 0 && (
        <View style={p.group}>
          <Text style={[p.groupLabel, { color: t.textMuted }]}>PRESETS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={p.chips}>
              {settingsPresets.map(preset => {
                const active = selectedSettingsPreset.display === preset.display;
                const cs = chipStyles(t, active);
                return (
                  <TouchableOpacity
                    key={preset.filename + preset.display}
                    style={[cs.chip, !presetsEnabled && p.chipDisabled]}
                    disabled={!presetsEnabled}
                    onPress={() => selectPresetByDisplay(preset.display)}
                  >
                    <Text style={cs.text}>{preset.display}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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
  groupLabel: {
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    gap:           6,
    paddingVertical: 2,
  },
  chipDisabled: { opacity: 0.4 },
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
