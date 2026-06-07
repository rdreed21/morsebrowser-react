import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { useTheme } from '../utils/theme';

export function InputOptionsSection() {
  const app = useMorseApp();
  const t = useTheme();
  const [showFlaggedList, setShowFlaggedList] = useState(false);

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
        <View style={[s.flaggedPanel, { borderColor: t.border }]}>
          <TouchableOpacity
            style={s.flaggedRow}
            onPress={() => setShowFlaggedList(v => !v)}
            accessibilityLabel={showFlaggedList ? 'Hide flagged words list' : 'Show flagged words list'}
          >
            <Text style={[s.flaggedLabel, { color: t.textMuted }]}>
              🚩 Flagged: {app.flaggedWordsCount} words {showFlaggedList ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          <View style={s.flaggedActions}>
            <TouchableOpacity
              style={[s.toolBtn, { borderColor: t.border, backgroundColor: t.surface }]}
              onPress={app.loadFlaggedAsText}
              accessibilityLabel="Load flagged words as practice text"
            >
              <Text style={[s.toolBtnText, { color: t.text }]}>📋 Load As Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toolBtn, { borderColor: t.danger, backgroundColor: t.surface }]}
              onPress={app.clearFlaggedWords}
              accessibilityLabel="Clear flagged words"
            >
              <Text style={[s.toolBtnText, { color: t.danger }]}>🗑 Clear</Text>
            </TouchableOpacity>
          </View>

          {showFlaggedList && (
            <TextInput
              style={[s.flaggedTextarea, {
                borderColor: t.border,
                color: t.inputText,
                backgroundColor: t.inputBg,
              }]}
              multiline
              value={app.flaggedWords}
              onChangeText={app.setFlaggedWords}
              textAlignVertical="top"
              accessibilityLabel="Flagged words (editable)"
            />
          )}
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
  flaggedPanel: {
    borderWidth:  1,
    borderRadius: 6,
    padding:      8,
    gap:          8,
  },
  flaggedRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  flaggedLabel:   { fontSize: 12, fontWeight: '600' },
  flaggedActions: {
    flexDirection: 'row',
    gap:           8,
    flexWrap:      'wrap',
  },
  flaggedTextarea: {
    borderWidth:  1,
    borderRadius: 6,
    padding:      10,
    fontSize:     13,
    minHeight:    80,
    maxHeight:    160,
  },
});
