import crypto from 'crypto';

/**
 * Hashes a PIN for storage. This gates local app access (a "someone's already logged into my
 * Windows account" barrier), not vault field encryption - safeStorage/DPAPI (see encryption.ts)
 * still does that. scrypt + a random salt is overkill for a 4+ digit PIN's keyspace, but it's the
 * same primitive already used elsewhere in this codebase, so it keeps the crypto surface small.
 */
export function hashPin(pin: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 32).toString('hex');
  return { hash, salt };
}

export function verifyPinHash(pin: string, hash: string, salt: string): boolean {
  const stored = Buffer.from(hash, 'hex');
  const candidate = crypto.scryptSync(pin, salt, 32);
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}
