import { createHash, randomBytes } from "crypto";

/** Cryptographically random opaque token for email links. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * One-way hash for tokens we store in the database. A DB dump then cannot be
 * used to reset passwords or complete someone else's signup.
 */
export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
