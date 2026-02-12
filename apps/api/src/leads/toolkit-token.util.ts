import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
const HASH_ALGORITHM = "sha256";

/**
 * Generate a cryptographically secure random token.
 * Raw token is never stored; only the hash is persisted.
 */
export function generateToolkitToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Hash a token for storage. Raw token must never be stored.
 */
export function hashToolkitToken(token: string): string {
  return createHash(HASH_ALGORITHM).update(token, "utf8").digest("hex");
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
