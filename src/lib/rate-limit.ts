import crypto from "crypto";
import { NextResponse } from "next/server";

/**
 * In-process fixed-window rate limiter for unauthenticated endpoints.
 *
 * State is per-instance, so this is a speed bump against credential stuffing
 * and email bombing rather than a distributed guarantee. Move to Redis if the
 * app is ever scaled beyond a single instance.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > opts.limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return {
    ok: true,
    remaining: Math.max(0, opts.limit - existing.count),
    retryAfterSeconds,
  };
}

/** Read-only check — does not increment the counter. */
export function peekRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    return { ok: true, remaining: opts.limit, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count >= opts.limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }
  return {
    ok: true,
    remaining: Math.max(0, opts.limit - existing.count),
    retryAfterSeconds,
  };
}

export function authRateLimitKeys(
  request: Request,
  scope: string,
  identifier?: string,
): string[] {
  const keys = [`${scope}:ip:${clientIp(request)}`];
  if (identifier) {
    keys.push(`${scope}:id:${identifier.trim().toLowerCase()}`);
  }
  return keys;
}

/** Block only when a prior failure already exhausted the budget. */
export function checkAuthRateLimit(
  request: Request,
  scope: string,
  opts: { limit: number; windowMs: number; identifier?: string },
): { blocked: NextResponse | null; keys: string[] } {
  const keys = authRateLimitKeys(request, scope, opts.identifier);

  for (const key of keys) {
    const result = peekRateLimit(key, { limit: opts.limit, windowMs: opts.windowMs });
    if (!result.ok) {
      return { blocked: tooManyRequests(result.retryAfterSeconds), keys };
    }
  }

  return { blocked: null, keys };
}

/** Count one failed credential check toward the limit. */
export function recordAuthRateLimitFailure(
  request: Request,
  scope: string,
  opts: { limit: number; windowMs: number; identifier?: string },
) {
  for (const key of authRateLimitKeys(request, scope, opts.identifier)) {
    rateLimit(key, { limit: opts.limit, windowMs: opts.windowMs });
  }
}

/** Clears the counter, e.g. after a successful login. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}

/**
 * Best-effort client IP. Only proxy headers are available in a Next route
 * handler; Railway and most CDNs set X-Forwarded-For.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Length-independent constant-time comparison for shared secrets. */
export function secretsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Reads a shared secret from the Authorization header only. */
export function bearerToken(request: Request): string {
  const auth = request.headers.get("authorization") ?? "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

export function tooManyRequests(retryAfterSeconds: number, message?: string) {
  return NextResponse.json(
    {
      error:
        message ??
        "Too many attempts. Please wait a moment before trying again.",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

/**
 * Guards an auth endpoint by IP and (optionally) by the submitted identifier,
 * so one attacker cannot lock out or brute-force a specific account.
 */
export function guardAuthRoute(
  request: Request,
  scope: string,
  opts: { limit: number; windowMs: number; identifier?: string },
): { blocked: NextResponse | null; keys: string[] } {
  const keys = [`${scope}:ip:${clientIp(request)}`];
  if (opts.identifier) {
    keys.push(`${scope}:id:${opts.identifier.trim().toLowerCase()}`);
  }

  for (const key of keys) {
    const result = rateLimit(key, { limit: opts.limit, windowMs: opts.windowMs });
    if (!result.ok) {
      return { blocked: tooManyRequests(result.retryAfterSeconds), keys };
    }
  }

  return { blocked: null, keys };
}
