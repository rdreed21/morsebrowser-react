import { useEffect, useRef } from 'react';
import type { WordListOption } from '@morsebrowser/core';
import { useMorseApp } from '../context/MorseAppContext';
import { removeLessonQueryParam } from '../utils/lessonQueryString';
import { hasLessonDeepLinkParams, resolveLessonDeepLink } from '../utils/lessonDeepLink';

function consumeIfNotPinned(
  param: 'selectedClass' | 'selectedGroup' | 'selectedLesson',
  pinned: boolean,
): void {
  if (!pinned) removeLessonQueryParam(param);
}

/**
 * KO morseLessonPlugin set*Initialized deep-link cascade.
 * ?selectedClass=&selectedGroup=&selectedLesson=
 */
export function useLessonDeepLinks(loadLesson: (option: WordListOption) => Promise<void>) {
  const {
    userTarget, selectedClass, letterGroup,
    applyLessonDeepLinkSelection, isQueryStringSettingsOn, completeLessonDeepLink,
  } = useMorseApp();
  const loadLessonRef = useRef(loadLesson);
  loadLessonRef.current = loadLesson;
  const initialClassRef = useRef(selectedClass);
  const initialGroupRef = useRef(letterGroup);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || !hasLessonDeepLinkParams()) return;
    ranRef.current = true;

    let cancelled = false;
    const pinQuery = isQueryStringSettingsOn();

    void (async () => {
      try {
        const resolved = resolveLessonDeepLink(
          userTarget,
          initialClassRef.current,
          initialGroupRef.current,
        );

        if (resolved && !cancelled) {
          applyLessonDeepLinkSelection(
            resolved.className,
            resolved.letterGroupName,
            resolved.display,
          );

          if (resolved.display) {
            try {
              await loadLessonRef.current(resolved.display);
            } catch {
              // loadLesson sets error state in LessonsPicker.
            }
          }

          if (!cancelled) {
            for (const param of resolved.consumedParams) {
              consumeIfNotPinned(param, pinQuery);
            }
          }
        }
      } finally {
        completeLessonDeepLink();
      }
    })();

    return () => { cancelled = true; };
  }, [
    userTarget,
    applyLessonDeepLinkSelection,
    isQueryStringSettingsOn,
    completeLessonDeepLink,
  ]);
}
