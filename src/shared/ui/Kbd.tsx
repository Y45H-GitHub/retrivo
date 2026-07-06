import { cn } from '../cn';

/** Keyboard-hint chip, e.g. ↵ / Esc / !pan shortcut badges. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-stroke bg-surface px-1 font-mono text-caption text-ink-muted',
        className
      )}
    >
      {children}
    </kbd>
  );
}
