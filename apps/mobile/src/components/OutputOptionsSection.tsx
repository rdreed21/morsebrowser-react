import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useMorseApp } from '../context/MorseAppContext';
import { CheckToggle } from './CheckToggle';
import { ThemedNumField } from './ThemedNumField';

export function OutputOptionsSection() {
  const app = useMorseApp();

  return (
    <View style={s.container}>
      <View style={s.grid}>
        <ThemedNumField label="PRE (silence)" value={app.preSpace} onChange={app.setPreSpace} min={0} max={1200} />
        <ThemedNumField label="Word Space" value={app.xtraWordSpaceDits} onChange={app.setXtraWordSpaceDits} min={1} max={10} step={1} />
        <ThemedNumField label="Card Wait" value={app.cardSpace} onChange={app.setCardSpace} min={0} max={10} step={1} />
        <ThemedNumField label="Card Size" value={app.cardFontPx} onChange={app.setCardFontPx} min={1} max={1200} step={1} />
      </View>
      <CheckToggle label="Show Cards" checked={app.cardsVisible} onChange={app.setCardsVisible} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
  },
});
