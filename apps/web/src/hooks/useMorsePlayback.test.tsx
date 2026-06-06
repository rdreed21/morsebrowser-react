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
const speakPhraseMock = vi.fn((_cfg: unknown, cb?: () => void) => { cb?.(); });

vi.mock('../utils/voiceSpeech', () => ({
  speakPhrase: (...args: unknown[]) => speakPhraseMock(...args),
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

function SeedAndPlay({ text = 'A' }: { text?: string }) {
  const app = useMorseApp();
  const { handlePlay } = useMorsePlaybackControls();

  useEffect(() => {
    app.setShowingText(text);
  }, [app, text]);

  return (
    <button type="button" onClick={handlePlay}>
      play
    </button>
  );
}

function renderPlayback(text = 'A') {
  return render(
    <MorseAppProvider>
      <MorsePlaybackProvider>
        <SeedAndPlay text={text} />
      </MorsePlaybackProvider>
    </MorseAppProvider>,
  );
}

describe('useMorsePlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPlay.mockClear();
    mockStopMorse.mockClear();
    mockStopAll.mockClear();
    mockEnsureNoise.mockClear();
    speakPhraseMock.mockClear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules morse audio through the shared player', async () => {
    mockPlay.mockImplementation((_text, opts) => {
      if (typeof opts === 'object' && opts?.onComplete) opts.onComplete();
    });
    renderPlayback('A');
    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      vi.advanceTimersByTime(5000);
    });
    expect(mockEnsureNoise).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
    const opts = mockPlay.mock.calls[0]?.[1];
    expect(opts?.trimLastWordSpace).toBe(false);
  });

  it('seeks to a card while playing', async () => {
    window.history.replaceState({}, '', '/');

    function SeekHarness() {
      const app = useMorseApp();
      const { handlePlay, setWordIndex } = useMorsePlaybackControls();

      useEffect(() => {
        app.setShowingText('A B C');
      }, [app]);

      return (
        <>
          <button type="button" onClick={handlePlay}>play</button>
          <button type="button" onClick={() => setWordIndex(2)}>seek</button>
          <span data-testid="index">{app.currentIndex}</span>
        </>
      );
    }

    render(
      <MorseAppProvider>
        <MorsePlaybackProvider>
          <SeekHarness />
        </MorsePlaybackProvider>
      </MorseAppProvider>,
    );

    await act(async () => {
      await Promise.resolve();
      screen.getByRole('button', { name: 'play' }).click();
    });
    await act(async () => {
      screen.getByRole('button', { name: 'seek' }).click();
    });

    expect(screen.getByTestId('index')).toHaveTextContent('2');
  });

  it('skips morse scheduling when morseDisabled is set from URL', async () => {
    window.history.replaceState({}, '', '/?morseDisabled=true');
    renderPlayback('A');
    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      vi.advanceTimersByTime(1000);
    });
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('speaks through voice buffer when voice is enabled', async () => {
    mockPlay.mockImplementation((_text, opts) => {
      if (typeof opts === 'object' && opts?.onComplete) opts.onComplete();
    });
    function VoiceHarness() {
      const app = useMorseApp();
      const { handlePlay } = useMorsePlaybackControls();
      const seeded = useRef(false);

      useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        app.setShowingText('A');
        app.setVoiceEnabled(true);
        app.setVoiceBufferMaxLength(1);
        app.setVoiceThinkingTime(0);
      }, [app]);

      return <button type="button" onClick={handlePlay}>play</button>;
    }

    render(
      <MorseAppProvider>
        <MorsePlaybackProvider>
          <VoiceHarness />
        </MorsePlaybackProvider>
      </MorseAppProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      vi.advanceTimersByTime(5000);
    });

    expect(speakPhraseMock).toHaveBeenCalled();
  });

  it('advances trail reveal between cards', async () => {
    mockPlay.mockImplementation((_text, opts) => {
      if (typeof opts === 'object' && opts?.onComplete) opts.onComplete();
    });
    function TrailHarness() {
      const app = useMorseApp();
      const { handlePlay } = useMorsePlaybackControls();
      const seeded = useRef(false);

      useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        app.setShowingText('A B');
        app.setTrailReveal(true);
        app.setTrailPreDelay(0);
        app.setTrailPostDelay(0);
        app.setCardSpace(0);
      }, [app]);

      return (
        <>
          <button type="button" onClick={handlePlay}>play</button>
          <span data-testid="trail">{app.maxRevealedTrail}</span>
        </>
      );
    }

    render(
      <MorseAppProvider>
        <MorsePlaybackProvider>
          <TrailHarness />
        </MorsePlaybackProvider>
      </MorseAppProvider>,
    );

    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
    });

    let maxTrail = -1;
    for (let i = 0; i < 30; i += 1) {
      await act(async () => { vi.runOnlyPendingTimers(); });
      maxTrail = Math.max(maxTrail, Number(screen.getByTestId('trail').textContent));
    }

    expect(mockPlay).toHaveBeenCalled();
    expect(maxTrail).toBeGreaterThanOrEqual(0);
  });

  it('loops playback when loop is enabled', async () => {
    let playCount = 0;
    mockPlay.mockImplementation((_text, opts) => {
      playCount += 1;
      if (playCount <= 2 && typeof opts === 'object' && opts?.onComplete) {
        opts.onComplete();
      }
    });

    function LoopHarness() {
      const app = useMorseApp();
      const { handlePlay, handleStop } = useMorsePlaybackControls();
      const seeded = useRef(false);

      useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        app.setShowingText('A');
        app.setTrailFinal(0);
        if (!app.loop) app.toggleLoop();
      }, [app]);

      return (
        <>
          <button type="button" onClick={handlePlay}>play</button>
          <button type="button" onClick={handleStop}>stop</button>
        </>
      );
    }

    render(
      <MorseAppProvider>
        <MorsePlaybackProvider>
          <LoopHarness />
        </MorsePlaybackProvider>
      </MorseAppProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
    });
    for (let i = 0; i < 40 && playCount < 2; i += 1) {
      await act(async () => { vi.runOnlyPendingTimers(); });
    }
    await act(async () => {
      screen.getByRole('button', { name: 'stop' }).click();
    });

    expect(playCount).toBeGreaterThanOrEqual(2);
  });
});
