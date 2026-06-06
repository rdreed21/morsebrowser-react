import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';
import { MorseAppProvider } from '../../context/MorseAppContext';

function renderAccordion() {
  return render(
    <MorseAppProvider>
      <SettingsAccordion />
    </MorseAppProvider>,
  );
}

function openLessonOptions() {
  fireEvent.click(screen.getByRole('button', { name: /Lesson Options/i }));
  const panel = document.getElementById('collapselessonoptions');
  if (!panel) throw new Error('Lesson options panel missing');
  return within(panel);
}

describe('LessonOptionsPanel', () => {
  it('renders all fieldsets including noise after playback', () => {
    renderAccordion();
    const panel = openLessonOptions();
    const fieldsets = panel.getAllByRole('group');
    const legends = fieldsets.map(fs => {
      const legend = fs.querySelector('legend');
      return legend?.textContent?.trim() ?? '';
    });
    const playbackIdx = legends.findIndex(l => l === 'Playback');
    const noiseIdx = legends.findIndex(l => l.includes('Noise'));
    const timingIdx = legends.findIndex(l => l === 'Timing');
    expect(playbackIdx).toBeGreaterThanOrEqual(0);
    expect(noiseIdx).toBeGreaterThan(playbackIdx);
    expect(timingIdx).toBeGreaterThan(noiseIdx);
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
