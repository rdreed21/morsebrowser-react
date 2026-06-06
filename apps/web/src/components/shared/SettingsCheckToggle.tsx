import { getMorseImageSrc } from '../../utils/morseImages';

interface SettingsCheckToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  icon?: string;
  ariaLabel?: string;
}

export function SettingsCheckToggle({
  id, label, checked, onChange, disabled = false, icon, ariaLabel,
}: SettingsCheckToggleProps) {
  return (
    <>
      <input
        type="checkbox"
        className="btn-check"
        id={id}
        autoComplete="off"
        aria-label={ariaLabel ?? label}
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      <label className="btn btn-outline-primary" htmlFor={id} aria-hidden="true">
        {icon && <img alt="" src={getMorseImageSrc(icon)} />}
        {icon && <span>&nbsp;</span>}
        {label}&nbsp;
        <img alt="" src={getMorseImageSrc(checked ? 'checkImage' : 'circleImage')} />
      </label>
    </>
  );
}
