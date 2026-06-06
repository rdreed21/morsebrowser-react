/**
 * Morse character map ported from KO app morse-pro/morse-pro.js (text2morseH + prosign2morseH).
 * Canonical morse uses single spaces between characters and " / " between words.
 */

/** Standard ITU characters — matches morse-pro text2morseH */
export const MORSE_MAP: Record<string, string> = {
  A: '.-',   B: '-...', C: '-.-.', D: '-..',  E: '.',    F: '..-.',
  G: '--.',  H: '....', I: '..',   J: '.---', K: '-.-',  L: '.-..',
  M: '--',   N: '-.',   O: '---',  P: '.--.', Q: '--.-', R: '.-.',
  S: '...',  T: '-',    U: '..-',  V: '...-', W: '.--',  X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', ':': '---...', '?': '..--..',
  "'": '.----.', '-': '-....-', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '"': '.-..-.', '@': '.--.-.', '=': '-...-', '&': '.-...',
  '+': '.-.-.', '!': '-.-.--',
};

/** Prosigns — matches morse-pro prosign2morseH */
export const PROSIGN_MAP: Record<string, string> = {
  '<AA>': '.-.-',   '<AR>': '.-.-.',  '<AS>': '.-...',  '<BK>': '-...-.-',
  '<BT>': '-...-',  '<CL>': '-.-..-..', '<CT>': '-.-.-', '<DO>': '-..---',
  '<KN>': '-.--.',  '<SK>': '...-.-', '<VA>': '...-.-', '<SN>': '...-.',
  '<VE>': '...-.',  '<SOS>': '...---...',
};

const PROSIGN_PATTERN = /^<[^>]+>$/;

function tidyText(text: string): string {
  return text.toUpperCase().trim().replace(/\s+/g, ' ');
}

/** Tokenize text into single chars and prosigns like <AR> */
export function tokenizeText(text: string, useProsigns = true): string[] {
  const tokens: string[] = [];
  let remaining = tidyText(text);
  while (remaining.length > 0) {
    let len = 1;
    if (useProsigns) {
      const match = remaining.match(/^<[^>]+>/);
      if (match) len = match[0].length;
    }
    tokens.push(remaining.slice(0, len));
    remaining = remaining.slice(len);
  }
  return tokens;
}

function lookupMap(useProsigns: boolean): Record<string, string> {
  return useProsigns ? { ...MORSE_MAP, ...PROSIGN_MAP } : MORSE_MAP;
}

/** Translate plain text to canonical morse (chars space-separated, words joined with " / ") */
export function textToMorse(text: string, useProsigns = true): string {
  const tidy = tidyText(text);
  if (!tidy) return '';
  const map = lookupMap(useProsigns);
  return tidy.split(' ').map(word => {
    const tokens = tokenizeText(word, useProsigns);
    return tokens.map(t => map[t] ?? '?').join(' ');
  }).join(' / ');
}

const REV: Record<string, string> = Object.fromEntries(
  Object.entries({ ...MORSE_MAP, ...PROSIGN_MAP }).map(([k, v]) => [v, k]),
);

/** Translate canonical morse back to text */
export function morseToText(morse: string, useProsigns = true): string {
  const canonical = morse
    .replace(/\|/g, '/')
    .replace(/\//g, ' / ')
    .replace(/\s+/g, ' ')
    .replace(/(\/ )+\//g, '/')
    .replace(/_/g, '-')
    .trim();
  if (!canonical) return '';
  const map = useProsigns ? REV : Object.fromEntries(
    Object.entries(MORSE_MAP).map(([k, v]) => [v, k]),
  );
  return canonical.split(' / ').map(word =>
    word.split(' ').map(c => map[c] ?? '?').join(''),
  ).join(' ');
}

/** Resolve a single character or prosign to its dit/dah pattern */
export function charToMorse(char: string, useProsigns = true): string | undefined {
  const map = lookupMap(useProsigns);
  return map[char.toUpperCase()] ?? (PROSIGN_PATTERN.test(char) ? map[char] : undefined);
}
