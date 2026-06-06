import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { CheckToggle } from './CheckToggle';
import { ThemedNumField } from './ThemedNumField';
import { useTheme } from '../utils/theme';

export function VoiceOptionsSection() {
  const app = useMorseApp();
  const t = useTheme();
  const voiceOn = app.voiceEnabled;

  useEffect(() => {
    app.initVoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedVoice = app.voiceVoiceIdx >= 0
    ? app.voiceVoices[app.voiceVoiceIdx]?.name
    : 'Choose speaker…';

  return (
    <View style={s.container}>
      {!app.voiceCapable && (
        <Text style={[s.note, { color: t.textMuted }]}>Speech not available on this device.</Text>
      )}

      <View style={s.chipRow}>
        <CheckToggle label="Voice" checked={app.voiceEnabled} onChange={app.setVoiceEnabled} disabled={!app.voiceCapable || app.manualVoice} />
        <CheckToggle label="Spell" checked={app.voiceSpelling} onChange={app.setVoiceSpelling} disabled={!voiceOn} />
        <CheckToggle label="Arm Recap" checked={app.manualVoice} onChange={app.setManualVoice} disabled={!voiceOn} />
        <CheckToggle label="Voice First" checked={app.speakFirst} onChange={app.setSpeakFirst} disabled={!voiceOn} />
        <CheckToggle label="Last Only" checked={app.voiceLastOnly} onChange={app.setVoiceLastOnly} disabled={!voiceOn} />
      </View>

      <View style={s.row}>
        <ThemedNumField label="Delay Before" value={app.voiceThinkingTime} onChange={app.setVoiceThinkingTime} min={0} max={10} disabled={!voiceOn} />
        <Text style={[s.wpmHint, { color: t.textMuted }]}>{app.voiceThinkingTimeWpm} wpm</Text>
        <ThemedNumField label="Delay After" value={app.voiceAfterThinkingTime} onChange={app.setVoiceAfterThinkingTime} min={0} max={10} disabled={!voiceOn} />
      </View>

      <View style={s.row}>
        <ThemedNumField label="Volume" value={app.voiceVolume} onChange={app.setVoiceVolume} min={0} max={10} step={1} disabled={!voiceOn} />
        <ThemedNumField label="Pitch" value={app.voicePitch} onChange={app.setVoicePitch} min={0} max={2} disabled={!voiceOn} />
        <ThemedNumField label="Rate" value={app.voiceRate} onChange={app.setVoiceRate} min={0.1} max={10} disabled={!voiceOn} />
        <ThemedNumField label="Voice After" value={app.voiceBufferMaxLength} onChange={app.setVoiceBufferMaxLength} min={1} max={999} step={1} disabled={!voiceOn} />
      </View>

      {voiceOn && app.voiceVoices.length > 0 && (
        <View style={s.group}>
          <Text style={[s.groupLabel, { color: t.textMuted }]}>SPEAKER — {selectedVoice}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.chips}>
              {app.voiceVoices.map(v => (
                <TouchableOpacity
                  key={v.identifier}
                  style={[
                    s.chip,
                    { borderColor: t.chipBorder },
                    app.voiceVoiceIdx === v.idx && { backgroundColor: t.accent, borderColor: t.accent },
                  ]}
                  onPress={() => app.setVoiceVoiceIdx(v.idx)}
                >
                  <Text
                    style={[
                      s.chipText,
                      { color: t.chipText },
                      app.voiceVoiceIdx === v.idx && { color: t.chipTextActive },
                    ]}
                    numberOfLines={1}
                  >
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 10 },
  note: { fontSize: 12, fontStyle: 'italic' },
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  row: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    alignItems:    'flex-end',
  },
  wpmHint: {
    fontSize:      12,
    paddingBottom: 8,
  },
  group: { gap: 4 },
  groupLabel: {
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.4,
  },
  chips: {
    flexDirection: 'row',
    gap:           6,
    paddingVertical: 2,
  },
  chip: {
    borderWidth:       1,
    borderRadius:      16,
    paddingVertical:   5,
    paddingHorizontal: 10,
    maxWidth:          180,
  },
  chipText: { fontSize: 12 },
});
