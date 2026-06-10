import { render, screen, fireEvent } from '@testing-library/react';
import { StateProviders } from '../../test-utils';
import { describe, it, expect, vi } from 'vitest';
import { PageHeader } from './PageHeader';

function renderHeader() {
  return render(
    <StateProviders>
      <PageHeader />
    </StateProviders>,
  );
}

describe('PageHeader', () => {
  it('renders title and help link', () => {
    renderHeader();
    expect(screen.getByRole('heading', { name: /Morse Practice Page/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Click here for help/i })).toHaveAttribute(
      'href', '#page-help-footer',
    );
  });

  it('renders logo with site-logo class', () => {
    renderHeader();
    const logo = screen.getByAltText(/Long Island CW Club Logo/i);
    expect(logo).toHaveClass('site-logo');
    expect(logo).toHaveAttribute('id', 'logoImage');
  });

  it('toggles dark mode label on theme button click', () => {
    renderHeader();
    const btn = screen.getByRole('button', { name: /Dark mode/i });
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: /Light mode/i })).toBeInTheDocument();
  });
});
