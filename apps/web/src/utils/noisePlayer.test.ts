import { describe, it, expect } from 'vitest';
import { NoisePlayer } from './noisePlayer';

describe('NoisePlayer', () => {
  it('starts and stops white noise on the shared context', () => {
    const ctx = {
      sampleRate: 44100,
      currentTime: 0,
      destination: { connect: () => {} },
      createBuffer: (ch: number, len: number, rate: number) => ({
        numberOfChannels: ch,
        length: len,
        sampleRate: rate,
        getChannelData: () => new Float32Array(len),
      }),
      createGain: () => ({
        gain: { setValueAtTime: () => {} },
        connect: () => {},
      }),
      createBufferSource: () => ({
        buffer: null as AudioBuffer | null,
        loop: false,
        connect: () => {},
        start: () => {},
        stop: () => {},
      }),
    } as unknown as AudioContext;

    const player = new NoisePlayer();
    player.sync(ctx, 'white', 5);
    expect(player.isPlaying()).toBe(true);
    player.stop();
    expect(player.isPlaying()).toBe(false);
  });
});
