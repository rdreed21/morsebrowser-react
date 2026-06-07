import React, { createContext, useContext } from 'react';
import { useMorsePlayback, type MorsePlaybackHandlers } from '../hooks/useMorsePlayback';

const MorsePlaybackContext = createContext<MorsePlaybackHandlers | null>(null);

/**
 * Hosts the single shared `useMorsePlayback()` instance. Components must consume
 * playback via `useMorsePlaybackControls()` rather than calling the hook directly —
 * multiple instances would each run their own timers/voice buffers and desync.
 */
export function MorsePlaybackProvider({ children }: { children: React.ReactNode }) {
  const playback = useMorsePlayback();
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
