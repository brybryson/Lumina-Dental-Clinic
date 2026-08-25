import crypto from 'crypto';

/**
 * Secure password hashing using Node.js built-in crypto (PBKDF2 with SHA-512 and salt).
 * Output format: pbkdf2$iterations$salt$hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash) return false;

  // Support legacy or fallback check
  if (!storedHash.startsWith('pbkdf2$')) {
    // If it's old plain text during transition, compare directly
    return password === storedHash;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;

  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const originalHash = parts[3];

  const derivedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derivedHash), Buffer.from(originalHash));
}
