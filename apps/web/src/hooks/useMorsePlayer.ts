import { useRef, useCallback, useEffect } from 'react';
import { scheduleText, scheduleTestTone } from '@morsebrowser/core';
import type { ScheduleOptions } from '@morsebrowser/core';
import type { MorseTimingConfig } from '@morsebrowser/types';
import { NoisePlayer, type NoiseType } from '../utils/noisePlayer';

export interface NoiseSettings {
  type: NoiseType;
  volume: number;
}

/**
 * Single place that owns AudioContext — all playback goes through scheduleText.
 */
export function useMorsePlayer(config: MorseTimingConfig, noise: NoiseSettings) {
  const ctxRef = useRef<AudioContext | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  const noisePlayerRef = useRef(new NoisePlayer());
  const noiseRef = useRef(noise);
  noiseRef.current = noise;

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const ensureNoise = useCallback(() => {
    const { type, volume } = noiseRef.current;
    noisePlayerRef.current.sync(getCtx(), type, volume);
  }, [getCtx]);

  const stopMorse = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    stopMorse();
    noisePlayerRef.current.stop();
  }, [stopMorse]);

  const play = useCallback((
    text: string,
    opts?: ScheduleOptions | (() => void),
  ) => {
    stopMorse();
    const options = typeof opts === 'function' ? { onComplete: opts } : (opts ?? {});
    const session = scheduleText(getCtx(), text, config, options);
    cancelRef.current = session.cancel;
  }, [config, getCtx, stopMorse]);

  const playTestTone = useCallback((onComplete?: () => void) => {
    stopMorse();
    const session = scheduleTestTone(getCtx(), config, 10, { onComplete });
    cancelRef.current = session.cancel;
  }, [config, getCtx, stopMorse]);

  useEffect(() => {
    if (!noisePlayerRef.current.isPlaying()) return;
    const { type, volume } = noise;
    noisePlayerRef.current.sync(getCtx(), type, volume);
  }, [noise.type, noise.volume, getCtx]);

  useEffect(() => () => {
    stopAll();
    void ctxRef.current?.close();
  }, [stopAll]);

  return { play, stopMorse, stopAll, playTestTone, ensureNoise, getCtx };
}
