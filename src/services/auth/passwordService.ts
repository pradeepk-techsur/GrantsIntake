import bcrypt from 'bcrypt';

const WORK_FACTOR = 12;

/**
 * Hash a plaintext password using bcrypt with work factor 12.
 * Never log the plaintext password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, WORK_FACTOR);
}

/**
 * Compare a plaintext password against a stored hash.
 * Uses bcrypt's timing-safe comparison internally.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
