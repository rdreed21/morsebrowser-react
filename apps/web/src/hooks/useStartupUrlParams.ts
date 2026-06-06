import { useEffect, useRef } from 'react';
import { useMorseApp } from '../context/MorseAppContext';
import { getUrlParam } from '../utils/urlParams';
import { ScreenWakeLock } from '../utils/screenWakeLock';

const wakeLockRef = { current: null as ScreenWakeLock | null };

function getWakeLock(): ScreenWakeLock {
  if (!wakeLockRef.current) {
    wakeLockRef.current = new ScreenWakeLock();
  }
  return wakeLockRef.current;
}

/** KO MorseViewModel ctor query-param feature flags. */
export function useStartupUrlParams() {
  const {
    setVoiceEnabled, setVoiceBufferMaxLength, setNoiseType, noiseType, voiceEnabled,
  } = useMorseApp();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    appliedRef.current = true;

    if (getUrlParam('voiceEnabled')) {
      setVoiceEnabled(true);
    }

    const voiceBufferMax = getUrlParam('voiceBufferMax');
    if (voiceBufferMax) {
      const parsed = Number.parseInt(voiceBufferMax, 10);
      if (Number.isInteger(parsed) && parsed > 0) {
        setVoiceBufferMaxLength(parsed);
      }
    }

    const noiseEnabled = getUrlParam('noiseEnabled');
    if (noiseEnabled === 'true' && noiseType === 'off') {
      setNoiseType('white');
    }
  }, [setVoiceEnabled, setVoiceBufferMaxLength, setNoiseType, noiseType]);

  useEffect(() => {
    const lock = getWakeLock();
    if (voiceEnabled) {
      void lock.activate();
    } else {
      lock.deactivate();
    }
    return () => lock.deactivate();
  }, [voiceEnabled]);
}
