import { describe, expect, it } from 'vitest';
import {
  computePlayEndedActions,
  isVoiceBufferFull,
  shouldRestartLoop,
} from './playbackOrchestration';

describe('isVoiceBufferFull', () => {
  it('is always full when buffer max length is 1', () => {
    expect(isVoiceBufferFull(1, 0, 5, 0)).toBe(true);
  });

  it('is full on the last word', () => {
    expect(isVoiceBufferFull(3, 4, 5, 1)).toBe(true);
  });

  it('waits until buffer length reaches max', () => {
    expect(isVoiceBufferFull(3, 1, 5, 2)).toBe(false);
    expect(isVoiceBufferFull(3, 1, 5, 3)).toBe(true);
  });
});

describe('computePlayEndedActions', () => {
  it('queues voice when buffer is full and morse chunk ended', () => {
    const actions = computePlayEndedActions({
      voiceEnabled: true,
      manualVoice: false,
      fromVoiceOrTrail: false,
      hasMoreMorse: false,
      maxBufferReached: true,
      speakFirst: false,
      trailReveal: false,
    });
    expect(actions.needToSpeak).toBe(true);
    expect(actions.noDelays).toBe(false);
  });

  it('skips voice during trail/voice callback chain', () => {
    const actions = computePlayEndedActions({
      voiceEnabled: true,
      manualVoice: false,
      fromVoiceOrTrail: true,
      hasMoreMorse: false,
      maxBufferReached: true,
      speakFirst: false,
      trailReveal: true,
    });
    expect(actions.needToSpeak).toBe(false);
    expect(actions.needToTrail).toBe(false);
    expect(actions.noDelays).toBe(true);
  });

  it('reveals trail without voice when only trail is enabled', () => {
    const actions = computePlayEndedActions({
      voiceEnabled: false,
      manualVoice: false,
      fromVoiceOrTrail: false,
      hasMoreMorse: false,
      maxBufferReached: false,
      speakFirst: false,
      trailReveal: true,
    });
    expect(actions.needToTrail).toBe(true);
    expect(actions.speakAndTrail).toBe(false);
  });
});

describe('shouldRestartLoop', () => {
  it('skips loop restart when seeking mid-playback', () => {
    expect(shouldRestartLoop(true, false, false, true)).toBe(false);
  });

  it('still restarts loop when a card finishes naturally', () => {
    expect(shouldRestartLoop(true, false, false, false)).toBe(true);
  });

  it('does not restart after stop or pause', () => {
    expect(shouldRestartLoop(true, true, false)).toBe(false);
    expect(shouldRestartLoop(true, false, true)).toBe(false);
  });
});
