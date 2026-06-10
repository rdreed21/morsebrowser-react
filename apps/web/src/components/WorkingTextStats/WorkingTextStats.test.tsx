import { render, screen } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { describe, it, expect } from 'vitest';
import { WorkingTextStats } from './WorkingTextStats';

describe('WorkingTextStats', () => {
  it('shows play time and char count', () => {
    const { container } = render(
      <StateProviders>
        <WorkingTextStats />
      </StateProviders>,
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
      <StateProviders>
        <WorkingTextStats />
      </StateProviders>,
    );
    expect(container.querySelector('.working-text-section')).toBeTruthy();
  });
});
