import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DropdownPicker } from './DropdownPicker';

describe('DropdownPicker', () => {
  it('opens menu on toggle click', () => {
    render(
      <DropdownPicker
        id="testPicker"
        label="TYPE"
        value=""
        placeholder="Select type"
        options={['STUDENT', 'INSTRUCTOR']}
        onSelect={() => {}}
      />,
    );
    const menu = screen.getByRole('listbox', { name: 'TYPE' });
    expect(menu).not.toHaveClass('show');

    fireEvent.click(screen.getByRole('button', { name: 'TYPE' }));
    expect(menu).toHaveClass('show');
    expect(screen.getByRole('option', { name: 'STUDENT' })).toBeVisible();
  });

  it('calls onSelect and closes menu', () => {
    const onSelect = vi.fn();
    render(
      <DropdownPicker
        id="testPicker"
        label="TYPE"
        value=""
        placeholder="Select type"
        options={['STUDENT', 'INSTRUCTOR']}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'TYPE' }));
    fireEvent.click(screen.getByRole('option', { name: 'INSTRUCTOR' }));
    expect(onSelect).toHaveBeenCalledWith('INSTRUCTOR');
    expect(screen.getByRole('listbox', { name: 'TYPE' })).not.toHaveClass('show');
  });
});
