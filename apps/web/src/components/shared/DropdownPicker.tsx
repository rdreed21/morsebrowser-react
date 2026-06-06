import { useEffect, useRef, useState } from 'react';

interface DropdownPickerProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onSelect: (value: string) => void;
}

export function DropdownPicker({
  id, label, value, placeholder, options, disabled = false, onSelect,
}: DropdownPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const display = value || placeholder;

  return (
    <div className="col-6 col-md-4 col-lg lessons-picker-col">
      <span className="lessons-picker-label" id={`${id}Label`}>{label}</span>
      <div
        ref={ref}
        className={`dropdown lessons-picker-dropdown${open ? ' show' : ''}`}
      >
        <button
          type="button"
          className="btn btn-outline-primary dropdown-toggle w-100"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-labelledby={`${id}Label`}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setOpen(prev => !prev);
          }}
        >
          {display}
        </button>
        <ul
          className={`dropdown-menu w-100${open ? ' show' : ''}`}
          role="listbox"
          aria-label={label}
        >
          {options.map(opt => (
            <li key={opt} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt === value}
                className={`dropdown-item${opt === value ? ' active' : ''}`}
                onClick={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
