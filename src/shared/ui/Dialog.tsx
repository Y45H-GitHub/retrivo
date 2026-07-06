import { useEffect, type ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Button } from './Button';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Modal dialog: scrim + centered card, closes on Escape or scrim click. */
export function Dialog({ title, onClose, children }: DialogProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex animate-fade-in items-center justify-center bg-canvas/60 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md animate-float-in rounded-float border border-stroke bg-card shadow-elevation-3"
      >
        <div className="flex items-center justify-between border-b border-stroke-subtle px-4 py-3">
          <h2 className="text-heading text-ink">{title}</h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <XMarkIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
