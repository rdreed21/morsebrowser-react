import { describe, it, expect } from 'vitest';
import { getSpeakText, prepPhraseToSpeakForFinal } from './speakText';

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
});
