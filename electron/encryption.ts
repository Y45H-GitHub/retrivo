import crypto from 'crypto';
import { safeStorage } from 'electron';

/**
 * Values are encrypted at rest using Electron's safeStorage API, which is backed by the OS
 * credential store (DPAPI on Windows) — the key never lives in the app itself and is scoped to
 * the local machine/user account, unlike the hardcoded key this replaced.
 */
const NEW_FORMAT_PREFIX = 'v2:';

// --- Legacy format (pre-safeStorage MVP build) — kept only so existing installs can still
// decrypt data written before this migration. Never used for new writes.
const LEGACY_ALGORITHM = 'aes-256-gcm';
const LEGACY_SALT = 'formvault-salt';
const LEGACY_DEV_KEY = 'formvault-dev-key-do-not-use-in-prod';

function legacyDeriveKey(masterKey: string): Buffer {
  return crypto.scryptSync(masterKey, LEGACY_SALT, 32);
}

function legacyDecrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3 || !parts[0] || !parts[1]) {
    throw new Error('Malformed encrypted value');
  }
  const [ivHex, authTagHex, encrypted] = parts;

  const key = legacyDeriveKey(LEGACY_DEV_KEY);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function encrypt(text: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level encryption is not available on this machine — cannot store data securely.');
  }
  const encrypted = safeStorage.encryptString(text);
  return NEW_FORMAT_PREFIX + encrypted.toString('base64');
}

export function decrypt(encryptedText: string): string {
  if (encryptedText.startsWith(NEW_FORMAT_PREFIX)) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('OS-level encryption is not available on this machine — cannot read stored data.');
    }
    const buffer = Buffer.from(encryptedText.slice(NEW_FORMAT_PREFIX.length), 'base64');
    return safeStorage.decryptString(buffer);
  }
  return legacyDecrypt(encryptedText);
}
