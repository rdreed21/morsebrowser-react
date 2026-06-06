import { describe, expect, it } from 'vitest';
import { shouldRestartLoop } from './playbackOrchestration';

describe('playback loop seek', () => {
  it('skips loop restart when seeking mid-playback', () => {
    expect(shouldRestartLoop(true, false, false, true)).toBe(false);
  });

  it('still restarts loop when a card finishes naturally', () => {
    expect(shouldRestartLoop(true, false, false, false)).toBe(true);
  });
});
