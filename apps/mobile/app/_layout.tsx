import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedStatusBar } from '../src/components/ThemedStatusBar';
import { configureAudioSession } from '../src/audio/audioSession';
import { ensureWordfilesCached } from '../src/utils/loadMobileLessonFile';
import { MorseAppProvider } from '../src/context/MorseAppContext';
import { MorseAudioProvider } from '../src/context/MorseAudioContext';

export default function RootLayout() {
  useEffect(() => {
    // Must be the very first audio operation — before any AudioContext is created.
    configureAudioSession();
    void ensureWordfilesCached();
  }, []);

  return (
    <SafeAreaProvider>
      <MorseAppProvider>
        <MorseAudioProvider>
          <ThemedStatusBar />
          <Stack screenOptions={{ headerShown: false }} />
        </MorseAudioProvider>
      </MorseAppProvider>
    </SafeAreaProvider>
  );
}
