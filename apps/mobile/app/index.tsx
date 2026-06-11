import React from 'react';
import {
  ScrollView, View, Text, Image, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMorseApp } from '../src/context/MorseAppContext';
import { SpeedSettingsBar } from '../src/components/SpeedSettingsBar';
import { PlaybackControls } from '../src/components/PlaybackControls';
import { WordCards } from '../src/components/WordCards';
import { LessonsPicker } from '../src/components/LessonsPicker';
import { LessonOptionsSection } from '../src/components/LessonOptionsSection';
import { WorkingTextStats } from '../src/components/WorkingTextStats';
import { SettingsSection } from '../src/components/SettingsSection';
import { useTheme } from '../src/utils/theme';

export default function HomeScreen() {
  const app = useMorseApp();
  const t = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[s.header, { backgroundColor: t.headerBg }]}>
          <View style={s.titleGroup}>
            <Image
              source={require('../assets/images/licw-logo.png')}
              style={s.logo}
              accessibilityLabel="LICW club logo"
            />
            <Text style={s.title}>LICW Morsebrowser</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.headerBtn}
              onPress={app.toggleDarkMode}
              accessibilityLabel={app.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Text style={s.headerBtnText}>{app.darkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Open settings"
            >
              <Text style={s.headerBtnText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Speed settings always visible */}
        <SpeedSettingsBar />

        {/* Lessons + lesson options + stats scroll area */}
        <ScrollView
          style={[s.scrollArea, { backgroundColor: t.bg }]}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <SettingsSection
            title="LICW Lessons"
            badge={app.selectedDisplay?.display}
            defaultOpen
            collapseWhen={app.isPlaying}
            collapseSignal={app.lessonAccordionCloseSignal}
          >
            <LessonsPicker />
          </SettingsSection>

          <SettingsSection title="Lesson Options" collapseWhen={app.isPlaying}>
            <LessonOptionsSection />
          </SettingsSection>

          <WorkingTextStats />
        </ScrollView>

        {/* Word cards — visible practice cards with reveal/hide toggle in playback bar */}
        {app.cardsVisible && app.words.length > 0 && (
          <View style={[s.cardsWrapper, { backgroundColor: t.bg, borderTopColor: t.border }]}>
            <WordCards />
          </View>
        )}

        {/* Playback controls always visible at bottom */}
        <PlaybackControls />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexShrink:    1,
  },
  logo: {
    width:        30,
    height:       30,
    borderRadius: 15,
    backgroundColor: '#fff',
  },
  title: {
    color:      '#fff',
    fontSize:   18,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  headerBtn: {
    padding:        8,
    minWidth:       44,
    minHeight:      44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  headerBtnText: { fontSize: 20 },
  scrollArea: { flex: 1 },
  scrollContent: {
    padding:       12,
    paddingBottom: 8,
    gap:           8,
  },
  cardsWrapper: {
    height:         148,
    flexShrink:     0,
    borderTopWidth: 1,
  },
});
