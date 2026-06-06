import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../../App';

describe('FlaggedWordsAccordion', () => {
  it('renders flagged cards section in Input Options', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Input Options/i }));
    expect(screen.getByText('Flagged cards')).toBeInTheDocument();
    expect(screen.getByLabelText('Flagged Words')).toBeInTheDocument();
  });

  it('adds flagged word when card clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'CQ' }));
    fireEvent.click(screen.getByRole('button', { name: /Input Options/i }));
    expect(screen.getByLabelText('Flagged Words')).toHaveValue('{CQ|c q}');
  });
});
