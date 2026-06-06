/** KO morseLessonPlugin upsert/remove — gated by queryStringSettingsOn elsewhere. */

const LESSON_QUERY_PRIORITY = [
  'selectedClass',
  'selectedGroup',
  'selectedLesson',
  'selectedPreset',
] as const;

export type LessonQueryParam = typeof LESSON_QUERY_PRIORITY[number];

function replaceUrl(params: URLSearchParams): void {
  const qs = params.toString();
  const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, '', next);
}

export function removeLessonQueryParam(variable: LessonQueryParam | string): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (!params.has(variable)) return;
  params.delete(variable);
  replaceUrl(params);
}

export function upsertLessonQueryParam(variable: LessonQueryParam, value: string): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);

  if (params.has(variable) && params.get(variable) === value) return;

  const idx = LESSON_QUERY_PRIORITY.indexOf(variable);
  if (idx !== -1) {
    for (let i = idx + 1; i < LESSON_QUERY_PRIORITY.length; i++) {
      params.delete(LESSON_QUERY_PRIORITY[i]);
    }
  }

  params.set(variable, value);
  replaceUrl(params);
}
