import { describe, it, expect } from 'vitest';

/** Mirrors KO morse.ts getMorseStringToWavBufferConfig trim rules. */
function shouldTrimLastWordSpace(
  voiceEnabled: boolean,
  manualVoice: boolean,
  maxBufferReached: boolean,
  hasMoreMorse: boolean,
): boolean {
  return voiceEnabled && !manualVoice && maxBufferReached && !hasMoreMorse;
}

describe('shouldTrimLastWordSpace', () => {
  it('keeps word space for BC1_Default manual voice recap preset', () => {
    expect(shouldTrimLastWordSpace(true, true, true, false)).toBe(false);
  });

  it('trims word space when auto voice will speak after the card', () => {
    expect(shouldTrimLastWordSpace(true, false, true, false)).toBe(true);
  });

  it('keeps word space while buffering multiple cards for voice', () => {
    expect(shouldTrimLastWordSpace(true, false, false, false)).toBe(false);
  });
});
