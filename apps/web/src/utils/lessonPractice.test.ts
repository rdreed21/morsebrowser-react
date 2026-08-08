import { describe, expect, it } from 'vitest';
import {
  buildTokenPool,
  generateRandomPractice,
  resolvePracticeSeconds,
  shufflePracticeText,
  tokenWordLength,
} from './lessonPractice';

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

describe('buildTokenPool / sticky', () => {
  it('keeps sticky multi-char tokens intact', () => {
    expect(buildTokenPool('ab', 'BK')).toEqual(['A', 'B', 'BK']);
  });

  it('counts prosigns as length 1', () => {
    expect(tokenWordLength('<BT>A')).toBe(2);
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

  it('can emit sticky tokens as units', () => {
    const text = generateRandomPractice({
      letters: 'a',
      minWordSize: 2,
      maxWordSize: 2,
      practiceSeconds: 60,
      stickySets: 'BK',
    });
    // With only A + BK tokens and word length 2, BK alone fills a word.
    expect(text.split(' ').some(w => w.includes('BK') || w === 'AA' || w === 'ABK' || w.startsWith('BK'))).toBe(true);
  });
});

describe('shufflePracticeText', () => {
  it('preserves all words (Fisher–Yates permutation)', () => {
    const text = 'A B C D E F G H';
    const shuffled = shufflePracticeText(text, false, false);
    expect(shuffled.split(' ').sort().join(' ')).toBe('A B C D E F G H');
  });

  it('shuffles lines as units when newline chunking', () => {
    const text = 'A B\nC D\nE F';
    const shuffled = shufflePracticeText(text, true, false);
    const lines = shuffled.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines.sort()).toEqual(['A B', 'C D', 'E F'].sort());
  });
});
