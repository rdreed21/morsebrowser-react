import { describe, it, expect } from 'vitest';
import { getWords, getDisplayWord } from './words';

describe('getWords', () => {
  it('splits on spaces', () => {
    expect(getWords('A B', false)).toEqual(['A', 'B']);
  });

  it('keeps brace overrides as single words', () => {
    expect(getWords('{CQ|c q} {LICW|l i c w}', false)).toEqual([
      '{CQ|c q}',
      '{LICW|l i c w}',
    ]);
  });
});

describe('getDisplayWord', () => {
  it('shows morse side of override', () => {
    expect(getDisplayWord('{CQ|c q}')).toBe('CQ');
    expect(getDisplayWord('{LICW|l i c w}')).toBe('LICW');
  });
});
