import type { ReactNode } from 'react';
import { useLockState } from '../useLockState';
import { LockScreen } from './LockScreen';

/**
 * Wraps a renderer's root: shows a PIN prompt in place of children whenever the app is locked.
 * Used by the Vault Manager and Settings windows, which are normal opaque windows. The popup
 * window is transparent/frameless with its own floating-card chrome, so it uses useLockState
 * directly inside Popup.tsx instead, to keep the lock screen inside that same card.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const { locked, unlock, markUnlocked } = useLockState();

  if (locked === null) return null;
  if (!locked) return <>{children}</>;

  return <LockScreen onUnlock={unlock} onUnlocked={markUnlocked} />;
}
