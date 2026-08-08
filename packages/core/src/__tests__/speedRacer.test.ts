import {
  applySpeedRacer,
  buildSpeedRacerPreview,
  getRacerTotalPlays,
  getSpeedRacerPreSpeakPadMs,
  isRacerFinalPlay,
  isRacerSpeakAfterLastVariation,
  isRacerSpeakBeforeFinalReplay,
  parseMultipliers,
  speedRacerSpeakLabel,
  SPEED_RACER_DEFAULT_MULTIPLIERS,
  SPEED_RACER_OVERLEARN_MULTIPLIERS,
} from '../settings/speedRacer';

describe('parseMultipliers', () => {
  it('returns [] for empty/blank input', () => {
    expect(parseMultipliers('')).toEqual([]);
    expect(parseMultipliers('   ')).toEqual([]);
  });

  it('parses a valid comma list and preserves order', () => {
    expect(parseMultipliers('1.5, 1.35, 1.175, 1.0'))
      .toEqual([1.5, 1.35, 1.175, 1.0]);
  });

  it('drops zero entries (skip-slot sentinel)', () => {
    expect(parseMultipliers('0, 1.5, 0, 1.0')).toEqual([1.5, 1.0]);
  });

  it('drops negative and non-numeric entries', () => {
    expect(parseMultipliers('-1, 2, abc, 1.5')).toEqual([2, 1.5]);
  });
});

describe('getRacerTotalPlays', () => {
  it('is variation count + 1 when Replay at First Multiplier is on', () => {
    expect(getRacerTotalPlays('1.5, 1.35, 1.175, 1.0', true)).toBe(5);
  });

  it('is the variation count when Replay is off', () => {
    expect(getRacerTotalPlays('1.5, 1.35, 1.175, 1.0', false)).toBe(4);
  });

  it('returns 1 for a single multiplier with replay off', () => {
    expect(getRacerTotalPlays('1.5', false)).toBe(1);
  });

  it('returns 0 when no non-zero multipliers exist', () => {
    expect(getRacerTotalPlays('0, 0', true)).toBe(0);
    expect(getRacerTotalPlays('', true)).toBe(0);
  });
});

describe('speak / final slots', () => {
  it('flags only the last play as final replay', () => {
    expect(isRacerFinalPlay(4, '1.5, 1.35, 1.175, 1.0', true)).toBe(true);
    expect(isRacerFinalPlay(3, '1.5, 1.35, 1.175, 1.0', true)).toBe(false);
    expect(isRacerFinalPlay(3, '1.5, 1.35, 1.175, 1.0', false)).toBe(false);
  });

  it('speak-before targets only the final replay index', () => {
    expect(isRacerSpeakBeforeFinalReplay(4, '1.5, 1.35, 1.175, 1.0', true)).toBe(true);
    expect(isRacerSpeakBeforeFinalReplay(3, '1.5, 1.35, 1.175, 1.0', true)).toBe(false);
  });

  it('speak-after targets the last variation when replay is off', () => {
    expect(isRacerSpeakAfterLastVariation(2, '1.348, 1.174, 1.0', false)).toBe(true);
    expect(isRacerSpeakAfterLastVariation(1, '1.348, 1.174, 1.0', false)).toBe(false);
    expect(isRacerSpeakAfterLastVariation(2, '1.348, 1.174, 1.0', true)).toBe(false);
  });
});

describe('applySpeedRacer', () => {
  const base = { wpm: 20, fwpm: 12 };

  it('maps Jay-style ladder plus first-multiplier replay', () => {
    const mults = SPEED_RACER_DEFAULT_MULTIPLIERS;
    expect(applySpeedRacer(base, 0, mults).wpm).toBe(30);
    expect(applySpeedRacer(base, 1, mults).wpm).toBe(27);
    expect(applySpeedRacer(base, 2, mults).wpm).toBe(24);
    expect(applySpeedRacer(base, 3, mults).wpm).toBe(20);
    expect(applySpeedRacer(base, 4, mults).wpm).toBe(30);
  });

  it('maps Overlearn multipliers at base 23', () => {
    const b = { wpm: 23, fwpm: 15 };
    const mults = SPEED_RACER_OVERLEARN_MULTIPLIERS;
    expect(applySpeedRacer(b, 0, mults).wpm).toBe(31);
    expect(applySpeedRacer(b, 1, mults).wpm).toBe(27);
    expect(applySpeedRacer(b, 2, mults).wpm).toBe(23);
    expect(applySpeedRacer(b, 0, mults).fwpm).toBe(15);
  });

  it('replays at first multiplier for ascending ladders', () => {
    const b = { wpm: 23, fwpm: 15 };
    const mults = '1.0, 1.174, 1.348';
    expect(applySpeedRacer(b, 0, mults).wpm).toBe(23);
    expect(applySpeedRacer(b, 2, mults).wpm).toBe(31);
    expect(applySpeedRacer(b, 3, mults).wpm).toBe(23);
  });

  it('scales FWPM down for slow variations', () => {
    const fast = applySpeedRacer(base, 1, SPEED_RACER_DEFAULT_MULTIPLIERS);
    expect(fast.fwpm).toBe(12);
    const slow = applySpeedRacer({ wpm: 20, fwpm: 20 }, 3, '1.5, 1.0, 0.5, 0.25');
    expect(slow.wpm).toBe(5);
    expect(slow.fwpm).toBe(5);
  });

  it('returns base unchanged when disabled or empty', () => {
    expect(applySpeedRacer(base, 0, SPEED_RACER_DEFAULT_MULTIPLIERS, false)).toBe(base);
    expect(applySpeedRacer(base, 0, '0, 0')).toBe(base);
  });
});

describe('preview / labels / pad', () => {
  it('builds Jay preview with speak and first-mult replay', () => {
    expect(buildSpeedRacerPreview(20, '1.5, 1.35, 1.175, 1.0', true, true))
      .toBe('30 → 27 → 24 → 20 → speak → 30 wpm');
  });

  it('builds Overlearn preview without replay', () => {
    expect(buildSpeedRacerPreview(23, '1.348, 1.174, 1.0', false, false))
      .toBe('31 → 27 → 23 wpm');
    expect(buildSpeedRacerPreview(23, '1.348, 1.174, 1.0', false, true))
      .toBe('31 → 27 → 23 → speak');
  });

  it('speak label follows Replay at First Multiplier', () => {
    expect(speedRacerSpeakLabel(true)).toBe('Speak Before Replay');
    expect(speedRacerSpeakLabel(false)).toBe('Speak');
  });

  it('pre-speak pad is at least 350ms', () => {
    expect(getSpeedRacerPreSpeakPadMs(20, '1.5, 1.0, 0.5, 0.25')).toBeGreaterThanOrEqual(350);
  });
});
