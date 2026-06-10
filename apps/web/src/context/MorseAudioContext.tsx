import React, { createContext, useContext } from 'react';
import { useMorseApp } from './MorseAppContext';
import { useIntervalTimingConfig } from '../hooks/useTimingConfig';
import { useMorsePlayer } from '../hooks/useMorsePlayer';

export type MorseAudioSession = ReturnType<typeof useMorsePlayer>;

const MorseAudioContext = createContext<MorseAudioSession | null>(null);

/** Single shared AudioContext for practice playback and Zero Beat test tone. */
export function MorseAudioProvider({ children }: { children: React.ReactNode }) {
  const { noiseType, noiseVolume } = useMorseApp();
  const timingConfig = useIntervalTimingConfig();
  const session = useMorsePlayer(timingConfig, { type: noiseType, volume: noiseVolume });
  return (
    <MorseAudioContext.Provider value={session}>
      {children}
    </MorseAudioContext.Provider>
  );
}

export function useMorseAudio(): MorseAudioSession {
  const ctx = useContext(MorseAudioContext);
  if (!ctx) throw new Error('useMorseAudio must be used within MorseAudioProvider');
  return ctx;
}
