import { useEffect, useState } from 'react';
import { ipc } from './ipc-client';

/** Tracks whether the app is currently locked, live-updated via the main process broadcast. */
export function useLockState() {
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    void ipc.getLockState().then((s) => setLocked(s.locked));
    return ipc.onLockStateChanged(setLocked);
  }, []);

  return {
    locked,
    unlock: (pin: string) => ipc.unlock(pin),
    markUnlocked: () => setLocked(false)
  };
}
