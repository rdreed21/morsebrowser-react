import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { useTheme } from '../utils/theme';

export function SpeedSettingsBar() {
  const app = useMorseApp();
  const t = useTheme();
  const [wpmText, setWpmText] = useState(String(app.charWPM));
  const [fwpmText, setFwpmText] = useState(String(app.effectiveWPM));
  const [volText, setVolText] = useState(String(app.koVolume));

  const commitWpm = () => {
    const n = parseInt(wpmText, 10);
    if (Number.isFinite(n) && n > 0) {
      app.setCharWPM(n);
      if (app.syncWpm) setFwpmText(String(n));
    } else {
      setWpmText(String(app.charWPM));
    }
  };

  const commitFwpm = () => {
    const n = parseInt(fwpmText, 10);
    if (Number.isFinite(n) && n > 0) {
      app.setEffectiveWPM(n);
    } else {
      setFwpmText(String(app.effectiveWPM));
    }
  };

  const commitVol = () => {
    const n = parseInt(volText, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 10) {
      app.setKoVolume(n);
    } else {
      setVolText(String(app.koVolume));
    }
  };

  React.useEffect(() => { setWpmText(String(app.charWPM)); }, [app.charWPM]);
  React.useEffect(() => { setFwpmText(String(app.effectiveWPM)); }, [app.effectiveWPM]);
  React.useEffect(() => { setVolText(String(app.koVolume)); }, [app.koVolume]);

  const inputStyle = {
    borderColor: t.border,
    backgroundColor: t.inputBg,
    color: t.inputText,
  };

  return (
    <View style={[s.row, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
      <View style={s.group}>
        <Text style={[s.label, { color: t.textMuted }]}>WPM</Text>
        <TextInput
          style={[s.input, inputStyle]}
          keyboardType="number-pad"
          value={wpmText}
          onChangeText={setWpmText}
          onBlur={commitWpm}
          onSubmitEditing={commitWpm}
          returnKeyType="done"
          selectTextOnFocus
        />
      </View>

      <TouchableOpacity
        style={[
          s.lockBtn,
          { borderColor: t.border, backgroundColor: t.surface },
          app.syncWpm && { backgroundColor: t.lockActiveBg, borderColor: t.accent },
        ]}
        onPress={() => app.setSyncWpm(!app.syncWpm)}
        accessibilityLabel={app.syncWpm ? 'Unlink WPM/FWPM' : 'Link WPM/FWPM'}
      >
        <Text style={s.lockIcon}>{app.syncWpm ? '🔒' : '🔓'}</Text>
      </TouchableOpacity>

      <View style={s.group}>
        <Text style={[s.label, { color: t.textMuted }]}>FWPM</Text>
        <TextInput
          style={[
            s.input,
            inputStyle,
            app.syncWpm && { backgroundColor: t.inputDisabledBg, color: t.textMuted },
          ]}
          keyboardType="number-pad"
          value={fwpmText}
          onChangeText={setFwpmText}
          onBlur={commitFwpm}
          onSubmitEditing={commitFwpm}
          editable={!app.syncWpm}
          returnKeyType="done"
          selectTextOnFocus
        />
      </View>

      <View style={s.group}>
        <Text style={[s.label, { color: t.textMuted }]}>Vol</Text>
        <TextInput
          style={[s.input, inputStyle]}
          keyboardType="number-pad"
          value={volText}
          onChangeText={setVolText}
          onBlur={commitVol}
          onSubmitEditing={commitVol}
          returnKeyType="done"
          selectTextOnFocus
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 12,
    paddingVertical:   8,
    gap:               8,
    borderBottomWidth: 1,
  },
  group: { alignItems: 'center', flex: 1 },
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
    fontSize:          16,
    textAlign:         'center',
    width:             '100%',
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
});
