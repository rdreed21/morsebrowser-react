import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemedStatusBar } from '../src/components/ThemedStatusBar';
import { configureAudioSession } from '../src/audio/audioSession';
import {
  ensurePresetsCached, ensureWordfilesCached, installPresetFetchFallback,
} from '../src/utils/loadMobileLessonFile';
import { MorseAppProvider } from '../src/context/MorseAppContext';
import { MorseAudioProvider } from '../src/context/MorseAudioContext';
import { MorsePlaybackProvider } from '../src/context/MorsePlaybackContext';

export default function RootLayout() {
  useEffect(() => {
    // Must be the very first audio operation — before any AudioContext is created.
    configureAudioSession();
    installPresetFetchFallback();
    void ensureWordfilesCached();
    void ensurePresetsCached();
  }, []);

  return (
    <SafeAreaProvider>
      <MorseAppProvider>
        <MorseAudioProvider>
          <MorsePlaybackProvider>
            <ThemedStatusBar />
            <Stack screenOptions={{ headerShown: false }} />
          </MorsePlaybackProvider>
        </MorseAudioProvider>
      </MorseAppProvider>
    </SafeAreaProvider>
  );
}
