import React from 'react';
import {
  ScrollView, View, Text, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMorseApp } from '../src/context/MorseAppContext';
import { SpeedSettingsBar } from '../src/components/SpeedSettingsBar';
import { PlaybackControls } from '../src/components/PlaybackControls';
import { WordCards } from '../src/components/WordCards';
import { LessonsPicker } from '../src/components/LessonsPicker';
import { LessonOptionsSection } from '../src/components/LessonOptionsSection';
import { WorkingTextStats } from '../src/components/WorkingTextStats';
import { SettingsSection } from '../src/components/SettingsSection';
import { ToneSettingsSection } from '../src/components/ToneSettingsSection';
import { InputOptionsSection } from '../src/components/InputOptionsSection';
import { OutputOptionsSection } from '../src/components/OutputOptionsSection';
import { VoiceOptionsSection } from '../src/components/VoiceOptionsSection';
import { useTheme } from '../src/utils/theme';

export default function HomeScreen() {
  const app = useMorseApp();
  const t = useTheme();

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[s.header, { backgroundColor: t.headerBg }]}>
          <Text style={s.title}>LICW Morsebrowser</Text>
          <TouchableOpacity
            style={s.themeBtn}
            onPress={app.toggleDarkMode}
            accessibilityLabel={app.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <Text style={s.themeBtnText}>{app.darkMode ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Speed settings always visible */}
        <SpeedSettingsBar />

        {/* Settings + stats scroll area */}
        <ScrollView
          style={[s.scrollArea, { backgroundColor: t.bg }]}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <SettingsSection
            title="LICW Lessons"
            badge={app.selectedDisplay?.display}
            defaultOpen
          >
            <LessonsPicker />
          </SettingsSection>

          <SettingsSection title="Lesson Options">
            <LessonOptionsSection />
          </SettingsSection>

          <SettingsSection title="Voice Options">
            <VoiceOptionsSection />
          </SettingsSection>

          <SettingsSection title="Tone Options">
            <ToneSettingsSection />
          </SettingsSection>

          <SettingsSection title="Input / Practice Text">
            <InputOptionsSection />
          </SettingsSection>

          <SettingsSection title="Output Options">
            <OutputOptionsSection />
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
  title: {
    color:      '#fff',
    fontSize:   18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  themeBtn: { padding: 6 },
  themeBtnText: { fontSize: 20 },
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
