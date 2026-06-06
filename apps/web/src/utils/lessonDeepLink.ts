import {
  getClasses, getDisplays, getLetterGroups, type WordListOption,
} from '@morsebrowser/core';
import { getUrlParam } from './urlParams';

function findIgnoreCase<T>(items: T[], getLabel: (item: T) => string, param: string): T | undefined {
  const upper = param.toUpperCase();
  return items.find(item => getLabel(item).toUpperCase() === upper);
}

export interface ResolvedLessonDeepLink {
  className: string;
  letterGroupName: string;
  display: WordListOption | null;
  consumedParams: Array<'selectedClass' | 'selectedGroup' | 'selectedLesson'>;
}

/** Resolve KO Tom-style lesson query params against the word list catalog. */
export function resolveLessonDeepLink(
  userTarget: string,
  fallbackClass = '',
  fallbackGroup = '',
): ResolvedLessonDeepLink | null {
  const classParam = getUrlParam('selectedClass');
  const groupParam = getUrlParam('selectedGroup');
  const lessonParam = getUrlParam('selectedLesson');
  if (!classParam && !groupParam && !lessonParam) return null;

  const consumed: ResolvedLessonDeepLink['consumedParams'] = [];
  let resolvedClass = fallbackClass;
  let resolvedGroup = fallbackGroup;
  let display: WordListOption | null = null;

  if (classParam) {
    const match = findIgnoreCase(getClasses(userTarget), c => c, classParam);
    if (!match) return null;
    resolvedClass = match;
    consumed.push('selectedClass');
  }

  if (groupParam) {
    if (!resolvedClass) return null;
    const match = findIgnoreCase(
      getLetterGroups(userTarget, resolvedClass),
      g => g,
      groupParam,
    );
    if (!match) return null;
    resolvedGroup = match;
    consumed.push('selectedGroup');
  }

  if (lessonParam) {
    if (!resolvedClass || !resolvedGroup) return null;
    const match = findIgnoreCase(
      getDisplays(userTarget, resolvedClass, resolvedGroup),
      d => d.display,
      lessonParam,
    );
    if (!match) return null;
    display = match;
    consumed.push('selectedLesson');
  }

  if (!resolvedClass) return null;

  return {
    className: resolvedClass,
    letterGroupName: resolvedGroup,
    display,
    consumedParams: consumed,
  };
}

export function hasLessonDeepLinkParams(): boolean {
  return !!(
    getUrlParam('selectedClass')
    || getUrlParam('selectedGroup')
    || getUrlParam('selectedLesson')
  );
}
