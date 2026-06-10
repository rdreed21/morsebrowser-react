import { render, screen, waitFor } from '@testing-library/react';
import { StateProviders } from '../test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WordListOption } from '@morsebrowser/core';
import { useMorseApp } from '../context/MorseAppContext';
import { useLessonDeepLinks } from './useLessonDeepLinks';

function TestApp({ loadLesson }: { loadLesson: (option: WordListOption) => Promise<void> }) {
  const { lessonDeepLinkPending } = useMorseApp();
  useLessonDeepLinks(loadLesson);
  return <div data-testid="pending">{String(lessonDeepLinkPending)}</div>;
}

describe('useLessonDeepLinks', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('clears lessonDeepLinkPending after deep link resolves', async () => {
    window.history.replaceState(
      {},
      '',
      '/?selectedClass=BC1&selectedGroup=REA&selectedLesson=REA',
    );

    const loadLesson = vi.fn(async () => {});

    render(
      <StateProviders>
        <TestApp loadLesson={loadLesson} />
      </StateProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('pending')).toHaveTextContent('false');
    });
    expect(loadLesson).toHaveBeenCalled();
  });
});
