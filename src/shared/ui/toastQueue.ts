export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  createdAt: number;
}

const MAX_VISIBLE = 3;

/** Appends a toast to the queue, dropping the oldest once more than MAX_VISIBLE are queued. */
export function pushToast(toasts: ToastItem[], item: ToastItem): ToastItem[] {
  const next = [...toasts, item];
  return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
}

export function dismissToast(toasts: ToastItem[], id: string): ToastItem[] {
  return toasts.filter((t) => t.id !== id);
}
