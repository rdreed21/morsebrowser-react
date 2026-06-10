import React, {
  createContext, useContext, useMemo, useState,
} from 'react';
import { formatPlayTime, type PlayTimeDisplay } from '../utils/formatTime';

/**
 * High-frequency playback runtime state, split out of MorseAppContext so
 * per-character updates during playback don't re-render every settings
 * consumer. Values and actions live in separate contexts: the actions
 * object is referentially stable forever, so action-only consumers
 * (including MorseAppProvider itself) never re-render on playback ticks.
 */
export interface PlaybackStateValues {
  currentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  runningPlayMs: number;
  charsPlayed: number;
  maxRevealedTrail: number;
  playingTime: PlayTimeDisplay;
}

export interface PlaybackStateActions {
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setRunningPlayMs: React.Dispatch<React.SetStateAction<number>>;
  setCharsPlayed: React.Dispatch<React.SetStateAction<number>>;
  setMaxRevealedTrail: React.Dispatch<React.SetStateAction<number>>;
}

export type PlaybackState = PlaybackStateValues & PlaybackStateActions;

const PlaybackValuesContext = createContext<PlaybackStateValues | null>(null);
const PlaybackActionsContext = createContext<PlaybackStateActions | null>(null);

export function PlaybackStateProvider({ children }: { children: React.ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runningPlayMs, setRunningPlayMs] = useState(0);
  const [charsPlayed, setCharsPlayed] = useState(0);
  const [maxRevealedTrail, setMaxRevealedTrail] = useState(-1);

  const playingTime = useMemo(() => formatPlayTime(runningPlayMs), [runningPlayMs]);

  const values = useMemo<PlaybackStateValues>(() => ({
    currentIndex,
    isPlaying,
    isPaused,
    runningPlayMs,
    charsPlayed,
    maxRevealedTrail,
    playingTime,
  }), [currentIndex, isPlaying, isPaused, runningPlayMs, charsPlayed, maxRevealedTrail, playingTime]);

  const actions = useMemo<PlaybackStateActions>(() => ({
    setCurrentIndex,
    setIsPlaying,
    setIsPaused,
    setRunningPlayMs,
    setCharsPlayed,
    setMaxRevealedTrail,
  }), []);

  return (
    <PlaybackActionsContext.Provider value={actions}>
      <PlaybackValuesContext.Provider value={values}>
        {children}
      </PlaybackValuesContext.Provider>
    </PlaybackActionsContext.Provider>
  );
}

/** Setters only — stable identity, never causes a re-render. */
export function usePlaybackActions(): PlaybackStateActions {
  const ctx = useContext(PlaybackActionsContext);
  if (!ctx) throw new Error('usePlaybackActions must be used within PlaybackStateProvider');
  return ctx;
}

/** Values + actions — re-renders the consumer on every playback tick. */
export function usePlaybackState(): PlaybackState {
  const values = useContext(PlaybackValuesContext);
  const actions = useContext(PlaybackActionsContext);
  const merged = useMemo(
    () => (values && actions ? { ...values, ...actions } : null),
    [values, actions],
  );
  if (!merged) {
    throw new Error('usePlaybackState must be used within PlaybackStateProvider');
  }
  return merged;
}
