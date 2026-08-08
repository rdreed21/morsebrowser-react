import { render, screen, fireEvent, within } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { describe, it, expect, vi } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';

// RssAccordion (always rendered) is the only consumer of playback controls; stub it.
vi.mock('../../context/MorsePlaybackContext', () => ({
  useMorsePlaybackControls: () => ({ lastFullPlayTimeMs: 0, playPracticeFromText: vi.fn() }),
}));

function renderAccordion() {
  return render(
    <StateProviders>
      <SettingsAccordion />
    </StateProviders>,
  );
}

function openLessonOptions() {
  fireEvent.click(screen.getByRole('button', { name: /Lesson Options/i }));
  const panel = document.getElementById('collapselessonoptions');
  if (!panel) throw new Error('Lesson options panel missing');
  return within(panel);
}

describe('LessonOptionsPanel', () => {
  it('renders fieldsets in club order: Playback, Timing, Noise, Trail', () => {
    renderAccordion();
    const panel = openLessonOptions();
    const fieldsets = panel.getAllByRole('group');
    const legends = fieldsets.map(fs => {
      const legend = fs.querySelector('legend');
      return legend?.textContent?.trim() ?? '';
    });
    const playbackIdx = legends.findIndex(l => l === 'Playback');
    const timingIdx = legends.findIndex(l => l === 'Timing');
    const noiseIdx = legends.findIndex(l => l.includes('Noise'));
    const trailIdx = legends.findIndex(l => l === 'Trail');
    expect(playbackIdx).toBeGreaterThanOrEqual(0);
    expect(timingIdx).toBeGreaterThan(playbackIdx);
    expect(noiseIdx).toBeGreaterThan(timingIdx);
    expect(trailIdx).toBeGreaterThan(noiseIdx);
    expect(panel.getByText('Overrides')).toBeInTheDocument();
    expect(panel.getAllByText('Trail').length).toBeGreaterThan(0);
  });

  it('enables Apply when custom group has text', () => {
    renderAccordion();
    const panel = openLessonOptions();
    fireEvent.click(panel.getByRole('checkbox', { name: 'Custom Group' }));
    fireEvent.change(panel.getByLabelText('Custom group text'), { target: { value: 'REA' } });
    expect(panel.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('generates practice text on Apply with custom group', () => {
    renderAccordion();
    const panel = openLessonOptions();
    fireEvent.click(panel.getByRole('checkbox', { name: 'Custom Group' }));
    fireEvent.change(panel.getByLabelText('Custom group text'), { target: { value: 'REA' } });
    fireEvent.click(panel.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: /Input Options/i }));
    const textarea = screen.getByRole('textbox', { name: 'Working text' });
    expect((textarea as HTMLTextAreaElement).value).toMatch(/^[REA\s]+$/);
    expect((textarea as HTMLTextAreaElement).value.length).toBeGreaterThan(0);
  });
});
