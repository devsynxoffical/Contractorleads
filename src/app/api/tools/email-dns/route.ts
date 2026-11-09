import { promises as dns } from "node:dns";
import { NextResponse } from "next/server";
import { checkDomainDns } from "@/lib/dns-checker";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Public, free SPF / DKIM / DMARC / MX check for one domain. DNS lookups only; rate-limited per IP. */
export async function POST(request: Request) {
  const limit = rateLimit(`tool-email-dns:${clientIp(request)}`, { limit: 10, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json({ error: `Too many checks. Try again in ${limit.retryAfterSeconds} seconds.` }, { status: 429 });
  }
  const body = (await request.json().catch(() => ({}))) as { domain?: unknown };
  const raw = typeof body.domain === "string" ? body.domain : "";
  const domain = raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^[^@]*@/, "")
    .split(/[/?#:]/)[0]
    .replace(/^www\./, "");
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    return NextResponse.json({ error: "Enter a domain like yourcompany.com or an email address." }, { status: 400 });
  }
  // Make sure the domain exists before reporting "missing" records: a typo or a DNS outage
  // would otherwise show every record as missing.
  const probes = await Promise.allSettled([dns.resolveNs(domain), dns.resolveMx(domain), dns.resolve4(domain), dns.resolveTxt(domain)]);
  if (probes.every((p) => p.status === "rejected")) {
    const codes = probes.map((p) => (p.status === "rejected" ? (p.reason as { code?: string })?.code : "")).filter(Boolean);
    const notFound = codes.every((c) => c === "ENOTFOUND" || c === "ENODATA" || c === "NXDOMAIN");
    return NextResponse.json(
      {
        error: notFound
          ? `We couldn't find ${domain} in DNS. Check the spelling, or use the domain you send email from.`
          : "DNS lookups are not responding right now. Try again in a minute.",
      },
      { status: notFound ? 422 : 503 },
    );
  }
  const report = await checkDomainDns(domain);
  return NextResponse.json({ report });
}
