import React, { createContext, useContext } from 'react';
import { useMorsePlayer } from '../hooks/useMorsePlayer';
import { useMorseApp } from './MorseAppContext';

type MorseAudioContextValue = ReturnType<typeof useMorsePlayer>;

const MorseAudioContext = createContext<MorseAudioContextValue | null>(null);

export function MorseAudioProvider({ children }: { children: React.ReactNode }) {
  const { timingConfig } = useMorseApp();
  const player = useMorsePlayer(timingConfig);
  return (
    <MorseAudioContext.Provider value={player}>
      {children}
    </MorseAudioContext.Provider>
  );
}

export function useMorseAudio(): MorseAudioContextValue {
  const ctx = useContext(MorseAudioContext);
  if (!ctx) throw new Error('useMorseAudio must be used within MorseAudioProvider');
  return ctx;
}
