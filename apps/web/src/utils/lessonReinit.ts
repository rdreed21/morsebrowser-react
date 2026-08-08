/**
 * Club-parity deferred lesson reinit after preset apply.
 * While playing or paused, reload is deferred until terminal Stop.
 */

type ReinitFn = () => void;
type ActiveFn = () => boolean;

let reinitHandler: ReinitFn | null = null;
let isPlaybackActive: ActiveFn = () => false;
let timerHandle: ReturnType<typeof setTimeout> | null = null;
let deferred = false;

export function setLessonReinitHandler(fn: ReinitFn | null): void {
  reinitHandler = fn;
}

export function setLessonReinitActiveChecker(fn: ActiveFn): void {
  isPlaybackActive = fn;
}

export function scheduleLessonReinit(delayMs = 1000): void {
  if (timerHandle) clearTimeout(timerHandle);
  timerHandle = setTimeout(() => {
    timerHandle = null;
    if (isPlaybackActive()) {
      deferred = true;
      return;
    }
    reinitHandler?.();
  }, delayMs);
}

/** Play started before the 1s timer fired — keep the reload for terminal stop. */
export function cancelPendingLessonReinit(): void {
  if (!timerHandle) return;
  clearTimeout(timerHandle);
  timerHandle = null;
  deferred = true;
}

/** User took over practice text (Clear / Load Flagged / file insert). */
export function abortPendingLessonReinit(): void {
  if (timerHandle) {
    clearTimeout(timerHandle);
    timerHandle = null;
  }
  deferred = false;
}

export function runDeferredLessonReinitIfPending(): void {
  if (!deferred) return;
  deferred = false;
  reinitHandler?.();
}

/** Test helper */
export function resetLessonReinitStateForTests(): void {
  abortPendingLessonReinit();
  reinitHandler = null;
  isPlaybackActive = () => false;
}
