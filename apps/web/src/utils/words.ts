/** Mirrors KO MorseStringUtils.doReplacements */
function doReplacements(s: string): string {
  return s
    .replace(/Ø/g, '0')
    .replace(/'/g, '')
    .replace(/'/g, '')
    .replace(/'/g, '')
    .replace(/%/g, 'pct')
    .replace(/(?![\|\{\}\.\,\:\?\\\-\/\(\)\"\@\=\&\+\!\<\>\r\n])\W/g, ' ');
}

/** Split practice text into raw words — mirrors KO MorseStringUtils.getWords split logic. */
export function getWords(text: string, newlineChunking = false): string[] {
  if (!text.trim()) return [];
  // Word files may carry CRLF or bare-CR endings; fold them to LF so
  // \r can never survive into a word.
  const replaced = doReplacements(text.replace(/\r\n?/g, '\n'));
  const splitPattern = newlineChunking
    ? /\n(?![^{]*})/
    : / (?![^{]*})/;
  return replaced
    .split(splitPattern)
    .filter(w => w.replace(/\s/g, '').length > 0);
}

/** Display label for a card — mirrors KO WordInfo.displayWord. */
export function getDisplayWord(rawWord: string): string {
  const pieces = rawWord.split(/ (?![^{]*})/);
  return pieces.map(p => {
    const trimmed = p.trim();
    if (trimmed.includes('{')) {
      const inner = (trimmed.startsWith('{') && trimmed.endsWith('}'))
        ? trimmed.slice(1, -1)
        : trimmed.replace(/[{}]/g, '');
      const parts = inner.split('|');
      return doReplacements(parts[0] ?? '');
    }
    return doReplacements(p);
  }).join(' ');
}

export function rawTextCharCount(text: string): number {
  return text.replace(/\s/g, '').length;
}
