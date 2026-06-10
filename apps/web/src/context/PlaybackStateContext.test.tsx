import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRef } from 'react';
import { StateProviders } from '../test-utils';
import { useMorseApp } from './MorseAppContext';
import { usePlaybackActions, usePlaybackState } from './PlaybackStateContext';

let fireSetCurrentIndex: (i: number) => void = () => {};
let fireSetRunningPlayMs: (ms: number) => void = () => {};

function Driver() {
  const { setCurrentIndex, setRunningPlayMs } = usePlaybackActions();
  fireSetCurrentIndex = setCurrentIndex;
  fireSetRunningPlayMs = setRunningPlayMs;
  return null;
}

function AppProbe() {
  useMorseApp();
  const renders = useRef(0);
  renders.current += 1;
  return <span data-testid="app-renders">{renders.current}</span>;
}

function PlaybackProbe() {
  const { currentIndex } = usePlaybackState();
  const renders = useRef(0);
  renders.current += 1;
  return (
    <>
      <span data-testid="pb-renders">{renders.current}</span>
      <span data-testid="pb-index">{currentIndex}</span>
    </>
  );
}

describe('PlaybackStateContext render isolation', () => {
  it('playback ticks do not re-render settings-only consumers', () => {
    render(
      <StateProviders>
        <Driver />
        <AppProbe />
        <PlaybackProbe />
      </StateProviders>,
    );

    const appRendersBefore = Number(screen.getByTestId('app-renders').textContent);

    act(() => { fireSetCurrentIndex(3); });
    act(() => { fireSetRunningPlayMs(1234); });
    act(() => { fireSetRunningPlayMs(5678); });

    expect(screen.getByTestId('pb-index').textContent).toBe('3');
    // The playback consumer re-rendered for each tick...
    expect(Number(screen.getByTestId('pb-renders').textContent)).toBeGreaterThanOrEqual(4);
    // ...while the useMorseApp consumer did not re-render at all.
    expect(Number(screen.getByTestId('app-renders').textContent)).toBe(appRendersBefore);
  });
});
