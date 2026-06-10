import { render, screen, fireEvent } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';
import { MorsePlaybackProvider } from '../../context/MorsePlaybackContext';

vi.mock('../../hooks/useMorsePlayer', () => ({
  useMorsePlayer: () => ({
    play: vi.fn(),
    stopMorse: vi.fn(),
    stopAll: vi.fn(),
    ensureNoise: vi.fn(),
    playTestTone: vi.fn(),
  }),
}));

vi.mock('@morsebrowser/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@morsebrowser/core')>();
  return {
    ...actual,
    renderMorseWav: vi.fn(async () => new ArrayBuffer(44)),
  };
});

function renderAccordion() {
  return render(
    <StateProviders>
      <MorsePlaybackProvider>
        <SettingsAccordion />
      </MorsePlaybackProvider>
    </StateProviders>,
  );
}

describe('OutputOptionsPanel', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders output controls', () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Output Options/i }));
    expect(screen.getByTitle(/Silence at start of playback/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Downloads an audio file/i)).toBeInTheDocument();
  });

  it('toggles cards visibility', () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Output Options/i }));
    fireEvent.click(screen.getByLabelText('Cards'));
    expect(screen.queryByRole('button', { name: 'CQ' })).not.toBeInTheDocument();
  });

  it('enables wav download when text is present', () => {
    renderAccordion();
    fireEvent.click(screen.getByRole('button', { name: /Output Options/i }));
    expect(screen.getByRole('button', { name: /Audio File/i })).toBeEnabled();
  });
});
