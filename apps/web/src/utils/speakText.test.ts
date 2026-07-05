import { describe, it, expect } from 'vitest';
import { formatSpelledRecapPhrase, getSpeakText, prepPhraseToSpeakForFinal } from './speakText';

describe('getSpeakText', () => {
  it('uses speech side of brace override when not spelling', () => {
    expect(getSpeakText('{CQ|c q}', false).trim()).toBe('c q');
  });

  it('uses morse side spelled out when spelling', () => {
    expect(getSpeakText('{CQ|c q}', true).trim()).toBe('C Q');
  });

  it('wordifies punctuation when spelling', () => {
    expect(prepPhraseToSpeakForFinal(getSpeakText('.', true)).toLowerCase()).toContain('period');
  });

  it('prepPhraseToSpeakForFinal expands isolated V', () => {
    expect(prepPhraseToSpeakForFinal('TEST V TEST')).toContain('VEE');
  });

  it('formats spelled recap text with period pauses for single-utterance TTS', () => {
    expect(formatSpelledRecapPhrase('R E R')).toBe('R. E. R.');
    expect(formatSpelledRecapPhrase(`${getSpeakText('TIN', true)}\n`)).toBe('T. I. N.');
    expect(formatSpelledRecapPhrase('A')).toBe('A');
    expect(formatSpelledRecapPhrase('   ')).toBe('');
  });
});
