import { scheduleText } from '../audio/morseScheduler';
import { DEFAULT_TIMING } from '../audio/timingEngine';

function mockContext(captureFrequency?: (hz: number) => void) {
  return {
    currentTime: 0,
    destination: { connect: () => {} },
    createOscillator: () => {
      const store = { hz: 500 };
      return {
        type: 'sine' as OscillatorType,
        frequency: {
          get value() {
            return store.hz;
          },
          set value(hz: number) {
            store.hz = hz;
            captureFrequency?.(hz);
          },
        },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
    },
    createGain: () => ({
      gain: {
        value: 1,
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
    }),
  };
}

describe('scheduleText trailing spacing', () => {
  it('includes Farnsworth word space after each chunk by default', () => {
    const ctx = mockContext() as unknown as Parameters<typeof scheduleText>[0];
    const withTrail = scheduleText(ctx, 'A', DEFAULT_TIMING, {
      startDelay: 0,
      trimLastWordSpace: false,
    });
    const withoutTrail = scheduleText(ctx, 'A', DEFAULT_TIMING, {
      startDelay: 0,
      trimLastWordSpace: true,
    });
    expect(withTrail.durationSeconds).toBeGreaterThan(withoutTrail.durationSeconds);
  });

  it('uses separate dit and dah frequencies when configured', () => {
    const frequencies: number[] = [];
    const ctx = mockContext(hz => frequencies.push(hz)) as unknown as Parameters<typeof scheduleText>[0];
    scheduleText(ctx, 'A', {
      ...DEFAULT_TIMING,
      frequency: 500,
      ditFrequency: 600,
      dahFrequency: 400,
    }, { startDelay: 0, trimLastWordSpace: true });
    expect(frequencies).toContain(600);
    expect(frequencies).toContain(400);
  });
});
