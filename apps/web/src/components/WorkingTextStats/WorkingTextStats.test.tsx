import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkingTextStats } from './WorkingTextStats';
import { MorseAppProvider } from '../../context/MorseAppContext';

describe('WorkingTextStats', () => {
  it('shows play time and char count', () => {
    const { container } = render(
      <MorseAppProvider>
        <WorkingTextStats />
      </MorseAppProvider>,
    );
    expect(screen.getByText('Play')).toBeInTheDocument();
    expect(screen.getByText('Chars')).toBeInTheDocument();
    const playValue = container.querySelector('#play-time-label + .working-text-stat-value');
    expect(playValue?.textContent).toMatch(/0:00/);
    const charValue = container.querySelector('#characters-played-label + .working-text-stat-value');
    expect(charValue?.textContent).toMatch(/0\/\d+/);
  });

  it('uses working-text-section class', () => {
    const { container } = render(
      <MorseAppProvider>
        <WorkingTextStats />
      </MorseAppProvider>,
    );
    expect(container.querySelector('.working-text-section')).toBeTruthy();
  });
});
