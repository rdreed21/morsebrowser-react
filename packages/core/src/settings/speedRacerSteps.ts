export const SPEED_RACER_MIN_WPM = 1;
export const SPEED_RACER_DEFAULT_STEP_DELTA = 5;
export const SPEED_RACER_DEFAULT_STEP_COUNT = 3;

export type SpeedRacerDirection = 'down' | 'up';

export interface SpeedRacerStepDefaultsOptions {
  baseWpm: number;
  count?: number;
  delta?: number;
  direction?: SpeedRacerDirection;
  minWpm?: number;
}

export function normalizeSpeedRacerStep(value: number, minWpm = SPEED_RACER_MIN_WPM): number {
  if (!Number.isFinite(value)) return minWpm;
  return Math.max(minWpm, Math.round(value));
}

export function createSpeedRacerStepDefaults({
  baseWpm,
  count = SPEED_RACER_DEFAULT_STEP_COUNT,
  delta = SPEED_RACER_DEFAULT_STEP_DELTA,
  direction = 'down',
  minWpm = SPEED_RACER_MIN_WPM,
}: SpeedRacerStepDefaultsOptions): number[] {
  const safeCount = Math.max(1, Math.floor(count));
  const safeDelta = Math.max(1, Math.round(delta));
  const start = normalizeSpeedRacerStep(baseWpm, minWpm);
  const sign = direction === 'up' ? 1 : -1;

  return Array.from({ length: safeCount }, (_, index) => (
    normalizeSpeedRacerStep(start + (sign * safeDelta * index), minWpm)
  ));
}

export function addSpeedRacerStep(
  steps: number[],
  direction: SpeedRacerDirection = 'down',
  delta = SPEED_RACER_DEFAULT_STEP_DELTA,
  minWpm = SPEED_RACER_MIN_WPM,
): number[] {
  const safeDelta = Math.max(1, Math.round(delta));
  const normalized = steps.length > 0
    ? steps.map(step => normalizeSpeedRacerStep(step, minWpm))
    : createSpeedRacerStepDefaults({ baseWpm: minWpm, count: 1, minWpm });
  const previous = normalized[normalized.length - 1] ?? minWpm;
  const sign = direction === 'up' ? 1 : -1;
  return [...normalized, normalizeSpeedRacerStep(previous + (sign * safeDelta), minWpm)];
}

export function removeSpeedRacerStep(steps: number[], minCount = SPEED_RACER_DEFAULT_STEP_COUNT): number[] {
  const safeMinCount = Math.max(1, Math.floor(minCount));
  if (steps.length <= safeMinCount) return steps.slice();
  return steps.slice(0, -1);
}
