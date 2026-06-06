import wordifiers from '../configs/wordify.json';

interface Wordification {
  characters: string;
  replacement: string;
  onlyAlone: boolean;
  overrideSpell?: boolean;
}

const WORDIFICATIONS = (wordifiers as { wordifications: Wordification[] }).wordifications;

export function doReplacements(s: string): string {
  return s
    .replace(/Ø/g, '0')
    .replace(/'/g, '')
    .replace(/'/g, '')
    .replace(/'/g, '')
    .replace(/%/g, 'pct')
    .replace(/(?![\|\{\}\.\,\:\?\\\-\/\(\)\"\@\=\&\+\!\<\>\r\n])\W/g, ' ');
}

export function wordifyPunctuation(s: string, spellOverridesOnly = false): string {
  const applicable = spellOverridesOnly
    ? WORDIFICATIONS.filter(f => f.overrideSpell)
    : WORDIFICATIONS;

  let fixed = s.replace(/\r/g, '').replace(/\n/g, '');
  const fakeSpace = '|';

  for (const w of applicable) {
    const myChars = w.characters
      .replace(/\?/g, '\\?')
      .replace(/\./g, '\\.')
      .replace(/\//g, '\\/');

    if (!w.onlyAlone) {
      const myRegex = new RegExp(`${myChars}`, 'gi');
      fixed = fixed.replace(myRegex, `${fakeSpace}${w.replacement}${fakeSpace}`);
    } else if (w.characters.length === fixed.length) {
      const myRegex = new RegExp(`${myChars}`, 'gi');
      fixed = fixed.replace(myRegex, `${fakeSpace}${w.replacement}${fakeSpace}`);
    }
  }

  return fixed;
}

function replaceSpacesAroundE(input: string): string {
  return input.replace(/(\d) e (\d)/gi, '$1,e,$2');
}

function spellPiece(p: string): string {
  const base = `${doReplacements(p)}\n`;
  let spelled = base
    .replace(/>/g, '')
    .replace(/</g, '')
    .split('')
    .map(ch => wordifyPunctuation(ch, true))
    .join(' ');
  spelled = replaceSpacesAroundE(spelled);
  return spelled;
}

export function getSpeakText(rawWord: string, forceSpelling: boolean): string {
  const pieces = rawWord.split(/ (?![^{]*})/);
  const spoken = pieces.map((p) => {
    const trimmed = p.trim();
    const inner = (trimmed.startsWith('{') && trimmed.endsWith('}'))
      ? trimmed.slice(1, -1)
      : trimmed.replace(/[{}]/g, '');
    const hasOverride = p.includes('{');

    if (hasOverride) {
      const parts = inner.split('|');
      const morse = doReplacements(parts[0] ?? '');
      const speech = parts[1] != null ? doReplacements(parts[1]) : null;
      if (!forceSpelling) {
        return speech ?? wordifyPunctuation(morse);
      }
      return morse.split('').join(' ');
    }

    if (!forceSpelling) {
      return wordifyPunctuation(`${doReplacements(p)}\n`);
    }
    return spellPiece(p);
  }).join(' ');

  return `${spoken}\n`;
}

export function prepPhraseToSpeakForFinal(beforePhrase: string): string {
  return beforePhrase
    .replace(/\|/g, ' ')
    .replace(/\WV\W/g, ' VEE ')
    .replace(/^V\W/g, ' VEE ')
    .replace(/\WV$/g, ' VEE ');
}
