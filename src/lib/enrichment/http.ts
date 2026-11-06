import type { AdapterErrorCode, AdapterOutcome } from "./types";

/**
 * Shared HTTP plumbing for provider adapters: timeouts, consistent error
 * classification and secret-free error messages.
 */

export type HttpResult =
  | { ok: true; status: number; json: unknown; headers: Headers }
  | { ok: false; status: number; json: unknown; headers: Headers }
  | { ok: false; status: 0; timeout: boolean; network: true; message: string };

export async function requestJson(
  url: string,
  init: RequestInit & { timeoutMs: number; fetchImpl?: typeof fetch },
): Promise<HttpResult> {
  const { timeoutMs, fetchImpl, ...rest } = init;
  const f = fetchImpl ?? fetch;
  try {
    const res = await f(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
    let json: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { _unparsed: text.slice(0, 300) };
      }
    }
    return res.ok
      ? { ok: true, status: res.status, json, headers: res.headers }
      : { ok: false, status: res.status, json, headers: res.headers };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const timeout = name === "TimeoutError" || name === "AbortError";
    return {
      ok: false,
      status: 0,
      timeout,
      network: true,
      message: timeout ? `No response within ${Math.round(timeoutMs / 1000)}s` : "Network error",
    };
  }
}

/** Retry-After header (seconds or HTTP date) or a JSON retry hint, in ms. */
export function retryAfterMs(headers: Headers | null, json?: unknown, fallbackMs = 60_000): number {
  const h = headers?.get("retry-after");
  if (h) {
    const secs = Number(h);
    if (Number.isFinite(secs)) return Math.max(1000, secs * 1000);
    const at = Date.parse(h);
    if (!Number.isNaN(at)) return Math.max(1000, at - Date.now());
  }
  const j = json as { retry_after?: unknown } | null;
  if (j && typeof j.retry_after === "number") return Math.max(1000, j.retry_after * 1000);
  return fallbackMs;
}

/** Remove anything that looks like a credential before storing or showing an error. */
export function sanitize(message: string): string {
  return message
    .replace(/(api[_-]?key|key|token|secret|authorization)=([^&\s]+)/gi, "$1=***")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
    .slice(0, 300);
}

export function errorOutcome(
  code: AdapterErrorCode,
  message: string,
  extra: { retryAfterMs?: number; outcomeUnknown?: boolean } = {},
): AdapterOutcome {
  return { kind: "error", code, message: sanitize(message), ...extra };
}

/** Map a failed HTTP result to an error outcome using standard status semantics. */
export function classifyHttpFailure(res: Exclude<HttpResult, { ok: true }>, vendor: string): AdapterOutcome {
  if ("network" in res) {
    // The request may have reached the vendor: never resubmit blindly.
    return errorOutcome(res.timeout ? "timeout" : "upstream", `${vendor}: ${res.message}`, { outcomeUnknown: true });
  }
  const body = res.json as Record<string, unknown> | null;
  const detail =
    (body && (typeof body.error === "string" ? body.error : typeof body.message === "string" ? body.message : "")) ||
    "";
  const msg = `${vendor} HTTP ${res.status}${detail ? `: ${detail}` : ""}`;
  if (res.status === 401 || res.status === 403) return errorOutcome("auth", msg);
  if (res.status === 402) return errorOutcome("no_credit", msg);
  if (res.status === 429) return errorOutcome("rate_limited", msg, { retryAfterMs: retryAfterMs(res.headers, body) });
  if (res.status === 400 || res.status === 404 || res.status === 422) return errorOutcome("invalid_input", msg);
  if (res.status >= 500) return errorOutcome("upstream", msg, { outcomeUnknown: true });
  return errorOutcome("upstream", msg);
}

export function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** True when the body was not JSON (HTML error page, proxy text...): never read that as "no match". */
export function unparsed(json: unknown): boolean {
  return json === null || typeof json !== "object" || "_unparsed" in (json as object);
}
