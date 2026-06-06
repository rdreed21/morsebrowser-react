/**
 * Lesson / word-file loading ported from KO app:
 *   src/morse/lessons/morseLessonPlugin.ts
 *   src/wordfilesconfigs/wordlists.json
 *   src/wordfiles/* (.txt and .json)
 */
import type { Lesson } from '@morsebrowser/types';
import { kochCharsForLesson } from '../audio/timingEngine';
import wordlistsData from './wordlists.json';

/** KO FileOptionsInfo */
export interface WordListOption {
  sort: number;
  userTarget: string;
  class: string;
  letterGroup: string;
  newlineChunking: boolean;
  display: string;
  fileName: string;
}

/** KO random-word JSON lesson config (e.g. SB1REA1.json) */
export interface RandomWordListConfig {
  letters: string;
  minWordSize: number;
  maxWordSize: number;
  practiceSeconds: number;
}

export type LessonFileResult =
  | { type: 'text'; content: string }
  | { type: 'random'; config: RandomWordListConfig };

/** Base URL for word files — KO serves from src/wordfiles; React proxy may use /srd/wordfiles */
export const WORDFILES_BASE_PATH = '/wordfiles';

const CATALOG: WordListOption[] = (wordlistsData as { fileOptions: WordListOption[] }).fileOptions;

export function getWordListCatalog(): WordListOption[] {
  return [...CATALOG];
}

export function getUserTargets(): string[] {
  const targets = new Set<string>();
  CATALOG.forEach(e => targets.add(e.userTarget));
  return [...targets];
}

export function getClasses(userTarget: string): string[] {
  const classes = new Set<string>();
  CATALOG.filter(e => e.userTarget === userTarget).forEach(e => classes.add(e.class));
  return [...classes];
}

export function getLetterGroups(userTarget: string, lessonClass: string): string[] {
  const groups = new Set<string>();
  CATALOG
    .filter(e => e.userTarget === userTarget && e.class === lessonClass)
    .forEach(e => groups.add(e.letterGroup));
  return [...groups];
}

export function getDisplays(
  userTarget: string,
  lessonClass: string,
  letterGroup: string,
): WordListOption[] {
  return CATALOG.filter(
    e => e.userTarget === userTarget &&
         e.class === lessonClass &&
         e.letterGroup === letterGroup,
  );
}

export function findWordListOption(fileName: string): WordListOption | undefined {
  return CATALOG.find(e => e.fileName === fileName);
}

export async function loadLesson(id: string): Promise<Lesson> {
  const n = parseInt(id.replace('lesson_', ''), 10) || 1;
  return { id, name: `Lesson ${n}`, characters: kochCharsForLesson(n) };
}

function wordFileUrl(filename: string, basePath = WORDFILES_BASE_PATH): string {
  return `${basePath}/${filename}`;
}

/** Load a .txt word list — one word/phrase per line */
export async function loadWordList(
  filename: string,
  basePath = WORDFILES_BASE_PATH,
): Promise<string[]> {
  const res = await fetch(wordFileUrl(filename, basePath));
  if (!res.ok) throw new Error(`Word file not found: ${filename}`);
  return (await res.text()).split('\n').map(w => w.trim()).filter(Boolean);
}

/** Load .txt or .json lesson file — mirrors KO getWordList branching */
export async function loadLessonFile(
  filename: string,
  basePath = WORDFILES_BASE_PATH,
): Promise<LessonFileResult> {
  const res = await fetch(wordFileUrl(filename, basePath));
  if (!res.ok) throw new Error(`Lesson file not found: ${filename}`);

  if (filename.endsWith('.json')) {
    const config = (await res.json()) as RandomWordListConfig;
    return { type: 'random', config };
  }

  const content = await res.text();
  return { type: 'text', content };
}

export function isRandomWordListConfig(value: unknown): value is RandomWordListConfig {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.letters === 'string' &&
    typeof v.minWordSize === 'number' &&
    typeof v.maxWordSize === 'number' &&
    typeof v.practiceSeconds === 'number';
}
