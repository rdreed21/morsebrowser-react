import {
  unitDuration, calculateFarnsworthTiming,
  buildSchedule, sequenceDuration,
  DEFAULT_TIMING, KOCH_ORDER, kochCharsForLesson,
} from '../audio/timingEngine';

describe('unitDuration', () => {
  it('20 WPM = 60ms',  () => expect(unitDuration(20)).toBeCloseTo(0.06, 5));
  it('5 WPM = 240ms',  () => expect(unitDuration(5)).toBeCloseTo(0.24, 5));
  it('slower at lower WPM', () => expect(unitDuration(10)).toBeGreaterThan(unitDuration(20)));
});

describe('calculateFarnsworthTiming', () => {
  const std = { ...DEFAULT_TIMING, charWPM:20, effectiveWPM:20 };
  const fw  = { ...DEFAULT_TIMING, charWPM:20, effectiveWPM:10 };
  it('dit = 60ms at 20wpm',  () => expect(calculateFarnsworthTiming(std).dit).toBeCloseTo(0.06,4));
  it('dah = 180ms at 20wpm', () => expect(calculateFarnsworthTiming(std).dah).toBeCloseTo(0.18,4));
  it('farnsworth spacing > standard', () => {
    expect(calculateFarnsworthTiming(fw).interChar)
      .toBeGreaterThan(calculateFarnsworthTiming(std).interChar);
  });
  it('farnsworth dit unchanged', () => {
    expect(calculateFarnsworthTiming(fw).dit)
      .toBeCloseTo(calculateFarnsworthTiming(std).dit, 5);
  });
  it('matches KO UnitTimingsAndMultipliers at 20/15', () => {
    const cu = 1.2 / 20;
    const koFwMs = (((60 / 15) - 31 * cu) / 19) * 1000;
    const t = calculateFarnsworthTiming({ ...DEFAULT_TIMING, charWPM: 20, effectiveWPM: 15 });
    expect(t.interChar * 1000).toBeCloseTo(koFwMs * 3, 1);
    expect(t.interWord * 1000).toBeCloseTo(koFwMs * 7, 1);
  });
});

describe('buildSchedule', () => {
  it('E = single dit',      () => { const e=buildSchedule('E',DEFAULT_TIMING); expect(e).toHaveLength(1); expect(e[0].type).toBe('dit'); });
  it('T = single dah',      () => expect(buildSchedule('T',DEFAULT_TIMING)[0].type).toBe('dah'));
  it('K (-.-) = 3 tones',   () => expect(buildSchedule('K',DEFAULT_TIMING).filter(e=>e.isTone)).toHaveLength(3));
  it('KM has 1 interChar',  () => expect(buildSchedule('KM',DEFAULT_TIMING).filter(e=>e.type==='interChar')).toHaveLength(1));
  it('K M has 1 interWord', () => expect(buildSchedule('K M',DEFAULT_TIMING).filter(e=>e.type==='interWord')).toHaveLength(1));
  it('all durations > 0',   () => buildSchedule('CQ DE KQ4NKF',DEFAULT_TIMING).forEach(e=>expect(e.duration).toBeGreaterThan(0)));
  it('sequenceDuration = sum', () => {
    const els = buildSchedule('KM',DEFAULT_TIMING);
    expect(sequenceDuration(els)).toBeCloseTo(els.reduce((s,e)=>s+e.duration,0),10);
  });

  it('schedules prosigns as single tokens', () => {
    const els = buildSchedule('<AR>', DEFAULT_TIMING);
    const tones = els.filter(e => e.isTone);
    expect(tones).toHaveLength(5);
    expect(tones.map(t => t.type).join('')).toBe('ditdahditdahdit');
  });
});

describe('Koch', () => {
  it('starts K M',   () => { expect(KOCH_ORDER[0]).toBe('K'); expect(KOCH_ORDER[1]).toBe('M'); });
  it('39 chars',     () => expect(KOCH_ORDER).toHaveLength(39));
  it('lesson 2 = K M', () => expect(kochCharsForLesson(2)).toEqual(['K','M']));
});
