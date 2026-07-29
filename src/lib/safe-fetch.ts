import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * SSRF guard for outbound requests aimed at user-supplied URLs (CRM webhooks,
 * website scraping). Without this, a customer can point us at cloud metadata
 * (169.254.169.254), localhost, or RFC1918 hosts and use the server as a proxy
 * into the private network.
 */

export class BlockedUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BlockedUrlError";
  }
}

function ipv4IsPrivate(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n))) return true;
  const [a, b] = parts;

  if (a === 0) return true; // "this" network
  if (a === 10) return true; // RFC1918
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function ipv6IsPrivate(ip: string): boolean {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, "");

  if (addr === "::" || addr === "::1") return true; // unspecified / loopback
  if (addr.startsWith("fe80")) return true; // link-local
  if (/^f[cd]/.test(addr)) return true; // unique local
  if (addr.startsWith("ff")) return true; // multicast

  // IPv4-mapped (::ffff:169.254.169.254) — evaluate the embedded IPv4.
  const mapped = addr.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsPrivate(mapped[1]);

  return false;
}

export function ipIsPrivate(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return ipv4IsPrivate(ip);
  if (version === 6) return ipv6IsPrivate(ip);
  return true;
}

/**
 * Validates scheme and resolves DNS, rejecting hosts that land on private or
 * reserved address space. Returns the resolved public IPs.
 */
export async function assertPublicUrl(
  rawUrl: string,
  opts: { allowHttp?: boolean } = {},
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new BlockedUrlError("Enter a valid URL.");
  }

  const httpAllowed = opts.allowHttp ?? process.env.NODE_ENV !== "production";
  if (url.protocol !== "https:" && !(httpAllowed && url.protocol === "http:")) {
    throw new BlockedUrlError("Webhook URLs must use https://");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");

  if (net.isIP(host)) {
    if (ipIsPrivate(host)) {
      throw new BlockedUrlError("That address is not reachable from our servers.");
    }
    return url;
  }

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new BlockedUrlError("That address is not reachable from our servers.");
  }

  let records: { address: string }[];
  try {
    records = await lookup(host, { all: true });
  } catch {
    throw new BlockedUrlError("We could not resolve that hostname.");
  }

  if (!records.length || records.some((r) => ipIsPrivate(r.address))) {
    throw new BlockedUrlError("That address is not reachable from our servers.");
  }

  return url;
}

/**
 * fetch() for user-supplied URLs. Redirects are followed manually so each hop
 * is re-validated — otherwise a public URL could 302 into the private network.
 */
export async function safeFetch(
  rawUrl: string,
  init: RequestInit & { timeoutMs?: number } = {},
  opts: { allowHttp?: boolean; maxRedirects?: number } = {},
): Promise<Response> {
  const { timeoutMs = 12_000, ...requestInit } = init;
  const maxRedirects = opts.maxRedirects ?? 3;

  let target = await assertPublicUrl(rawUrl, opts);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const response = await fetch(target, {
      ...requestInit,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      if (hop === maxRedirects) {
        throw new BlockedUrlError("Too many redirects.");
      }
      target = await assertPublicUrl(new URL(location, target).toString(), opts);
      continue;
    }

    return response;
  }

  throw new BlockedUrlError("Too many redirects.");
}

/**
 * SMTP hosts are user-controlled — resolve and reject private/reserved
 * addresses so customers cannot use the server to probe internal networks.
 */
export async function assertPublicSmtpHost(host: string): Promise<void> {
  const cleaned = host.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!cleaned) throw new BlockedUrlError("SMTP host is required.");

  if (net.isIP(cleaned)) {
    if (ipIsPrivate(cleaned)) {
      throw new BlockedUrlError("That SMTP host is not allowed.");
    }
    return;
  }

  if (
    cleaned === "localhost" ||
    cleaned.endsWith(".localhost") ||
    cleaned.endsWith(".internal") ||
    cleaned.endsWith(".local")
  ) {
    throw new BlockedUrlError("That SMTP host is not allowed.");
  }

  let records: { address: string }[];
  try {
    records = await lookup(cleaned, { all: true });
  } catch {
    throw new BlockedUrlError("We could not resolve that SMTP host.");
  }

  if (!records.length || records.some((r) => ipIsPrivate(r.address))) {
    throw new BlockedUrlError("That SMTP host is not allowed.");
  }
}
