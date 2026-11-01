/**
 * All requests to the mail gateway (mailer.php on shared hosting) go through here.
 *
 * Shared hosting only allows a few PHP processes at once; when the app sent many requests
 * together (warmup + campaigns + inbox sync), the host refused or killed them and every
 * mailbox looked broken. This limits concurrent gateway requests and retries once when the
 * host signals it is busy.
 */

const MAX_CONCURRENT = Math.max(1, Number(process.env.RELAY_MAX_CONCURRENT) || 3);
let active = 0;
const waiting: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  active++;
}

function release() {
  active--;
  const next = waiting.shift();
  if (next) next();
}

/** Host-level "busy" answers: the request was not processed, so a retry is safe. */
const BUSY_STATUSES = new Set([429, 503, 508]);

function isConnectFailure(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.name === "AbortError" || e.name === "TimeoutError") return false; // may have been processed
  const code = (e as { cause?: { code?: string } }).cause?.code || "";
  return /ECONNREFUSED|ECONNRESET|EAI_AGAIN|UND_ERR_SOCKET|ENOTFOUND/.test(code) || /fetch failed/i.test(e.message);
}

export async function relayFetch(url: string, init: RequestInit): Promise<Response> {
  await acquire();
  try {
    try {
      const res = await fetch(url, init);
      if (!BUSY_STATUSES.has(res.status)) return res;
    } catch (e) {
      if (!isConnectFailure(e)) throw e;
    }
    // One retry after a short pause; a busy host usually frees a slot within seconds.
    await new Promise((r) => setTimeout(r, 2500));
    return await fetch(url, init);
  } finally {
    release();
  }
}
