import { act, render } from '@testing-library/react';
import { StateProviders } from '../test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMorseApp } from '../context/MorseAppContext';
import { useMorseShortcutKeys } from './useMorseShortcutKeys';
import type { MorsePlaybackHandlers } from './useMorsePlayback';

function makePlayback(overrides: Partial<MorsePlaybackHandlers> = {}): MorsePlaybackHandlers {
  return {
    handlePlay: vi.fn(),
    handlePause: vi.fn(),
    handleStop: vi.fn(),
    togglePlayback: vi.fn(),
    toggleLoop: vi.fn(),
    incrementIndex: vi.fn(),
    decrementIndex: vi.fn(),
    fullRewind: vi.fn(),
    setWordIndex: vi.fn(),
    lastFullPlayTimeMs: 0,
    playPracticeFromText: vi.fn(),
    speakVoiceBuffer: vi.fn(),
    ...overrides,
  };
}

function pressKey(key: string) {
  document.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true }));
}

function mountShortcutHarness(playback: MorsePlaybackHandlers, onAnnounce: (msg: string) => void) {
  function Harness() {
    const app = useMorseApp();
    vi.spyOn(app, 'announceAccessibility').mockImplementation(onAnnounce);
    useMorseShortcutKeys(playback);
    return null;
  }

  render(
    <StateProviders>
      <Harness />
    </StateProviders>,
  );
}

describe('useMorseShortcutKeys', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('announces card visibility after toggle, not before', async () => {
    const announcements: string[] = [];
    mountShortcutHarness(makePlayback(), (msg) => announcements.push(msg));

    pressKey('c');
    expect(announcements[0]).toBe('Cards hidden');

    await act(async () => { await Promise.resolve(); });
    pressKey('c');
    expect(announcements[1]).toBe('Cards revealed');
  });

  it('announces shuffle state after toggle', async () => {
    const announcements: string[] = [];
    mountShortcutHarness(makePlayback(), (msg) => announcements.push(msg));

    pressKey('/');
    expect(announcements[0]).toBe('Shuffled');

    await act(async () => { await Promise.resolve(); });
    pressKey('/');
    expect(announcements[1]).toBe('Unshuffled');
  });

  it('announces loop state when enabling loop', () => {
    const announcements: string[] = [];
    mountShortcutHarness(makePlayback(), (msg) => announcements.push(msg));

    pressKey('l');
    expect(announcements[0]).toBe('Looping');
  });
});
