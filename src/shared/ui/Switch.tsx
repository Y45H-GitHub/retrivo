import { cn } from '../cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full border disabled:opacity-40',
        checked ? 'border-accent bg-accent' : 'border-stroke bg-active'
      )}
      style={{ transition: `background-color var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out)` }}
    >
      <span
        className={cn(
          'absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full shadow-elevation-1',
          checked ? 'translate-x-[18px] bg-accent-ink' : 'translate-x-[3px] bg-ink-secondary'
        )}
        style={{ transition: `transform var(--duration-base) var(--ease-spring)` }}
      />
    </button>
  );
}
