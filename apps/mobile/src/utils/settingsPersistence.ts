import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SerializedSetting } from '@morsebrowser/core';

const STORAGE_KEY = '@morsebrowser/mobileSettings/v1';

/**
 * Mobile-only fields the shared `MorseSettingsSnapshot` (core preset/export mechanism)
 * doesn't cover, but that matter for restart-to-restart continuity. Persisted alongside
 * the snapshot as a flat key/value map and restored with direct setter calls.
 */
export interface PersistedExtras {
  ditFrequency?: number;
  dahFrequency?: number;
  syncFreq?: boolean;
  preSpace?: number;
  cardFontPx?: number;
  cardsVisible?: boolean;
  trailReveal?: boolean;
  trailPreDelay?: number;
  trailPostDelay?: number;
  trailFinal?: number;
  maxRevealedTrail?: number;
  flaggedWords?: string;
}

interface PersistedSettingsFile {
  snapshot: SerializedSetting[];
  extras: PersistedExtras;
}

export async function loadPersistedSettings(): Promise<PersistedSettingsFile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSettingsFile;
    if (!parsed || !Array.isArray(parsed.snapshot)) return null;
    return { snapshot: parsed.snapshot, extras: parsed.extras ?? {} };
  } catch {
    return null;
  }
}

export async function savePersistedSettings(
  snapshot: SerializedSetting[],
  extras: PersistedExtras,
): Promise<void> {
  const payload: PersistedSettingsFile = { snapshot, extras };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
