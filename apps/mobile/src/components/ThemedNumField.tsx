import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';

interface ThemedNumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function ThemedNumField({
  label, value, onChange, min, max, step, disabled,
}: ThemedNumFieldProps) {
  const t = useTheme();

  return (
    <View style={s.row}>
      {label ? (
        <Text style={[s.label, { color: t.textMuted }, disabled && s.dimmed]}>{label}</Text>
      ) : null}
      <TextInput
        style={[
          s.input,
          {
            borderColor: t.border,
            backgroundColor: t.inputBg,
            color: t.inputText,
          },
          disabled && { backgroundColor: t.inputDisabledBg, opacity: 0.6 },
        ]}
        keyboardType={step === 1 ? 'number-pad' : 'decimal-pad'}
        editable={!disabled}
        value={String(value)}
        onChangeText={text => {
          const n = Number(text);
          if (!Number.isFinite(n)) return;
          let v = step === 1 ? Math.round(n) : n;
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  label: { fontSize: 12 },
  dimmed: { opacity: 0.5 },
  input: {
    borderWidth:       1,
    borderRadius:      6,
    paddingVertical:   4,
    paddingHorizontal: 8,
    fontSize:          14,
    minWidth:          48,
    textAlign:         'center',
  },
});
