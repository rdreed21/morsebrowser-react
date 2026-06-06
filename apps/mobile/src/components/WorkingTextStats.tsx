import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { useTheme } from '../utils/theme';

export function WorkingTextStats() {
  const app = useMorseApp();
  const t = useTheme();
  const { minutes, normedSeconds } = app.playingTime;

  return (
    <View style={[s.row, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Text style={[s.stat, { color: t.textMuted }]}>
        ⏱ {minutes}:{normedSeconds}
      </Text>
      <Text style={[s.divider, { color: t.border }]}>·</Text>
      <Text style={[s.stat, { color: t.textMuted }]}>
        {app.charsPlayed} / {app.charCount} chars
      </Text>
      <Text style={[s.divider, { color: t.border }]}>·</Text>
      <Text style={[s.stat, { color: t.textMuted }]}>
        {app.words.length} words
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderTopWidth:    1,
    borderBottomWidth: 1,
    gap:               6,
    flexWrap:          'wrap',
  },
  stat: { fontSize: 12 },
  divider: { fontSize: 12 },
});
