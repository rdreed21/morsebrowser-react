import {
  MORSE_MAP, PROSIGN_MAP, textToMorse, morseToText, charToMorse, tokenizeText,
} from '../engine/morseMap';

describe('MORSE_MAP', () => {
  it('matches KO morse-pro alphabet', () => {
    expect(MORSE_MAP.E).toBe('.');
    expect(MORSE_MAP.T).toBe('-');
    expect(MORSE_MAP['?']).toBe('..--..');
    expect(MORSE_MAP['&']).toBe('.-...');
    expect(MORSE_MAP['!']).toBe('-.-.--');
  });

  it('includes KO prosigns', () => {
    expect(PROSIGN_MAP['<AR>']).toBe('.-.-.');
    expect(PROSIGN_MAP['<BK>']).toBe('-...-.-');
    expect(PROSIGN_MAP['<SOS>']).toBe('...---...');
  });
});

describe('textToMorse', () => {
  it('E = dit', () => expect(textToMorse('E')).toBe('.'));
  it('KM = K space M', () => expect(textToMorse('KM')).toBe('-.- --'));
  it('K M = word separator', () => expect(textToMorse('K M')).toBe('-.- / --'));
  it('prosign AR', () => expect(textToMorse('<AR>')).toBe('.-.-.'));
});

describe('morseToText', () => {
  it('round-trips E', () => expect(morseToText(textToMorse('E'))).toBe('E'));
  it('round-trips K M', () => expect(morseToText(textToMorse('K M'))).toBe('K M'));
});

describe('charToMorse', () => {
  it('resolves single char', () => expect(charToMorse('k')).toBe('-.-'));
  it('resolves prosign', () => expect(charToMorse('<SK>')).toBe('...-.-'));
});

describe('tokenizeText', () => {
  it('splits prosign from letters', () => {
    expect(tokenizeText('A<AR>B')).toEqual(['A', '<AR>', 'B']);
  });
});
