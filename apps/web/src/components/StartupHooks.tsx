import { useStartupUrlParams } from '../hooks/useStartupUrlParams';

/** One-shot URL feature flags and wake lock (KO MorseViewModel ctor). */
export function StartupHooks() {
  useStartupUrlParams();
  return null;
}
