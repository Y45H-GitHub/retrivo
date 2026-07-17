import { useEffect, useRef, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from './Button';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modal dialog: scrim + centered card, closes on Escape or scrim click, traps focus. */
export function Dialog({ title, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function getFocusable() {
      return dialog!.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    }

    const focusable = getFocusable();
    (focusable[0] ?? dialog).focus();

    function trapFocus(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    dialog.addEventListener('keydown', trapFocus);
    return () => dialog.removeEventListener('keydown', trapFocus);
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex animate-fade-in items-center justify-center bg-canvas/70 p-4 backdrop-blur-[4px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-md animate-float-in rounded-float border border-stroke bg-card shadow-elevation-3"
      >
        <div className="flex items-center justify-between border-b border-stroke-subtle px-4 py-3">
          <h2 className="text-heading text-ink">{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X weight="regular" className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
