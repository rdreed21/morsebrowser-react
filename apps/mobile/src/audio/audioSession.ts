/**
 * audioSession.ts — iOS background audio setup
 * Call configureAudioSession() on app mount BEFORE any AudioContext.
 * app.json already has UIBackgroundModes:audio — do not remove it.
 */
import { Platform } from 'react-native';

export async function configureAudioSession(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      playsInSilentMode:    true,
      shouldPlayInBackground: true,
      interruptionMode:     'doNotMix',
      allowsRecording:      false,
      shouldRouteThroughEarpiece: false,
    });
    console.log('[Audio] iOS session ready — background OK');
  } catch (err) {
    console.error('[Audio] Session config failed:', err);
  }
}
