import { render, screen } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { HelpFooter } from './HelpFooter';

function renderFooter() {
  return render(
    <StateProviders>
      <HelpFooter />
    </StateProviders>,
  );
}

describe('HelpFooter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders help footer with id page-help-footer', () => {
    renderFooter();
    expect(document.getElementById('page-help-footer')).toBeTruthy();
  });

  it('lists keyboard shortcuts', () => {
    renderFooter();
    expect(screen.getByText('Play / Toggle pause')).toBeInTheDocument();
    expect(screen.getByText('Stop & rewind')).toBeInTheDocument();
  });

  it('shows version 2.0', () => {
    renderFooter();
    expect(screen.getByText('Version 2.0')).toBeInTheDocument();
  });

  it('shows KO contributor credits', () => {
    renderFooter();
    expect(screen.getByText(/KN4YRM/)).toBeInTheDocument();
    expect(screen.getByText(/KQ4NKF/)).toBeInTheDocument();
  });

  it('shows legal notice', () => {
    renderFooter();
    expect(screen.getByText(/LICW™ is a trademark/)).toBeInTheDocument();
  });

  it('shows BETA warning in development builds', () => {
    renderFooter();
    expect(screen.getByText(/BETA/)).toBeInTheDocument();
  });
});
