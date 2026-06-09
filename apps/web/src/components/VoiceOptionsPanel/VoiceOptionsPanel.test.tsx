import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';
import { MorseAppProvider } from '../../context/MorseAppContext';

// RssAccordion (always rendered) is the only consumer of playback controls; stub it.
vi.mock('../../context/MorsePlaybackContext', () => ({
  useMorsePlaybackControls: () => ({ lastFullPlayTimeMs: 0, playPracticeFromText: vi.fn() }),
}));

function openVoiceOptions() {
  fireEvent.click(screen.getByRole('button', { name: /Voice Options/i }));
  const panel = document.getElementById('collapsevoiceoptions');
  if (!panel) throw new Error('Voice options panel missing');
  return panel;
}

describe('VoiceOptionsPanel', () => {
  it('renders voice controls', () => {
    render(
      <MorseAppProvider>
        <SettingsAccordion />
      </MorseAppProvider>,
    );
    const panel = openVoiceOptions();
    expect(panel.querySelector('#btncheckvoice')).toBeInTheDocument();
    expect(panel.querySelector('#voiceThinkingTime')).toBeInTheDocument();
    expect(panel.querySelector('#selectVoiceDropdown')).toBeInTheDocument();
  });
});
