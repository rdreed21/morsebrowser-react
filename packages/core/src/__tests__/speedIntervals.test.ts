import { getApplicableSpeed } from '../settings/speedIntervals';

describe('getApplicableSpeed', () => {
  const base = {
    charWPM: 20,
    effectiveWPM: 18,
    speedInterval: true,
    intervalTimingsText: '30,60',
    intervalWpmText: '12,18',
    intervalFwpmText: '8,12',
  };

  it('returns base speeds when intervals disabled', () => {
    expect(getApplicableSpeed(0, { ...base, speedInterval: false })).toEqual({
      charWPM: 20,
      effectiveWPM: 18,
    });
  });

  it('uses first interval at start of playback', () => {
    expect(getApplicableSpeed(0, base)).toEqual({ charWPM: 12, effectiveWPM: 8 });
  });

  it('uses second interval after first timing elapses', () => {
    expect(getApplicableSpeed(31000, base)).toEqual({ charWPM: 18, effectiveWPM: 12 });
  });

  it('holds last interval after all timings elapsed', () => {
    expect(getApplicableSpeed(120000, base)).toEqual({ charWPM: 18, effectiveWPM: 12 });
  });
});
