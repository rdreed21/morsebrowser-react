import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';
import { MorseAppProvider } from '../../context/MorseAppContext';

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
