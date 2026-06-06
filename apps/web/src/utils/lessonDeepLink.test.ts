import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasLessonDeepLinkParams, resolveLessonDeepLink } from './lessonDeepLink';

describe('lessonDeepLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves full Tom-style link for BC1 REA', () => {
    vi.stubGlobal('window', {
      location: {
        search: '?selectedClass=BC1&selectedGroup=REA&selectedLesson=REA',
      },
    });

    const resolved = resolveLessonDeepLink('STUDENT');
    expect(resolved).not.toBeNull();
    expect(resolved?.className).toBe('BC1');
    expect(resolved?.letterGroupName).toBe('REA');
    expect(resolved?.display?.fileName).toBe('SB1REA1.json');
    expect(resolved?.consumedParams).toEqual(['selectedClass', 'selectedGroup', 'selectedLesson']);
  });

  it('matches preset names case-insensitively via separate preset hook', () => {
    vi.stubGlobal('window', {
      location: { search: '?selectedPreset=default%2012/8' },
    });
    expect(hasLessonDeepLinkParams()).toBe(false);
  });

  it('returns null when lesson display is unknown', () => {
    vi.stubGlobal('window', {
      location: {
        search: '?selectedClass=BC1&selectedGroup=REA&selectedLesson=Lesson%201',
      },
    });
    expect(resolveLessonDeepLink('STUDENT')).toBeNull();
  });
});
