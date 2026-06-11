import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, Pressable, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/theme';

interface DropdownPickerProps {
  label: string;
  value: string;
  placeholder?: string;
  options: string[];
  disabled?: boolean;
  onSelect: (value: string) => void;
}

export function DropdownPicker({
  label, value, placeholder = 'Select…', options, disabled, onSelect,
}: DropdownPickerProps) {
  const t = useTheme();
  const [open, setOpen] = useState(false);

  if (options.length === 0) return null;

  return (
    <View style={s.group}>
      <Text style={[s.groupLabel, { color: t.textMuted }]}>{label}</Text>
      <TouchableOpacity
        style={[s.button, { borderColor: t.chipBorder, backgroundColor: t.surface }, disabled && s.disabled]}
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
      >
        <Text style={[s.buttonText, { color: value ? t.text : t.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={t.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[s.panel, { backgroundColor: t.bg, borderColor: t.chipBorder }]}>
            <Text style={[s.panelTitle, { color: t.text, borderBottomColor: t.border }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item}
              style={s.list}
              renderItem={({ item }) => {
                const active = item === value;
                return (
                  <TouchableOpacity
                    style={[s.option, { borderBottomColor: t.border }, active && { backgroundColor: t.accent }]}
                    onPress={() => { onSelect(item); setOpen(false); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[s.optionText, { color: active ? '#fff' : t.text }]}>{item}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  group: {
    flex:          1,
    minWidth:      120,
  },
  groupLabel: {
    fontSize:      11,
    fontWeight:    '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom:  4,
  },
  button: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderWidth:       1,
    borderRadius:      8,
    paddingVertical:   10,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize:   15,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         24,
  },
  panel: {
    width:       '100%',
    maxWidth:    480,
    maxHeight:   '70%',
    borderWidth: 1,
    borderRadius: 12,
    overflow:    'hidden',
  },
  panelTitle: {
    fontSize:          13,
    fontWeight:        '700',
    textTransform:     'uppercase',
    letterSpacing:     0.6,
    paddingVertical:   12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    paddingVertical:   14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 16,
  },
});
