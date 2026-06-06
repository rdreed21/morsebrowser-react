import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../utils/theme';

interface CheckToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

export function CheckToggle({ label, checked, onChange, disabled }: CheckToggleProps) {
  const t = useTheme();

  return (
    <TouchableOpacity
      style={[
        s.toggle,
        { borderColor: t.chipBorder },
        checked && { backgroundColor: t.accent, borderColor: t.accent },
        disabled && s.toggleDisabled,
      ]}
      onPress={() => !disabled && onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <Text style={[s.toggleText, { color: t.chipText }, checked && s.toggleTextOn]}>
        {label}
      </Text>
      <Text style={[s.icon, { color: checked ? '#fff' : t.chipText }]}>
        {checked ? '✓' : '○'}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  toggle: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderWidth:       1,
    borderRadius:      6,
    paddingVertical:   7,
    paddingHorizontal: 10,
    backgroundColor:   'transparent',
    minWidth:          120,
  },
  toggleDisabled: { opacity: 0.5 },
  toggleText: {
    fontSize:   13,
    fontWeight: '500',
    flex:       1,
  },
  toggleTextOn: { color: '#fff' },
  icon: {
    fontSize:  14,
    marginLeft: 6,
  },
});
