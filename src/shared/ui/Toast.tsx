import { useState } from 'react';
import { CheckCircle, XCircle, Info, X } from '@phosphor-icons/react';
import { cn } from '../cn';
import type { ToastItem } from './toastQueue';

const VARIANT_ICON = {
  success: { Icon: CheckCircle, className: 'text-success' },
  error: { Icon: XCircle, className: 'text-danger' },
  info: { Icon: Info, className: 'text-ink-muted' }
} as const;

const VARIANT_BORDER = {
  success: 'border-success/20',
  error: 'border-danger/20',
  info: 'border-stroke'
} as const;

interface ToastProps {
  item: ToastItem;
  onDismiss: () => void;
}

export function Toast({ item, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const { Icon, className: iconClassName } = VARIANT_ICON[item.variant];

  function handleDismiss() {
    setExiting(true);
    setTimeout(onDismiss, 120);
  }

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 rounded-card border bg-card px-3.5 py-2.5 text-body shadow-elevation-2',
        exiting ? 'animate-toast-out' : 'animate-toast-in',
        VARIANT_BORDER[item.variant]
      )}
    >
      <Icon weight="bold" className={cn('h-4 w-4 shrink-0', iconClassName)} />
      <span className="flex-1 text-ink">{item.message}</span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-control p-0.5 text-ink-muted transition-colors duration-fast hover:bg-hover hover:text-ink"
      >
        <X weight="bold" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
