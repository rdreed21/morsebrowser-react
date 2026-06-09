import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';
import { MorseAppProvider } from '../../context/MorseAppContext';

// RssAccordion (always rendered) is the only consumer of playback controls; stub it.
vi.mock('../../context/MorsePlaybackContext', () => ({
  useMorsePlaybackControls: () => ({ lastFullPlayTimeMs: 0, playPracticeFromText: vi.fn() }),
}));

function renderAccordion() {
  return render(
    <MorseAppProvider>
      <SettingsAccordion />
    </MorseAppProvider>,
  );
}

describe('LessonsPicker', () => {
  it('renders LICW Lessons accordion open by default', () => {
    renderAccordion();
    expect(screen.getByText('LICW Lessons')).toBeInTheDocument();
    expect(document.getElementById('accordianItemLessonControls')).toHaveClass('show');
  });

  it('shows all five picker labels', () => {
    renderAccordion();
    expect(screen.getByText('TYPE')).toBeInTheDocument();
    expect(screen.getByText('CLASS')).toBeInTheDocument();
    expect(screen.getByText('CONTENT')).toBeInTheDocument();
    expect(screen.getByText('LESSON')).toBeInTheDocument();
    expect(screen.getByText('PRESETS')).toBeInTheDocument();
  });

  it('shows none selected badge initially', () => {
    renderAccordion();
    expect(screen.getByText('(None Currently Selected)')).toBeInTheDocument();
  });

  it('cascades class options when type is STUDENT', () => {
    renderAccordion();
    const classMenu = screen.getByRole('listbox', { name: 'CLASS' });
    fireEvent.click(screen.getByRole('button', { name: 'CLASS' }));
    expect(classMenu).toHaveClass('show');
    expect(screen.getByRole('option', { name: 'BC1' })).toBeVisible();
  });

});
