import type { ReactNode } from 'react';
import { useMorseApp } from '../../context/MorseAppContext';
import type { SettingsAccordionId } from '../../utils/settingsAccordion';

interface SettingsAccordionItemProps {
  panelId: SettingsAccordionId;
  headingId: string;
  buttonId?: string;
  buttonClassName?: string;
  bodyClassName?: string;
  title: ReactNode;
  children: ReactNode;
  onBeforeOpen?: () => void;
}

/** Bootstrap accordion section controlled by React state (no data-bs-toggle). */
export function SettingsAccordionItem({
  panelId,
  headingId,
  buttonId,
  buttonClassName = 'accordion-button',
  bodyClassName,
  title,
  children,
  onBeforeOpen,
}: SettingsAccordionItemProps) {
  const { isSettingsAccordionOpen, toggleSettingsAccordion } = useMorseApp();
  const open = isSettingsAccordionOpen(panelId);

  const handleToggle = () => {
    if (!open) onBeforeOpen?.();
    toggleSettingsAccordion(panelId);
  };

  return (
    <div className="accordion-item settings-group-accordion">
      <h2 className="accordion-header" id={headingId}>
        <button
          id={buttonId}
          type="button"
          className={`${buttonClassName}${open ? '' : ' collapsed'}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={handleToggle}
        >
          {title}
        </button>
      </h2>
      <div
        id={panelId}
        className={`accordion-collapse collapse${open ? ' show' : ''}`}
        aria-labelledby={headingId}
      >
        <div className={bodyClassName ? `accordion-body ${bodyClassName}` : 'accordion-body'}>
          {children}
        </div>
      </div>
    </div>
  );
}
