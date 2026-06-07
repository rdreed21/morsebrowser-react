import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useTheme } from '../utils/theme';

interface LinkItem {
  label: string;
  url: string;
}

const LINKS: LinkItem[] = [
  { label: 'Audio engine: morse-pro by SC Phillips', url: 'https://github.com/scp93ch/morse-pro' },
  { label: 'Source code: Long Island CW Club GitHub', url: 'https://github.com/LongIslandCW/morsebrowser/' },
  { label: 'Questions, bugs, or feature requests', url: 'mailto:AB5TN48@gmail.com' },
  { label: 'Video walkthroughs (YouTube playlist)', url: 'https://www.youtube.com/playlist?list=PLt-EzlLx2AKFY8NVxxPVBbPzR6s-Kz7tJ' },
  { label: 'User guide: LICW academic downloads', url: 'https://longislandcwclub.org/academic-downloads/' },
  { label: 'longislandcwclub.org', url: 'https://longislandcwclub.org/' },
];

export function AboutSection() {
  const t = useTheme();
  const appVersion = Constants.expoConfig?.version;

  return (
    <View style={s.container}>
      <Text style={[s.body, { color: t.text }]}>
        Morse Practice Page by KN4YRM, with assistance from AB5TN, KN6WKV, KQ4NKF, N1CC, VE3QBZ,
        VK5PL, WO6W, W4EMB, and W6JY.
      </Text>

      <View style={s.linkList}>
        {LINKS.map(link => (
          <TouchableOpacity
            key={link.url}
            onPress={() => Linking.openURL(link.url)}
            accessibilityRole="link"
            accessibilityLabel={link.label}
          >
            <Text style={[s.link, { color: t.accent }]}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {appVersion ? (
        <Text style={[s.muted, { color: t.textMuted }]}>App version {appVersion}</Text>
      ) : null}

      <View style={[s.divider, { backgroundColor: t.border }]} />

      <Text style={[s.legalHeading, { color: t.text }]}>LICW™ is a trademark of the Long Island CW Club Inc.</Text>
      <Text style={[s.legal, { color: t.textMuted }]}>© 2022-2026 Long Island CW Club Inc. All rights reserved.</Text>
      <Text style={[s.legal, { color: t.textMuted }]}>
        This work is the sole property of the Long Island CW Club Inc. (LICW). It may be downloaded
        and printed for the use of Long Island CW Club Inc. instructors and students. It may not be
        reproduced on paper or digitally for other purposes without the express consent of the
        Long Island CW Club Inc.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 10 },
  body: {
    fontSize:   13,
    lineHeight: 19,
  },
  linkList: { gap: 8 },
  link: {
    fontSize:      13,
    fontWeight:    '600',
    textDecorationLine: 'underline',
  },
  muted: { fontSize: 12 },
  divider: {
    height:       1,
    marginVertical: 2,
  },
  legalHeading: {
    fontSize:   13,
    fontWeight: '700',
  },
  legal: {
    fontSize:   12,
    lineHeight: 17,
  },
});
