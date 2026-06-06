import React, { createContext, useContext } from 'react';
import { useMorsePlayback, type MorsePlaybackHandlers } from '../hooks/useMorsePlayback';
import { useMorseShortcutKeys } from '../hooks/useMorseShortcutKeys';

const MorsePlaybackContext = createContext<MorsePlaybackHandlers | null>(null);

export function MorsePlaybackProvider({ children }: { children: React.ReactNode }) {
  const playback = useMorsePlayback();
  useMorseShortcutKeys(playback);
  return (
    <MorsePlaybackContext.Provider value={playback}>
      {children}
    </MorsePlaybackContext.Provider>
  );
}

export function useMorsePlaybackControls(): MorsePlaybackHandlers {
  const ctx = useContext(MorsePlaybackContext);
  if (!ctx) throw new Error('useMorsePlaybackControls must be used within MorsePlaybackProvider');
  return ctx;
}
