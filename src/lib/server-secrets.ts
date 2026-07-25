/**
 * Centralized secret resolution.
 *
 * Production fails closed: a missing or known-default secret would let anyone
 * forge session cookies or decrypt stored SMTP passwords, so we refuse to run
 * instead of silently accepting a public value.
 */

const KNOWN_WEAK_SECRETS = new Set([
  "leadflow-dev-secret-change-in-production",
  "contractorleads-dev-smtp-secret",
  "change-this-to-a-long-random-string-in-production",
  "secret",
  "changeme",
]);

const MIN_SECRET_LENGTH = 32;

const DEV_SESSION_SECRET = "dev-only-session-secret-not-for-production-use";
const DEV_ENCRYPTION_SECRET = "dev-only-encryption-secret-not-for-production";

function isProduction() {
  // `next build` runs with NODE_ENV=production but without runtime secrets,
  // so enforcement belongs at request time, not build time.
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  return process.env.NODE_ENV === "production";
}

function validate(
  value: string | undefined,
  envName: string,
  devFallback: string,
): string {
  const secret = value?.trim() || "";

  if (!isProduction()) {
    return secret || devFallback;
  }

  if (!secret) {
    throw new Error(
      `${envName} is not set. Generate one with \`openssl rand -base64 48\` and add it to your host environment before starting the server.`,
    );
  }
  if (KNOWN_WEAK_SECRETS.has(secret)) {
    throw new Error(
      `${envName} is set to a known default value that is public in the source history. Replace it with a new random secret.`,
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${envName} must be at least ${MIN_SECRET_LENGTH} characters. Generate one with \`openssl rand -base64 48\`.`,
    );
  }
  return secret;
}

/** Signing key for session JWTs and signed email action links. */
export function requireSessionSecret(): string {
  return validate(process.env.JWT_SECRET, "JWT_SECRET", DEV_SESSION_SECRET);
}

/** Key material for encrypting stored credentials (user SMTP passwords). */
export function requireEncryptionSecret(): string {
  const explicit = process.env.SMTP_SECRET?.trim();
  if (explicit) {
    return validate(explicit, "SMTP_SECRET", DEV_ENCRYPTION_SECRET);
  }
  // Fall back to the session secret so existing installs keep decrypting,
  // but still enforce the same production strength requirements.
  return validate(process.env.JWT_SECRET, "SMTP_SECRET", DEV_ENCRYPTION_SECRET);
}
