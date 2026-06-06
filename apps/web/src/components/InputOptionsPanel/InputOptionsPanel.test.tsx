import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsAccordion } from '../SettingsAccordion/SettingsAccordion';
import { MorseAppProvider, DEFAULT_SHOWING_TEXT } from '../../context/MorseAppContext';

function renderPanel() {
  return render(
    <MorseAppProvider>
      <SettingsAccordion />
    </MorseAppProvider>,
  );
}

function openInputOptions() {
  fireEvent.click(screen.getByRole('button', { name: /Input Options/i }));
}

describe('InputOptionsPanel', () => {
  it('renders practice text textarea when showRaw is on', () => {
    renderPanel();
    openInputOptions();
    const textarea = screen.getByRole('textbox', { name: 'Working text' });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(DEFAULT_SHOWING_TEXT);
  });

  it('has View/Hide text toggle', () => {
    renderPanel();
    openInputOptions();
    expect(screen.getByText('Hide text')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Show working text'));
    expect(screen.getByText('View text')).toBeInTheDocument();
  });

  it('clears text on Clear button', () => {
    renderPanel();
    openInputOptions();
    fireEvent.click(document.getElementById('btnClearText')!);
    expect(screen.getByRole('textbox', { name: 'Working text' })).toHaveValue('');
  });
});
