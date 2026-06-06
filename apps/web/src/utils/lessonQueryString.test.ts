import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { upsertLessonQueryParam, removeLessonQueryParam } from './lessonQueryString';

describe('lessonQueryString', () => {
  const originalReplaceState = window.history.replaceState;

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    window.history.replaceState = originalReplaceState;
  });

  it('upsertLessonQueryParam drops lower-priority params', () => {
    window.history.replaceState({}, '', '/?selectedClass=BC1&selectedPreset=Default');
    let replaced = '';
    window.history.replaceState = (_s, _t, url) => { replaced = String(url); };

    upsertLessonQueryParam('selectedClass', 'BC2');

    expect(replaced).toBe('/?selectedClass=BC2');
  });

  it('removeLessonQueryParam clears a param', () => {
    window.history.replaceState({}, '', '/?selectedPreset=Default');
    let replaced = '';
    window.history.replaceState = (_s, _t, url) => { replaced = String(url); };

    removeLessonQueryParam('selectedPreset');

    expect(replaced).toBe('/');
  });
});
