import { useEffect, useRef, useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { Button } from './Button';

interface InlineConfirmProps {
  onConfirm: () => void;
  confirmLabel?: string;
  /** aria-label for the trigger button. */
  triggerAriaLabel: string;
  className?: string;
}

/** Two-step inline confirmation for destructive actions — replaces window.confirm(). */
export function InlineConfirm({ onConfirm, confirmLabel = 'Yes, delete', triggerAriaLabel, className }: InlineConfirmProps) {
  const [confirming, setConfirming] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmBtnRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    if (!confirming) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setConfirming(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [confirming]);

  if (!confirming) {
    return (
      <Button
        ref={triggerRef}
        variant="danger"
        size="icon"
        aria-label={triggerAriaLabel}
        onClick={() => setConfirming(true)}
        className={className}
      >
        <Trash weight="regular" className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 animate-fade-in" role="group" aria-label="Confirm deletion">
      <span className="whitespace-nowrap text-label text-ink-secondary">Delete?</span>
      <Button ref={confirmBtnRef} variant="destructive-confirm" size="sm" onClick={() => { setConfirming(false); onConfirm(); }}>
        {confirmLabel}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setConfirming(false);
          triggerRef.current?.focus();
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
