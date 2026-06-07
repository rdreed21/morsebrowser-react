import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { useMorseAudio } from '../context/MorseAudioContext';
import { useTheme } from '../utils/theme';

export function ToneSettingsSection() {
  const app = useMorseApp();
  const t = useTheme();
  const { playTestTone, stopMorse } = useMorseAudio();
  const [toneActive, setToneActive] = useState(false);

  const [ditText, setDitText] = useState(String(app.ditFrequency));
  const [dahText, setDahText] = useState(String(app.dahFrequency));

  React.useEffect(() => { setDitText(String(app.ditFrequency)); }, [app.ditFrequency]);
  React.useEffect(() => { setDahText(String(app.dahFrequency)); }, [app.dahFrequency]);

  const commitDit = () => {
    const n = parseInt(ditText, 10);
    if (Number.isFinite(n)) { app.setDitFrequency(n); } else { setDitText(String(app.ditFrequency)); }
  };

  const commitDah = () => {
    const n = parseInt(dahText, 10);
    if (Number.isFinite(n)) { app.setDahFrequency(n); } else { setDahText(String(app.dahFrequency)); }
  };

  const handleZeroBeat = () => {
    if (toneActive) {
      stopMorse();
      setToneActive(false);
    } else {
      setToneActive(true);
      playTestTone(() => setToneActive(false));
    }
  };

  const inputStyle = {
    borderColor: t.border,
    backgroundColor: t.inputBg,
    color: t.inputText,
  };

  return (
    <View style={s.row}>
      <View style={s.group}>
        <Text style={[s.label, { color: t.textMuted }]}>DIT Hz</Text>
        <TextInput
          style={[s.input, inputStyle]}
          keyboardType="number-pad"
          value={ditText}
          onChangeText={setDitText}
          onBlur={commitDit}
          onSubmitEditing={commitDit}
          returnKeyType="done"
          selectTextOnFocus
        />
      </View>

      <TouchableOpacity
        style={[
          s.lockBtn,
          { borderColor: t.border, backgroundColor: t.surface },
          app.syncFreq && { backgroundColor: t.lockActiveBg, borderColor: t.accent },
        ]}
        onPress={() => app.setSyncFreq(!app.syncFreq)}
        accessibilityLabel={app.syncFreq ? 'Unlink frequencies' : 'Link frequencies'}
      >
        <Text style={s.lockIcon}>{app.syncFreq ? '🔒' : '🔓'}</Text>
      </TouchableOpacity>

      <View style={s.group}>
        <Text style={[s.label, { color: t.textMuted }]}>DAH Hz</Text>
        <TextInput
          style={[
            s.input,
            inputStyle,
            app.syncFreq && { backgroundColor: t.inputDisabledBg, color: t.textMuted },
          ]}
          keyboardType="number-pad"
          value={dahText}
          onChangeText={setDahText}
          onBlur={commitDah}
          onSubmitEditing={commitDah}
          editable={!app.syncFreq}
          returnKeyType="done"
          selectTextOnFocus
        />
      </View>

      <TouchableOpacity
        style={[
          s.zeroBeatBtn,
          { borderColor: t.border, backgroundColor: t.surface },
          toneActive && { backgroundColor: '#ffc107', borderColor: '#ffc107' },
        ]}
        onPress={handleZeroBeat}
        accessibilityLabel={toneActive ? 'Stop test tone' : 'Play test tone (Zero Beat)'}
      >
        <Text style={[s.zeroBeatText, { color: toneActive ? '#212529' : t.text }]}>
          {toneActive ? '⏹ Stop' : '♪ Zero Beat'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexWrap:      'wrap',
  },
  group: { alignItems: 'center', minWidth: 72 },
  label: {
    fontSize:     11,
    fontWeight:   '600',
    marginBottom: 2,
  },
  input: {
    borderWidth:       1,
    borderRadius:      6,
    paddingVertical:   4,
    paddingHorizontal: 6,
    fontSize:          15,
    textAlign:         'center',
    width:             80,
  },
  lockBtn: {
    paddingHorizontal: 6,
    paddingVertical:   8,
    borderRadius:      6,
    borderWidth:       1,
    minWidth:          36,
    alignItems:        'center',
  },
  lockIcon: { fontSize: 16 },
  zeroBeatBtn: {
    borderRadius:      6,
    paddingVertical:   8,
    paddingHorizontal: 12,
    borderWidth:       1,
  },
  zeroBeatText: {
    fontSize:   13,
    fontWeight: '600',
  },
});
