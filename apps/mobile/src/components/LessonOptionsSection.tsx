import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { CheckToggle } from './CheckToggle';
import { ThemedNumField } from './ThemedNumField';
import { useTheme } from '../utils/theme';

export function LessonOptionsSection() {
  const app = useMorseApp();
  const t = useTheme();
  const [applying, setApplying] = React.useState(false);

  const onApply = async () => {
    setApplying(true);
    try { await app.applyLesson(); } finally { setApplying(false); }
  };

  return (
    <View style={s.container}>
      <Text style={[s.legend, { color: t.textMuted }]}>Overrides</Text>
      <View style={s.row}>
        <CheckToggle label="Custom Group" checked={app.ifCustomGroup} onChange={app.setIfCustomGroup} />
      </View>
      {app.ifCustomGroup && (
        <TextInput
          style={[s.textInput, {
            borderColor: t.border,
            color: t.inputText,
            backgroundColor: t.inputBg,
          }]}
          value={app.customGroup}
          onChangeText={app.setCustomGroup}
          placeholder="Letters e.g. A B C D"
          placeholderTextColor={t.textMuted}
        />
      )}

      <View style={s.row}>
        <CheckToggle label="Override Time" checked={app.ifOverrideTime} onChange={app.setIfOverrideTime} />
        {app.ifOverrideTime && (
          <ThemedNumField label="Mins" value={app.overrideMins} onChange={app.setOverrideMins} min={0} />
        )}
      </View>

      <View style={s.row}>
        <CheckToggle label="Sticky Sets" checked={app.ifStickySets} onChange={app.setIfStickySets} />
      </View>
      {app.ifStickySets && (
        <TextInput
          style={[s.textInput, {
            borderColor: t.border,
            color: t.inputText,
            backgroundColor: t.inputBg,
          }]}
          value={app.stickySets}
          onChangeText={app.setStickySets}
          placeholder="Sticky set text"
          placeholderTextColor={t.textMuted}
        />
      )}

      <View style={s.row}>
        <CheckToggle label="Override Size" checked={app.ifOverrideMinMax} onChange={app.setIfOverrideMinMax} />
      </View>
      {app.ifOverrideMinMax && (
        <View style={s.row}>
          <ThemedNumField label="Min" value={app.overrideMin} onChange={app.setOverrideMin} min={1} />
          <TouchableOpacity onPress={() => app.setSyncSize(!app.syncSize)} style={s.syncBtn}>
            <Text style={[s.syncBtnText, { color: t.accent }]}>Max {app.syncSize ? '🔒' : '🔓'}</Text>
          </TouchableOpacity>
          <ThemedNumField
            label=""
            value={app.overrideMax}
            onChange={app.setOverrideMax}
            min={app.overrideMin}
            disabled={app.syncSize}
          />
        </View>
      )}

      {app.applyEnabled && (
        <TouchableOpacity
          style={[s.applyBtn, { backgroundColor: t.accent }, applying && s.applyBtnDisabled]}
          onPress={onApply}
          disabled={applying}
        >
          {applying
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={s.applyBtnText}>Apply</Text>}
        </TouchableOpacity>
      )}

      <Text style={[s.legend, s.legendSpaced, { color: t.textMuted }]}>Playback</Text>
      <View style={s.chipRow}>
        <CheckToggle label="Randomize" checked={app.randomizeLessons} onChange={app.setRandomizeLessons} />
        <CheckToggle label="Keep Lines" checked={app.newlineChunking} onChange={app.setNewlineChunking} />
        <CheckToggle label="Shuffle Intra-group" checked={app.shuffleIntraGroup} onChange={app.setShuffleIntraGroup} />
        <CheckToggle label="Auto Close" checked={app.autoCloseLessonAccordion} onChange={app.setAutoCloseLessonAccordion} />
      </View>

      <Text style={[s.legend, s.legendSpaced, { color: t.textMuted }]}>Timing</Text>
      <View style={s.row}>
        <ThemedNumField label="Repeats" value={app.numberOfRepeats} onChange={app.setNumberOfRepeats} min={0} max={10} step={1} />
        <ThemedNumField
          label="Repeat Spacing"
          value={app.speakFirstAdditionalWordspaces}
          onChange={app.setSpeakFirstAdditionalWordspaces}
          min={0}
          max={10}
          step={1}
        />
      </View>

      <View style={s.row}>
        <CheckToggle label="Speed Intervals" checked={app.speedInterval} onChange={app.setSpeedInterval} />
      </View>
      {app.speedInterval && (
        <View style={s.intervalGroup}>
          <View style={s.intervalRow}>
            <Text style={[s.intervalLabel, { color: t.textMuted }]}>Timings</Text>
            <TextInput
              style={[s.intervalInput, {
                borderColor: t.border,
                color: t.inputText,
                backgroundColor: t.inputBg,
              }]}
              value={app.intervalTimingsText}
              onChangeText={app.setIntervalTimingsText}
              placeholder="e.g. 60, 60, 60"
              placeholderTextColor={t.textMuted}
            />
          </View>
          <View style={s.intervalRow}>
            <Text style={[s.intervalLabel, { color: t.textMuted }]}>WPM</Text>
            <TextInput
              style={[s.intervalInput, {
                borderColor: t.border,
                color: t.inputText,
                backgroundColor: t.inputBg,
              }]}
              value={app.intervalWpmText}
              onChangeText={app.setIntervalWpmText}
              placeholder="e.g. 15, 20, 25"
              placeholderTextColor={t.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={s.intervalRow}>
            <Text style={[s.intervalLabel, { color: t.textMuted }]}>FWPM</Text>
            <TextInput
              style={[s.intervalInput, {
                borderColor: t.border,
                color: t.inputText,
                backgroundColor: t.inputBg,
              }]}
              value={app.intervalFwpmText}
              onChangeText={app.setIntervalFwpmText}
              placeholder="e.g. 15, 18, 20"
              placeholderTextColor={t.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>
      )}

      <Text style={[s.legend, s.legendSpaced, { color: t.textMuted }]}>Trail</Text>
      <View style={s.chipRow}>
        <CheckToggle label="Trail Reveal" checked={app.trailReveal} onChange={app.setTrailReveal} />
      </View>
      {app.trailReveal && (
        <View style={s.row}>
          <ThemedNumField label="Pre" value={app.trailPreDelay} onChange={app.setTrailPreDelay} min={0} />
          <ThemedNumField label="Post" value={app.trailPostDelay} onChange={app.setTrailPostDelay} min={0} />
          <ThemedNumField label="Final" value={app.trailFinal} onChange={app.setTrailFinal} min={0} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 8 },
  legend: {
    fontSize:      12,
    fontWeight:    '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  legendSpaced: { marginTop: 8 },
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
    alignItems:    'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  textInput: {
    borderWidth:  1,
    borderRadius: 6,
    padding:      8,
    fontSize:     14,
  },
  intervalGroup: { gap: 6 },
  intervalRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  intervalLabel: {
    fontSize:  12,
    fontWeight: '600',
    width:     52,
  },
  intervalInput: {
    flex:              1,
    borderWidth:       1,
    borderRadius:      6,
    paddingVertical:   6,
    paddingHorizontal: 10,
    fontSize:          14,
  },
  syncBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  syncBtnText: { fontSize: 12 },
  applyBtn: {
    borderRadius:    6,
    paddingVertical: 10,
    alignItems:      'center',
    marginTop:       4,
  },
  applyBtnDisabled: { opacity: 0.6 },
  applyBtnText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   14,
  },
});
