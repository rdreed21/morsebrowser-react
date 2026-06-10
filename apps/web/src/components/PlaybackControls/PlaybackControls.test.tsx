import { render, screen, fireEvent } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaybackControls } from './PlaybackControls';
import { MorsePlaybackProvider } from '../../context/MorsePlaybackContext';

function renderControls() {
  return render(
    <StateProviders>
      <MorsePlaybackProvider>
        <PlaybackControls />
      </MorsePlaybackProvider>
    </StateProviders>,
  );
}

describe('PlaybackControls', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders play, pause, stop buttons', () => {
    renderControls();
    expect(screen.getByRole('button', { name: /Play/i })).toHaveClass('btn-success');
    expect(screen.getByRole('button', { name: /Pause/i })).toHaveClass('btn-info');
    expect(screen.getByRole('button', { name: /Stop/i })).toHaveClass('btn-danger');
  });

  it('renders shuffle button', () => {
    renderControls();
    expect(screen.getByRole('button', { name: /Shuffle/i })).toBeInTheDocument();
  });

  it('toggles reveal checkbox label', () => {
    renderControls();
    const reveal = screen.getByLabelText(/Hide cards/i);
    fireEvent.click(reveal);
    expect(reveal).not.toBeChecked();
  });

  it('renders enabled loop button', () => {
    renderControls();
    const loopBtn = screen.getByRole('button', { name: /Loop Off/i });
    expect(loopBtn).not.toBeDisabled();
    fireEvent.click(loopBtn);
    expect(screen.getByRole('button', { name: /Loop Shuffle/i })).toBeInTheDocument();
  });

  it('shows Voice Recap when Arm Recap and voice are enabled', () => {
    renderControls();
    expect(screen.queryByRole('button', { name: /Voice Recap/i })).not.toBeInTheDocument();
  });
});
