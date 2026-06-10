import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useRef } from 'react';
import { MorseAppProvider, useMorseApp } from '../context/MorseAppContext';
import {
  MorsePlaybackProvider,
  useMorsePlaybackControls,
} from '../context/MorsePlaybackContext';

const mockPlay = vi.fn();
const mockStopMorse = vi.fn();
const mockStopAll = vi.fn();
const mockEnsureNoise = vi.fn();

vi.mock('../utils/voiceSpeech', () => ({
  speakPhrase: vi.fn((_cfg: unknown, cb?: () => void) => { cb?.(); }),
  cancelSpeech: vi.fn(),
  primeSpeechPump: vi.fn(),
  resolveSpeechVoice: vi.fn(() => undefined),
}));

vi.mock('../context/MorseAudioContext', () => ({
  MorseAudioProvider: ({ children }: { children: React.ReactNode }) => children,
  useMorseAudio: () => ({
    play: mockPlay,
    stopMorse: mockStopMorse,
    stopAll: mockStopAll,
    ensureNoise: mockEnsureNoise,
    playTestTone: vi.fn(),
    getCtx: vi.fn(),
  }),
}));

function Harness() {
  const app = useMorseApp();
  const { handlePlay, handlePause, handleStop } = useMorsePlaybackControls();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    app.setShowingText('A B C');
  }, [app]);

  return (
    <>
      <button type="button" onClick={handlePlay}>play</button>
      <button type="button" onClick={handlePause}>pause</button>
      <button type="button" onClick={handleStop}>stop</button>
      <span data-testid="isPlaying">{String(app.isPlaying)}</span>
      <span data-testid="isPaused">{String(app.isPaused)}</span>
      <span data-testid="runningPlayMs">{app.runningPlayMs}</span>
      <span data-testid="charsPlayed">{app.charsPlayed}</span>
    </>
  );
}

function renderHarness() {
  return render(
    <MorseAppProvider>
      <MorsePlaybackProvider>
        <Harness />
      </MorsePlaybackProvider>
    </MorseAppProvider>,
  );
}

const num = (id: string) => Number(screen.getByTestId(id).textContent);
const text = (id: string) => screen.getByTestId(id).textContent;

describe('pause / resume session state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPlay.mockReset();
    mockStopMorse.mockClear();
    mockStopAll.mockClear();
    mockEnsureNoise.mockClear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resume after pause preserves runningPlayMs and charsPlayed (KO doPlay(true,false))', async () => {
    renderHarness();
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      vi.advanceTimersByTime(100); // let the doPlay timer fire -> chunk scheduled
    });
    expect(text('isPlaying')).toBe('true');
    const charsAfterPlay = num('charsPlayed');
    expect(charsAfterPlay).toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(3000); // accumulate play time on the fake clock
      screen.getByRole('button', { name: 'pause' }).click();
    });
    expect(text('isPaused')).toBe('true');
    expect(text('isPlaying')).toBe('false');
    const msAtPause = num('runningPlayMs');
    expect(msAtPause).toBeGreaterThan(0);

    // Resume — must NOT be a fresh start: elapsed ms and chars survive.
    await act(async () => {
      screen.getByRole('button', { name: 'pause' }).click();
    });
    expect(text('isPaused')).toBe('false');
    expect(text('isPlaying')).toBe('true');
    expect(num('runningPlayMs')).toBe(msAtPause);
    expect(num('charsPlayed')).toBeGreaterThanOrEqual(charsAfterPlay);
  });

  it('rapid play/pause/play/stop leaves consistent stopped state', async () => {
    renderHarness();
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      screen.getByRole('button', { name: 'pause' }).click();
      screen.getByRole('button', { name: 'pause' }).click(); // resume
      screen.getByRole('button', { name: 'stop' }).click();
    });

    expect(text('isPlaying')).toBe('false');
    expect(text('isPaused')).toBe('false');

    // No ghost playback: timers left behind must not schedule more morse.
    const callsAtStop = mockPlay.mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(10000); });
    expect(mockPlay.mock.calls.length).toBe(callsAtStop);
    expect(text('isPlaying')).toBe('false');
  });

  it('stop after natural completion resets trail and index', async () => {
    mockPlay.mockImplementation((_text, opts) => {
      if (typeof opts === 'object' && opts?.onComplete) opts.onComplete();
    });
    renderHarness();
    await act(async () => { await Promise.resolve(); });

    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
    });
    for (let i = 0; i < 30; i += 1) {
      await act(async () => { vi.runOnlyPendingTimers(); });
    }
    await act(async () => {
      screen.getByRole('button', { name: 'stop' }).click();
    });

    expect(text('isPlaying')).toBe('false');
    expect(text('isPaused')).toBe('false');
  });
});
