/**
 * useMorsePlayer — sole AudioContext owner for the mobile app.
 * Uses react-native-audio-api (mirrors Web Audio API interface).
 * configureAudioSession() is called by the root layout BEFORE this runs.
 * Never use setTimeout for morse timing — scheduleText handles the audio clock.
 */
import { useRef, useCallback, useEffect } from 'react';
import { AudioContext } from 'react-native-audio-api';
import { scheduleText, scheduleTestTone } from '@morsebrowser/core';
import type { ScheduleOptions } from '@morsebrowser/core';
import type { MorseTimingConfig } from '@morsebrowser/types';

export function useMorsePlayer(config: MorseTimingConfig) {
  const ctxRef    = useRef<InstanceType<typeof AudioContext> | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const getCtx = useCallback((): InstanceType<typeof AudioContext> => {
    if (!ctxRef.current || (ctxRef.current as any).state === 'closed') {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const stopMorse = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    stopMorse();
  }, [stopMorse]);

  const play = useCallback((
    text: string,
    opts?: ScheduleOptions | (() => void),
  ) => {
    stopMorse();
    const options = typeof opts === 'function' ? { onComplete: opts } : (opts ?? {});
    const session = scheduleText(getCtx() as any, text, config, options);
    cancelRef.current = session.cancel;
  }, [config, getCtx, stopMorse]);

  const playTestTone = useCallback((onComplete?: () => void) => {
    stopMorse();
    const session = scheduleTestTone(getCtx() as any, config, 10, { onComplete });
    cancelRef.current = session.cancel;
  }, [config, getCtx, stopMorse]);

  useEffect(() => () => {
    stopAll();
    try { ctxRef.current?.close?.(); } catch {}
  }, [stopAll]);

  return { play, stopMorse, stopAll, playTestTone, getCtx };
}
