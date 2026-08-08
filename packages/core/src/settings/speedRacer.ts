/**
 * Club Speed Racer model — multiplier ladder over main character WPM.
 * Ported from LongIslandCW/morsebrowser `speedSettings.ts`.
 */

export const SPEED_RACER_DEFAULT_MULTIPLIERS = '1.5, 1.35, 1.175, 1.0';
export const SPEED_RACER_OVERLEARN_MULTIPLIERS = '1.348, 1.174, 1.0';
/** When Repeat Spacing is 0 under SR, club inserts one wordspace between plays. */
export const RACER_DEFAULT_REPEAT_SPACING = 1;

export interface RacerApplicableSpeed {
  wpm: number;
  fwpm: number;
}

/** Parse multiplier list. Drops non-finite / zero / negatives; preserves order. */
export function parseMultipliers(s: string): number[] {
  if (!s) return [];
  return s.split(',')
    .map(x => parseFloat(x))
    .filter(n => Number.isFinite(n) && n > 0);
}

/** Format multipliers for storage / UI (comma + space). */
export function formatMultipliers(mults: number[]): string {
  return mults.map(m => String(m)).join(', ');
}

export function getRacerTotalPlays(multipliers: string, finalPlay: boolean): number {
  const n = parseMultipliers(multipliers).length;
  if (n <= 0) return 0;
  return finalPlay ? n + 1 : n;
}

export function isSpeedRacerActive(enabled: boolean, totalPlays: number): boolean {
  return enabled && totalPlays >= 1;
}

export function isRacerFinalPlay(
  playIndex: number,
  multipliers: string,
  finalPlay: boolean,
): boolean {
  if (!finalPlay) return false;
  const total = getRacerTotalPlays(multipliers, finalPlay);
  return total > 1 && playIndex === total - 1;
}

export function isRacerSpeakBeforeFinalReplay(
  playIndex: number,
  multipliers: string,
  finalPlay: boolean,
): boolean {
  return finalPlay && isRacerFinalPlay(playIndex, multipliers, finalPlay);
}

export function isRacerSpeakAfterLastVariation(
  playIndex: number,
  multipliers: string,
  finalPlay: boolean,
): boolean {
  if (finalPlay) return false;
  const mults = parseMultipliers(multipliers);
  if (mults.length === 0) return false;
  return playIndex === mults.length - 1;
}

/**
 * Apply Speed Racer to a base speed for the given play slot.
 * Variation (0..N-1) uses round(base.wpm * multipliers[playIndex]).
 * Final play (N) uses round(base.wpm * multipliers[0]) — first multiplier.
 * FWPM stays at saved base when faster; scales down when slower than base FWPM.
 */
export function applySpeedRacer(
  base: RacerApplicableSpeed,
  playIndex: number,
  multipliers: string,
  enabled = true,
): RacerApplicableSpeed {
  if (!enabled || playIndex < 0) return base;
  const mults = parseMultipliers(multipliers);
  if (mults.length === 0) return base;
  const isFinal = playIndex >= mults.length;
  const multiplier = isFinal ? mults[0] : mults[playIndex];
  const variationWpm = Math.max(1, Math.round(base.wpm * multiplier));
  const variationFwpm = Math.min(base.fwpm, variationWpm);
  return { wpm: variationWpm, fwpm: variationFwpm };
}

/** Live Sequence preview, e.g. `30 → 27 → 24 → 20 → speak → 30 wpm`. */
export function buildSpeedRacerPreview(
  baseWpm: number,
  multipliers: string,
  finalPlay: boolean,
  speakBeforeReplay: boolean,
): string {
  const target = Math.round(baseWpm || 0);
  const mults = parseMultipliers(multipliers);
  if (mults.length === 0 || target <= 0) return '';
  const wpms = mults.map(m => Math.max(1, Math.round(target * m)));
  const speakStep = speakBeforeReplay ? ' → speak' : '';
  if (!finalPlay) {
    return wpms.join(' → ') + speakStep + (speakStep ? '' : ' wpm');
  }
  return wpms.join(' → ') + `${speakStep} → ${wpms[0]} wpm`;
}

export function speedRacerSpeakLabel(finalPlay: boolean): string {
  return finalPlay ? 'Speak Before Replay' : 'Speak';
}

/** Pad after last variation so TTS does not overlap the slow morse tail. */
export function getSpeedRacerPreSpeakPadMs(baseWpm: number, multipliers: string): number {
  const mults = parseMultipliers(multipliers);
  if (mults.length === 0) return 0;
  const safeBase = Math.max(1, Math.round(baseWpm || 0));
  const lastWpm = Math.max(1, Math.round(safeBase * mults[mults.length - 1]));
  const ditMs = 60000 / (50 * lastWpm);
  return Math.max(350, Math.round(ditMs * 7));
}

/** Inter-repeat delay at a given variation WPM (7 dits × wordspaces). */
export function getSpeedRacerReplayDelayMs(charWpm: number, wordSpaces: number): number {
  const ditSeconds = 1.2 / Math.max(1, charWpm);
  const spaces = Math.max(1, wordSpaces);
  return spaces * 7 * ditSeconds * 1000;
}

/**
 * Convert absolute WPM steps (legacy React model) into multipliers of baseWpm.
 * Used once when migrating old cookies / snapshots.
 */
export function wpmStepsToMultipliers(steps: number[], baseWpm: number): string {
  const base = Math.max(1, Math.round(baseWpm || 0));
  const mults = steps
    .map(s => Math.round(s))
    .filter(s => Number.isFinite(s) && s > 0)
    .map(s => Math.round((s / base) * 1000) / 1000);
  return mults.length > 0 ? formatMultipliers(mults) : SPEED_RACER_DEFAULT_MULTIPLIERS;
}
