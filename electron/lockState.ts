import { BrowserWindow, powerMonitor } from 'electron';
import { AUTO_LOCK_IDLE_SECONDS, IPC, MAX_PIN_ATTEMPTS, MIN_PIN_LENGTH, PIN_LOCKOUT_MS } from '../src/shared/constants';
import { deleteSetting, getSetting, setSetting } from './database';
import { hashPin, verifyPinHash } from './pinAuth';

type UnlockResult = { ok: boolean; reason?: 'wrong-pin' | 'locked-out'; retryAfterSeconds?: number };
type SetPinResult = { ok: boolean; reason?: 'wrong-pin' | 'too-short' };

let locked = false;
let failedAttempts = 0;
let lockedOutUntil = 0;
let idleCheckInterval: ReturnType<typeof setInterval> | null = null;

export function isPinConfigured(): boolean {
  return Boolean(getSetting('pinHash')) && Boolean(getSetting('pinSalt'));
}

function broadcastLockState(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.LOCK_STATE_CHANGED, locked);
  }
}

/** Called once at startup, after the database is ready. Starts the idle-based auto-lock check. */
export function initLockState(): void {
  locked = isPinConfigured();

  if (idleCheckInterval) clearInterval(idleCheckInterval);
  idleCheckInterval = setInterval(() => {
    if (!locked && isPinConfigured() && powerMonitor.getSystemIdleTime() >= AUTO_LOCK_IDLE_SECONDS) {
      lock();
    }
  }, 60_000);
}

export function isLocked(): boolean {
  return locked;
}

/** No-ops if no PIN is configured - locking with nothing to unlock with would brick access. */
export function lock(): void {
  if (!isPinConfigured() || locked) return;
  locked = true;
  broadcastLockState();
}

export function unlock(pin: string): UnlockResult {
  if (Date.now() < lockedOutUntil) {
    return { ok: false, reason: 'locked-out', retryAfterSeconds: Math.ceil((lockedOutUntil - Date.now()) / 1000) };
  }

  const storedHash = getSetting('pinHash');
  const storedSalt = getSetting('pinSalt');
  if (!storedHash || !storedSalt || !verifyPinHash(pin, storedHash, storedSalt)) {
    failedAttempts += 1;
    if (failedAttempts >= MAX_PIN_ATTEMPTS) {
      lockedOutUntil = Date.now() + PIN_LOCKOUT_MS;
      failedAttempts = 0;
      return { ok: false, reason: 'locked-out', retryAfterSeconds: Math.ceil(PIN_LOCKOUT_MS / 1000) };
    }
    return { ok: false, reason: 'wrong-pin' };
  }

  failedAttempts = 0;
  locked = false;
  broadcastLockState();
  return { ok: true };
}

/** currentPin is required (and checked) whenever a PIN is already configured; omit only for first-time setup. */
export function setPin(newPin: string, currentPin: string | null): SetPinResult {
  if (newPin.length < MIN_PIN_LENGTH) return { ok: false, reason: 'too-short' };

  if (isPinConfigured()) {
    const storedHash = getSetting('pinHash')!;
    const storedSalt = getSetting('pinSalt')!;
    if (!currentPin || !verifyPinHash(currentPin, storedHash, storedSalt)) return { ok: false, reason: 'wrong-pin' };
  }

  const { hash, salt } = hashPin(newPin);
  setSetting('pinHash', hash);
  setSetting('pinSalt', salt);
  failedAttempts = 0;
  lockedOutUntil = 0;
  return { ok: true };
}

export function removePin(currentPin: string): { ok: boolean; reason?: 'wrong-pin' } {
  const storedHash = getSetting('pinHash');
  const storedSalt = getSetting('pinSalt');
  if (!storedHash || !storedSalt) return { ok: true };
  if (!verifyPinHash(currentPin, storedHash, storedSalt)) return { ok: false, reason: 'wrong-pin' };

  deleteSetting('pinHash');
  deleteSetting('pinSalt');
  failedAttempts = 0;
  lockedOutUntil = 0;
  return { ok: true };
}
