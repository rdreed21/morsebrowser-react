import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsSection } from '../src/components/SettingsSection';
import { ToneSettingsSection } from '../src/components/ToneSettingsSection';
import { VoiceOptionsSection } from '../src/components/VoiceOptionsSection';
import { InputOptionsSection } from '../src/components/InputOptionsSection';
import { OutputOptionsSection } from '../src/components/OutputOptionsSection';
import { AboutSection } from '../src/components/AboutSection';
import { useTheme } from '../src/utils/theme';

export default function SettingsScreen() {
  const t = useTheme();

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: t.bg }]} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerStyle: { backgroundColor: t.headerBg },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <ScrollView
        style={[s.scrollArea, { backgroundColor: t.bg }]}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <SettingsSection title="Tone Options" defaultOpen>
          <ToneSettingsSection />
        </SettingsSection>

        <SettingsSection title="Voice Options">
          <VoiceOptionsSection />
        </SettingsSection>

        <SettingsSection title="Input / Practice Text">
          <InputOptionsSection />
        </SettingsSection>

        <SettingsSection title="Output Options">
          <OutputOptionsSection />
        </SettingsSection>

        <SettingsSection title="About & Acknowledgments">
          <AboutSection />
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: {
    padding:       12,
    paddingBottom: 24,
    gap:           8,
  },
});
