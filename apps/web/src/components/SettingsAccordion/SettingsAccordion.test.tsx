import { fireEvent, render, screen } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { describe, it, expect, vi } from 'vitest';
import { SettingsAccordion } from './SettingsAccordion';
import { useMorseApp } from '../../context/MorseAppContext';

// RssAccordion (always rendered) is the only consumer of playback controls; stub it.
vi.mock('../../context/MorsePlaybackContext', () => ({
  useMorsePlaybackControls: () => ({ lastFullPlayTimeMs: 0, playPracticeFromText: vi.fn() }),
}));

describe('SettingsAccordion', () => {
  it('renders accordionArea with KO section order', () => {
    render(
      <StateProviders>
        <SettingsAccordion />
      </StateProviders>,
    );
    const area = document.getElementById('accordionArea');
    expect(area).toBeTruthy();
    const headers = area?.querySelectorAll('.accordion-button');
    const titles = Array.from(headers ?? []).map(h => h.textContent?.trim() ?? '');
    expect(titles[0]).toMatch(/LICW Lessons/);
    expect(titles[1]).toMatch(/Lesson Options/);
    expect(titles.filter(t => t.includes('Lesson Options')).length).toBe(1);
    expect(titles.some(t => t.includes('Input Options'))).toBe(true);
    expect(titles.some(t => t.includes('Tone Options'))).toBe(true);
    expect(titles.some(t => t.includes('Output Options'))).toBe(true);
    expect(titles.filter(t => t.includes('Voice Options')).length).toBe(1);
  });

  it('has settings-group-accordion class on items', () => {
    render(
      <StateProviders>
        <SettingsAccordion />
      </StateProviders>,
    );
    expect(document.querySelectorAll('.settings-group-accordion').length).toBeGreaterThan(4);
  });

  it('collapses non-lesson panels via React state on play', () => {
    function CollapseOnPlay() {
      const { collapseSettingsAccordions } = useMorseApp();
      return (
        <button type="button" onClick={collapseSettingsAccordions}>
          collapse
        </button>
      );
    }

    render(
      <StateProviders>
        <SettingsAccordion />
        <CollapseOnPlay />
      </StateProviders>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Lesson Options/i }));
    expect(document.getElementById('collapselessonoptions')).toHaveClass('show');

    fireEvent.click(screen.getByRole('button', { name: 'collapse' }));

    expect(document.getElementById('accordianItemLessonControls')).toHaveClass('show');
    expect(document.getElementById('collapselessonoptions')).not.toHaveClass('show');
  });

  it('closes lessons panel when auto-close is enabled', () => {
    function AutoCloseHarness() {
      const { setAutoCloseLessonAccordion, closeLessonAccordionIfAutoClosing } = useMorseApp();
      return (
        <>
          <button type="button" onClick={() => setAutoCloseLessonAccordion(true)}>
            enable auto-close
          </button>
          <button type="button" onClick={() => closeLessonAccordionIfAutoClosing()}>
            close lessons
          </button>
        </>
      );
    }

    render(
      <StateProviders>
        <SettingsAccordion />
        <AutoCloseHarness />
      </StateProviders>,
    );

    expect(document.getElementById('accordianItemLessonControls')).toHaveClass('show');
    fireEvent.click(screen.getByRole('button', { name: 'enable auto-close' }));
    fireEvent.click(screen.getByRole('button', { name: 'close lessons' }));
    expect(document.getElementById('accordianItemLessonControls')).not.toHaveClass('show');
  });
});
