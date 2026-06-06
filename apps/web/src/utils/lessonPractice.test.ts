import { describe, expect, it } from 'vitest';
import { generateRandomPractice, resolvePracticeSeconds } from './lessonPractice';

describe('resolvePracticeSeconds', () => {
  const config = {
    letters: 'rea',
    minWordSize: 3,
    maxWordSize: 3,
    practiceSeconds: 120,
  };

  it('uses lesson JSON seconds by default', () => {
    expect(resolvePracticeSeconds(config, false, 2, false)).toBe(120);
  });

  it('uses override minutes when ifOverrideTime is on', () => {
    expect(resolvePracticeSeconds(config, true, 2, false)).toBe(120);
  });

  it('uses override minutes for custom group lessons', () => {
    expect(resolvePracticeSeconds(config, false, 3, true)).toBe(180);
  });
});

describe('generateRandomPractice', () => {
  it('honors overridden practiceSeconds', () => {
    const text = generateRandomPractice({
      letters: 'ab',
      minWordSize: 2,
      maxWordSize: 2,
      practiceSeconds: 6,
    });
    const words = text.split(' ').filter(Boolean);
    expect(words.length).toBeGreaterThanOrEqual(1);
  });
});
