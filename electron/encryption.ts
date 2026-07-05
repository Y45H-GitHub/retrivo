import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT = 'formvault-salt';

/**
 * MVP uses a hardcoded local key so the vault is usable without a master-password
 * flow yet. Values are still encrypted at rest in SQLite. A real master password /
 * OS-keychain-derived key is planned for V2 (see settings-window future work).
 */
const DEV_MASTER_KEY = 'formvault-dev-key-do-not-use-in-prod';

function deriveKey(masterKey: string): Buffer {
  return crypto.scryptSync(masterKey, SALT, 32);
}

export function encrypt(text: string, masterKey: string = DEV_MASTER_KEY): string {
  const key = deriveKey(masterKey);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string, masterKey: string = DEV_MASTER_KEY): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3 || !parts[0] || !parts[1]) {
    throw new Error('Malformed encrypted value');
  }
  const [ivHex, authTagHex, encrypted] = parts;

  const key = deriveKey(masterKey);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
