import type { RandomWordListConfig } from '@morsebrowser/core';

export interface CustomGroupOptions {
  letters: string;
  practiceSeconds: number;
  minWordSize: number;
  maxWordSize: number;
  stickySets?: string;
}

export interface RandomPracticeOptions extends RandomWordListConfig {
  stickySets?: string;
  /** When false, emit letters as a single fixed word (KO randomizeLessons off). Default true. */
  randomize?: boolean;
}

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Build draw tokens from letters + sticky sets.
 * Sticky tokens are space-separated multi-char units (e.g. "BK" stays "BK"),
 * matching club `splitWithProsignsAndStcikys`.
 */
export function buildTokenPool(letters: string, stickySets?: string): string[] {
  const tokens: string[] = [];
  const upper = letters.toUpperCase();
  // Prefer prosign tokens <...>, else single non-space chars.
  const letterParts = upper.match(/<[^>]*>|[^<\s]/g) ?? [];
  for (const part of letterParts) {
    if (part.startsWith('<') && part.endsWith('>')) {
      tokens.push(part);
    } else {
      for (const ch of part) tokens.push(ch);
    }
  }
  if (stickySets?.trim()) {
    for (const tok of stickySets.toUpperCase().trim().replace(/ {2}/g, ' ').split(' ').filter(Boolean)) {
      tokens.push(tok);
    }
  }
  return tokens.filter(Boolean);
}

/** Club getWordLength: prosigns <...> count as 1. */
export function tokenWordLength(str: string): number {
  let count = 0;
  let inside = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '<') {
      inside = true;
      count++;
    } else if (str[i] === '>') {
      inside = false;
    } else if (!inside) {
      count++;
    }
  }
  return count;
}

/** Generate practice text from custom group + overrides — mirrors KO doCustomGroup/randomWordList. */
export function generateCustomGroupPractice(opts: CustomGroupOptions): string {
  return generateRandomPractice({
    letters: opts.letters,
    minWordSize: opts.minWordSize,
    maxWordSize: opts.maxWordSize,
    practiceSeconds: opts.practiceSeconds,
    stickySets: opts.stickySets,
    randomize: true,
  });
}

/**
 * KO morseLessonPlugin: override minutes when ifOverrideTime or custom group is on.
 */
export function resolvePracticeSeconds(
  config: RandomWordListConfig,
  ifOverrideTime: boolean,
  overrideMins: number,
  ifCustomGroup: boolean,
): number {
  if (ifOverrideTime || ifCustomGroup) return overrideMins * 60;
  return config.practiceSeconds;
}

/**
 * Random practice generator for .json lesson files — mirrors KO randomWordList
 * (sticky tokens, prosign-aware length, time loop ~6s/word heuristic).
 */
export function generateRandomPractice(config: RandomPracticeOptions): string {
  const tokens = buildTokenPool(config.letters, config.stickySets);
  if (tokens.length === 0) return '';

  const minSz = Math.max(1, config.minWordSize);
  const maxSz = Math.max(minSz, config.maxWordSize);
  const randomize = config.randomize !== false;
  const words: string[] = [];
  let seconds = 0;

  while (seconds < config.practiceSeconds) {
    let word = '';
    if (randomize) {
      const wordLength = minSz === maxSz ? minSz : randomInt(minSz, maxSz);
      while (tokenWordLength(word) < wordLength) {
        const free = wordLength - tokenWordLength(word);
        const usable = tokens.filter(t => (
          t.length === 1
          || (t.startsWith('<') && t.endsWith('>'))
          || tokenWordLength(t) <= free
        ));
        if (usable.length === 0) break;
        word += usable[randomInt(0, usable.length - 1)];
      }
    } else {
      word = config.letters;
    }
    if (!word) break;
    words.push(word.toUpperCase());
    seconds += 6;
  }
  return words.join(' ');
}

/** Fisher–Yates shuffle (in place copy). */
export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

/**
 * Shuffle practice text into units — club shuffleWords (phrase vs word units).
 * When `shuffleIntraGroup` and newline chunking, words inside each line are
 * shuffled before lines are shuffled as units.
 */
export function shufflePracticeText(
  text: string,
  newlineChunking: boolean,
  shuffleIntraGroup: boolean,
): string {
  const hasPhrases = newlineChunking && text.includes('\n');
  if (hasPhrases) {
    const lines = text.split('\n').filter(l => l.length > 0);
    const units = lines.map(line => {
      const words = line.split(/\s+/).filter(Boolean);
      return shuffleIntraGroup ? fisherYatesShuffle(words).join(' ') : words.join(' ');
    });
    return fisherYatesShuffle(units).join('\n');
  }
  const words = text.split(/\s+/).filter(Boolean);
  return fisherYatesShuffle(words).join(' ');
}
