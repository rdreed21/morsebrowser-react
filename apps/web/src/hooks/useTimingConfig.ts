import { useMemo } from 'react';
import { getApplicableSpeed } from '@morsebrowser/core';
import type { MorseSettings } from '@morsebrowser/types';
import { useMorseApp } from '../context/MorseAppContext';
import { usePlaybackState } from '../context/PlaybackStateContext';

/**
 * Timing config with the KO speed-interval adjustment applied while playing.
 * Lives outside MorseAppContext because it reads runningPlayMs (which updates
 * every playback tick); the gate below keeps the returned object's identity
 * stable whenever interval mode is off.
 */
export function useIntervalTimingConfig(): MorseSettings['timing'] {
  const {
    timingConfig, settings, speedInterval,
    intervalTimingsText, intervalWpmText, intervalFwpmText,
  } = useMorseApp();
  const { isPlaying, runningPlayMs } = usePlaybackState();

  const intervalActive = isPlaying && speedInterval && intervalTimingsText.trim().length > 0;
  const msForIntervals = intervalActive ? runningPlayMs : -1;

  return useMemo(() => {
    if (msForIntervals < 0) return timingConfig;
    const speeds = getApplicableSpeed(msForIntervals, {
      charWPM: settings.timing.charWPM,
      effectiveWPM: settings.timing.effectiveWPM,
      speedInterval,
      intervalTimingsText,
      intervalWpmText,
      intervalFwpmText,
    });
    return { ...timingConfig, charWPM: speeds.charWPM, effectiveWPM: speeds.effectiveWPM };
  }, [
    timingConfig, msForIntervals, settings.timing, speedInterval,
    intervalTimingsText, intervalWpmText, intervalFwpmText,
  ]);
}
