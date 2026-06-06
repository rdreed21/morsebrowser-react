import type { RandomWordListConfig } from '@morsebrowser/core';

export interface CustomGroupOptions {
  letters: string;
  practiceSeconds: number;
  minWordSize: number;
  maxWordSize: number;
  stickySets?: string;
}

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function buildCharPool(letters: string, stickySets?: string): string[] {
  let pool = letters.toUpperCase().replace(/ /g, '');
  if (stickySets?.trim()) {
    pool += stickySets.toUpperCase().trim().replace(/ {2}/g, ' ').replace(/ /g, '');
  }
  return pool.split('').filter(Boolean);
}

/** Generate practice text from custom group + overrides — mirrors KO doCustomGroup/randomWordList. */
export function generateCustomGroupPractice(opts: CustomGroupOptions): string {
  const chars = buildCharPool(opts.letters, opts.stickySets);
  if (chars.length === 0) return '';

  const words: string[] = [];
  let seconds = 0;
  const minSz = Math.max(1, opts.minWordSize);
  const maxSz = Math.max(minSz, opts.maxWordSize);

  while (seconds < opts.practiceSeconds) {
    const len = minSz === maxSz ? minSz : randomInt(minSz, maxSz);
    let word = '';
    for (let i = 0; i < len; i++) {
      word += chars[randomInt(0, chars.length - 1)];
    }
    words.push(word);
    seconds += 6;
  }
  return words.join(' ');
}

/** KO morseLessonPlugin: override minutes when ifOverrideTime or custom group is on. */
export function resolvePracticeSeconds(
  config: RandomWordListConfig,
  ifOverrideTime: boolean,
  overrideMins: number,
  ifCustomGroup: boolean,
): number {
  if (ifOverrideTime || ifCustomGroup) return overrideMins * 60;
  return config.practiceSeconds;
}

/** Simplified random practice generator for .json lesson files (KO randomWordList). */
export function generateRandomPractice(config: RandomWordListConfig): string {
  const chars = config.letters.toUpperCase().replace(/ /g, '').split('');
  if (chars.length === 0) return '';

  const words: string[] = [];
  const targetWords = Math.max(10, Math.ceil(config.practiceSeconds / 6));

  for (let i = 0; i < targetWords; i++) {
    const len = config.minWordSize === config.maxWordSize
      ? config.minWordSize
      : randomInt(config.minWordSize, config.maxWordSize);
    let word = '';
    for (let j = 0; j < len; j++) {
      word += chars[randomInt(0, chars.length - 1)];
    }
    words.push(word);
  }
  return words.join(' ');
}
