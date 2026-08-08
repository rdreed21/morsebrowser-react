/**
 * audioSession.ts — background audio setup (iOS + Android)
 * Call configureAudioSession() on app mount BEFORE any AudioContext.
 * iOS: app.json UIBackgroundModes:audio
 * Android: react-native-audio-api config plugin registers a mediaPlayback
 * foreground service (see AndroidManifest).
 */
import { Platform } from 'react-native';

export async function configureAudioSession(): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  try {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    });
    console.log(`[Audio] ${Platform.OS} session ready — background OK`);
  } catch (err) {
    console.error('[Audio] Session config failed:', err);
  }
}
