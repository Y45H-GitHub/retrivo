import crypto from 'crypto';

/**
 * Passphrase-based encryption for vault export/import files. Deliberately NOT safeStorage-based:
 * safeStorage keys are scoped to the local machine/OS user account, which would make an exported
 * backup undecryptable on any other device — defeating the point of "export to move to a new PC."
 * A user-chosen passphrase keeps the backup portable while still not being a plaintext PII dump.
 */
const ALGORITHM = 'aes-256-gcm';
const SCRYPT_KEYLEN = 32;

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, SCRYPT_KEYLEN);
}

export function encryptPayload(plaintext: string, passphrase: string): string {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = deriveKey(passphrase, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return [salt.toString('hex'), iv.toString('hex'), authTag.toString('hex'), encrypted].join(':');
}

export class WrongPassphraseError extends Error {
  constructor() {
    super('Incorrect passphrase, or the file is not a valid FormVault export.');
    this.name = 'WrongPassphraseError';
  }
}

export function decryptPayload(blob: string, passphrase: string): string {
  const parts = blob.split(':');
  if (parts.length !== 4) throw new WrongPassphraseError();
  const [saltHex, ivHex, authTagHex, encrypted] = parts;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(passphrase, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // Wrong passphrase manifests as an auth-tag mismatch or garbage UTF-8/JSON, not a distinct error.
    throw new WrongPassphraseError();
  }
}
