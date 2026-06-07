import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { useMorsePlaybackControls } from '../context/MorsePlaybackContext';
import { getDisplayWord } from '../utils/words';
import { useTheme } from '../utils/theme';

export function WordCards() {
  const app = useMorseApp();
  const t = useTheme();
  const { setWordIndex } = useMorsePlaybackControls();
  const scrollRef = useRef<ScrollView>(null);
  const cardLayouts = useRef<Record<number, number>>({});

  useEffect(() => {
    const y = cardLayouts.current[app.currentIndex];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }
  }, [app.currentIndex]);

  if (!app.cardsVisible || app.words.length === 0) return null;

  const isLastWord = (i: number) => i === app.words.length - 1;
  const isCurrent  = (i: number) => i === app.currentIndex;

  const cardBg = (i: number): string => {
    if (isCurrent(i)) return isLastWord(i) ? t.danger : t.accent;
    return 'transparent';
  };

  const cardBorder = (i: number): string => {
    if (isCurrent(i)) return cardBg(i);
    return isLastWord(i) ? t.danger : t.chipBorder;
  };

  const cardTextColor = (i: number): string => {
    if (isCurrent(i)) return '#fff';
    return isLastWord(i) ? t.danger : t.chipText;
  };

  const getCardLabel = (i: number): string => {
    const raw = app.words[i] ?? '';
    const label = getDisplayWord(raw);
    const plainLen = label.replace(/\r/g, '').replace(/\n/g, '').trim().length;
    const revealed = !app.hideList || (app.trailReveal && i <= app.maxRevealedTrail);
    return revealed ? label : 'X'.repeat(plainLen || 1);
  };

  return (
    <View style={[s.section, { backgroundColor: t.bg }]}>
      <Text style={[s.sectionLabel, { color: t.textMuted }]}>Cards</Text>
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.grid}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {app.words.map((word, i) => (
          <View
            key={`${word}-${i}`}
            onLayout={e => { cardLayouts.current[i] = e.nativeEvent.layout.y; }}
          >
            <TouchableOpacity
              style={[
                s.card,
                { backgroundColor: cardBg(i), borderColor: cardBorder(i) },
              ]}
              onPress={() => app.addFlaggedWord(word)}
              onLongPress={() => setWordIndex(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: isCurrent(i) }}
              accessibilityLabel={getCardLabel(i)}
            >
              <Text
                style={[s.cardText, { fontSize: app.cardFontPx, color: cardTextColor(i) }]}
                numberOfLines={2}
              >
                {getCardLabel(i)}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: { flex: 1 },
  sectionLabel: {
    fontSize:          11,
    fontWeight:        '700',
    textTransform:     'uppercase',
    letterSpacing:     0.4,
    paddingHorizontal: 12,
    paddingTop:        6,
    paddingBottom:     2,
  },
  scroll: { flex: 1 },
  grid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: 8,
    paddingBottom:     8,
    gap:               6,
  },
  card: {
    borderWidth:       1,
    borderRadius:      4,
    paddingVertical:   8,
    paddingHorizontal: 12,
    alignItems:        'center',
    justifyContent:    'center',
    minWidth:          48,
    minHeight:         36,
  },
  cardText: {
    fontWeight: '500',
    textAlign:  'center',
  },
});
