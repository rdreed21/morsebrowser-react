import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { useTheme } from '../utils/theme';

export function InputOptionsSection() {
  const app = useMorseApp();
  const t = useTheme();

  return (
    <View style={s.container}>
      <View style={s.toolbar}>
        <TouchableOpacity
          style={[s.toolBtn, { borderColor: t.border, backgroundColor: t.surface }]}
          onPress={() => app.setShowRaw(!app.showRaw)}
          accessibilityLabel={app.showRaw ? 'Hide text' : 'View text'}
        >
          <Text style={[s.toolBtnText, { color: t.text }]}>
            {app.showRaw ? '👁 Hide' : '👁 View'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toolBtn, { borderColor: t.border, backgroundColor: t.surface }]}
          onPress={app.clearText}
          accessibilityLabel="Clear text"
        >
          <Text style={[s.toolBtnText, { color: t.text }]}>🗑 Clear</Text>
        </TouchableOpacity>
      </View>

      {app.showRaw && (
        <TextInput
          style={[s.textarea, {
            borderColor: t.border,
            color: t.inputText,
            backgroundColor: t.inputBg,
          }]}
          multiline
          value={app.showingText}
          onChangeText={app.setShowingText}
          placeholder="Type or paste practice text…"
          placeholderTextColor={t.textMuted}
          textAlignVertical="top"
          accessibilityLabel="Practice text"
          returnKeyType="default"
        />
      )}

      {app.flaggedWordsCount > 0 && (
        <View style={s.flaggedRow}>
          <Text style={[s.flaggedLabel, { color: t.textMuted }]}>
            Flagged: {app.flaggedWordsCount} words
          </Text>
          <TouchableOpacity onPress={app.clearFlaggedWords}>
            <Text style={[s.flaggedClear, { color: t.danger }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 8 },
  toolbar: {
    flexDirection: 'row',
    gap:           8,
    flexWrap:      'wrap',
  },
  toolBtn: {
    borderWidth:       1,
    borderRadius:      6,
    paddingVertical:   6,
    paddingHorizontal: 12,
  },
  toolBtnText: { fontSize: 13 },
  textarea: {
    borderWidth: 1,
    borderRadius: 6,
    padding:      10,
    fontSize:     14,
    minHeight:    100,
    maxHeight:    200,
  },
  flaggedRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  flaggedLabel: { fontSize: 12 },
  flaggedClear: { fontSize: 12, fontWeight: '600' },
});
