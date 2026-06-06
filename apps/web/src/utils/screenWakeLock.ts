/** KO ScreenWakeLock — keep screen on when voice is active (mobile). */
export class ScreenWakeLock {
  private requested = false;
  private wakeLock: WakeLockSentinel | null = null;
  private readonly wakeLockAvailable: boolean;

  constructor() {
    this.wakeLockAvailable = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    if (this.wakeLockAvailable && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (this.requested && document.visibilityState === 'visible') {
          this.wakeLock = null;
          void this.activate();
        }
      });
    }
  }

  async activate(): Promise<void> {
    if (!this.wakeLockAvailable || this.wakeLock !== null) return;
    this.requested = true;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
    } catch {
      // Battery low or unsupported — ignore.
    }
  }

  deactivate(): void {
    this.requested = false;
    if (this.wakeLock) {
      void this.wakeLock.release().then(() => {
        this.wakeLock = null;
      });
    }
  }
}
