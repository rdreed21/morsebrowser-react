import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';
import { MorseAppProvider } from '../../context/MorseAppContext';

// RssAccordion (always rendered) is the only consumer of playback controls; stub it.
vi.mock('../../context/MorsePlaybackContext', () => ({
  useMorsePlaybackControls: () => ({ lastFullPlayTimeMs: 0, playPracticeFromText: vi.fn() }),
}));

const playTestTone = vi.fn();
const stopMorse = vi.fn();

vi.mock('../../context/MorseAudioContext', () => ({
  MorseAudioProvider: ({ children }: { children: React.ReactNode }) => children,
  useMorseAudio: () => ({
    play: vi.fn(),
    stopMorse,
    stopAll: vi.fn(),
    ensureNoise: vi.fn(),
    playTestTone,
    getCtx: vi.fn(),
  }),
}));

function renderAccordion() {
  return render(
    <MorseAppProvider>
      <SettingsAccordion />
    </MorseAppProvider>,
  );
}

describe('ToneOptionsPanel', () => {
  beforeEach(() => {
    playTestTone.mockClear();
    stopMorse.mockClear();
  });

  it('renders dit and dah frequency inputs', () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tone Options/i }));
    expect(document.getElementById('ditFrequency')).toBeInTheDocument();
    expect(document.getElementById('dahFrequency')).toBeInTheDocument();
  });

  it('plays test tone on Zero Beat', () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Tone Options/i }));
    fireEvent.click(screen.getByRole('button', { name: /Zero Beat/i }));
    expect(playTestTone).toHaveBeenCalled();
  });
});
