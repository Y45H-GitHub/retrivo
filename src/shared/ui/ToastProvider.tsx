import { createContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { v4 as uuid } from 'uuid';
import { Toast } from './Toast';
import { dismissToast, pushToast, type ToastItem, type ToastVariant } from './toastQueue';

export interface ToastContextValue {
  toast: (variant: ToastVariant, message: string) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => dismissToast(prev, id));
  }, []);

  const toast = useCallback(
    (variant: ToastVariant, message: string) => {
      const item: ToastItem = { id: uuid(), variant, message, createdAt: Date.now() };
      setToasts((prev) => pushToast(prev, item));
      timers.current.set(
        item.id,
        setTimeout(() => dismiss(item.id), AUTO_DISMISS_MS)
      );
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <Toast item={item} onDismiss={() => dismiss(item.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
