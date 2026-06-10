import { render, screen, fireEvent } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { describe, it, expect, vi } from 'vitest';
import { WordCards } from './WordCards';
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

function renderCards() {
  return render(
    <StateProviders>
      <MorsePlaybackProvider>
        <WordCards />
      </MorsePlaybackProvider>
    </StateProviders>,
  );
}

describe('WordCards', () => {
  it('renders a card per word', () => {
    renderCards();
    expect(screen.getByRole('button', { name: 'CQ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'LICW' })).toBeInTheDocument();
  });

  it('highlights current card with btn-primary', () => {
    renderCards();
    expect(screen.getByRole('button', { name: 'CQ' })).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: 'LICW' })).toHaveClass('btn-outline-danger');
  });

  it('selects card on double-click', () => {
    renderCards();
    fireEvent.doubleClick(screen.getByRole('button', { name: 'LICW' }));
    expect(screen.getByRole('button', { name: 'LICW' })).toHaveClass('btn-danger');
  });
});
