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

  it('never leaks \\r from CRLF word file content', () => {
    const words = getWords('FOO \r\nBAR \r\n{BAZ QUX|} {VV|} \r\n', false);
    expect(words.join('')).not.toContain('\r');
    // \n legitimately stays attached in space-split mode (KO parity);
    // only \r must be gone.
    expect(words.map(w => w.trim())).toEqual(['FOO', 'BAR', '{BAZ QUX|}', '{VV|}']);
  });

  it('treats bare-CR (old Mac) line endings as newlines', () => {
    const chunks = getWords('A BIT MUCH \r{A BIT MUCH|} {VV|} \rA PRETTY PENNY ', true);
    expect(chunks.join('')).not.toContain('\r');
    expect(chunks[0].trim()).toBe('A BIT MUCH');
  });
});

describe('getDisplayWord', () => {
  it('shows morse side of override', () => {
    expect(getDisplayWord('{CQ|c q}')).toBe('CQ');
    expect(getDisplayWord('{LICW|l i c w}')).toBe('LICW');
  });
});
