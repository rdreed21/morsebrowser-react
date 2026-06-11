import React, {
  useEffect, useRef, useState, type ReactNode,
} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, LayoutAnimation,
} from 'react-native';
import { useTheme } from '../utils/theme';

interface SettingsSectionProps {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  /** When this flips to true, the section collapses itself (e.g. on playback start). */
  collapseWhen?: boolean;
  /** When this value changes, the section collapses itself (e.g. after auto-applying a lesson). */
  collapseSignal?: number;
  children: ReactNode;
}

export function SettingsSection({
  title,
  badge,
  defaultOpen = false,
  collapseWhen = false,
  collapseSignal,
  children,
}: SettingsSectionProps) {
  const t = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(o => !o);
  };

  useEffect(() => {
    if (collapseWhen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOpen(false);
    }
  }, [collapseWhen]);

  const isFirstCollapseSignal = useRef(true);
  useEffect(() => {
    if (collapseSignal === undefined) return;
    if (isFirstCollapseSignal.current) {
      isFirstCollapseSignal.current = false;
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(false);
  }, [collapseSignal]);

  return (
    <View style={[s.container, { backgroundColor: t.bg, borderColor: t.border }]}>
      <TouchableOpacity
        style={[s.header, { backgroundColor: t.surface }]}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <View style={s.headerLeft}>
          <Text style={[s.title, { color: t.text }]}>{title}</Text>
          {badge ? (
            <View style={[s.badge, { backgroundColor: t.badgeBg }]}>
              <Text style={s.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[s.chevron, { color: t.textMuted }]}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      <View style={[s.body, !open && s.bodyHidden]}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderWidth:  1,
    borderRadius: 6,
    marginBottom: 8,
    overflow:     'hidden',
  },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 14,
    paddingVertical:   12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flex:          1,
  },
  title: {
    fontWeight: '600',
    fontSize:   14,
  },
  badge: {
    borderRadius:      10,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  badgeText: {
    color:      '#fff',
    fontSize:   11,
    fontWeight: '600',
  },
  chevron: { fontSize: 12 },
  body: { padding: 12 },
  bodyHidden: { display: 'none' },
});
