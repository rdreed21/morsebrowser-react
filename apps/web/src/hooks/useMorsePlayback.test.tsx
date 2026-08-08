import { act, render, screen } from '@testing-library/react';
import { StateProviders } from '../test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect, useRef } from 'react';
import { useMorseApp } from '../context/MorseAppContext';
import { usePlaybackState } from '../context/PlaybackStateContext';
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
  speakPhrase: (cfg: unknown, cb?: () => void) => speakPhraseMock(cfg, cb),
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
    <StateProviders>
      <MorsePlaybackProvider>
        <SeedAndPlay text={text} />
      </MorsePlaybackProvider>
    </StateProviders>,
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
      const { currentIndex } = usePlaybackState();
      const { handlePlay, setWordIndex } = useMorsePlaybackControls();

      useEffect(() => {
        app.setShowingText('A B C');
      }, [app]);

      return (
        <>
          <button type="button" onClick={handlePlay}>play</button>
          <button type="button" onClick={() => setWordIndex(2)}>seek</button>
          <span data-testid="index">{currentIndex}</span>
        </>
      );
    }

    render(
      <StateProviders>
        <MorsePlaybackProvider>
          <SeekHarness />
        </MorsePlaybackProvider>
      </StateProviders>,
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
      <StateProviders>
        <MorsePlaybackProvider>
          <VoiceHarness />
        </MorsePlaybackProvider>
      </StateProviders>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      vi.advanceTimersByTime(5000);
    });

    expect(speakPhraseMock).toHaveBeenCalled();
  });

  it('plays each Speed Racer multiplier variation before advancing the card', async () => {
    mockPlay.mockImplementation(() => {});

    function SpeedRacerHarness() {
      const app = useMorseApp();
      const { currentIndex } = usePlaybackState();
      const { handlePlay } = useMorsePlaybackControls();
      const seeded = useRef(false);

      useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        app.setShowingText('A B');
        app.setCardSpace(0);
        app.setSpeedRacerEnabled(true);
        // Base charWPM is 12 → variations at 18 and 12 wpm.
        app.setSpeedRacerMultipliers('1.5, 1.0');
        app.setSpeedRacerFinalPlay(false);
      }, [app]);

      return (
        <>
          <button type="button" onClick={handlePlay}>play</button>
          <span data-testid="index">{currentIndex}</span>
        </>
      );
    }

    render(
      <StateProviders>
        <MorsePlaybackProvider>
          <SpeedRacerHarness />
        </MorsePlaybackProvider>
      </StateProviders>,
    );

    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      vi.runOnlyPendingTimers();
    });

    // First variation at 1.5x.
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(mockPlay.mock.calls[0]?.[0]).toBe('A');
    expect(mockPlay.mock.calls[0]?.[2]?.charWPM).toBe(18);
    expect(screen.getByTestId('index')).toHaveTextContent('0');

    // Inter-variation wordspace pad.
    await act(async () => {
      mockPlay.mock.calls[0]?.[1]?.onComplete?.();
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });
    expect(mockPlay).toHaveBeenCalledTimes(2);
    expect(mockPlay.mock.calls[1]?.[0]).toBe('');

    // Second variation at 1.0x, still on the same card.
    await act(async () => {
      mockPlay.mock.calls[1]?.[1]?.onComplete?.();
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });
    expect(mockPlay).toHaveBeenCalledTimes(3);
    expect(mockPlay.mock.calls[2]?.[0]).toBe('A');
    expect(mockPlay.mock.calls[2]?.[2]?.charWPM).toBe(12);
    expect(screen.getByTestId('index')).toHaveTextContent('0');

    // Card advances after the last variation.
    await act(async () => {
      mockPlay.mock.calls[2]?.[1]?.onComplete?.();
      vi.advanceTimersByTime(1000);
      vi.runOnlyPendingTimers();
    });
    expect(screen.getByTestId('index')).toHaveTextContent('1');
  });

  it('speaks Speed Racer recap before the first-multiplier replay', async () => {
    mockPlay.mockImplementation(() => {});

    function SpeedRacerSpeakHarness() {
      const app = useMorseApp();
      const { currentIndex } = usePlaybackState();
      const { handlePlay } = useMorsePlaybackControls();
      const seeded = useRef(false);

      useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        app.setShowingText('A B');
        app.setCardSpace(0);
        app.setVoiceEnabled(true);
        app.setVoiceThinkingTime(0);
        app.setVoiceAfterThinkingTime(0);
        app.setSpeedRacerEnabled(true);
        // Single 1.5x multiplier → variation and replay both at 18 wpm (base 12).
        app.setSpeedRacerMultipliers('1.5');
        app.setSpeedRacerFinalPlay(true);
        app.setSpeedRacerSpeakBeforeReplay(true);
      }, [app]);

      return (
        <>
          <button type="button" onClick={handlePlay}>play</button>
          <span data-testid="index">{currentIndex}</span>
        </>
      );
    }

    render(
      <StateProviders>
        <MorsePlaybackProvider>
          <SpeedRacerSpeakHarness />
        </MorsePlaybackProvider>
      </StateProviders>,
    );

    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      screen.getByRole('button', { name: 'play' }).click();
      vi.runOnlyPendingTimers();
    });

    // Variation play at the first multiplier speed.
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(mockPlay.mock.calls[0]?.[2]?.charWPM).toBe(18);

    // Inter-variation pad before the replay.
    await act(async () => {
      mockPlay.mock.calls[0]?.[1]?.onComplete?.();
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });
    expect(mockPlay.mock.calls[1]?.[0]).toBe('');

    // Pad completes → speak recap → replay at the first multiplier (18, not base 12).
    await act(async () => {
      mockPlay.mock.calls[1]?.[1]?.onComplete?.();
      vi.advanceTimersByTime(2000);
      vi.runOnlyPendingTimers();
    });

    expect(speakPhraseMock).toHaveBeenCalledTimes(1);
    expect(speakPhraseMock.mock.calls[0]?.[0]).toMatchObject({
      text: 'A',
      spellMode: false,
    });
    expect(mockPlay).toHaveBeenCalledTimes(3);
    expect(mockPlay.mock.calls[2]?.[0]).toBe('A');
    expect(mockPlay.mock.calls[2]?.[2]?.charWPM).toBe(18);
    expect(screen.getByTestId('index')).toHaveTextContent('0');
  });

  it('advances trail reveal between cards', async () => {
    mockPlay.mockImplementation((_text, opts) => {
      if (typeof opts === 'object' && opts?.onComplete) opts.onComplete();
    });
    function TrailHarness() {
      const app = useMorseApp();
      const { maxRevealedTrail } = usePlaybackState();
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
          <span data-testid="trail">{maxRevealedTrail}</span>
        </>
      );
    }

    render(
      <StateProviders>
        <MorsePlaybackProvider>
          <TrailHarness />
        </MorsePlaybackProvider>
      </StateProviders>,
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
      <StateProviders>
        <MorsePlaybackProvider>
          <LoopHarness />
        </MorsePlaybackProvider>
      </StateProviders>,
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
