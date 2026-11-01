import { NextResponse } from "next/server";
import { processDueCheckoutRecovery } from "@/lib/checkout-recovery";
import { bearerToken, secretsMatch } from "@/lib/rate-limit";

/**
 * Send due abandoned-checkout recovery emails (steps at 1h / 24h / 72h).
 * Secure with CRON_SECRET (Authorization: Bearer <secret>).
 * Scheduled every 15 minutes from scripts/start-railway.mjs.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  // Header only: a `?secret=` would end up in access logs and Referer headers.
  if (!secretsMatch(bearerToken(request), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const results = await processDueCheckoutRecovery(limit);
  const count = (outcome: string) => results.filter((r) => r.outcome === outcome).length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    sent: count("sent"),
    paid: count("paid"),
    stopped: count("stopped"),
    skipped: count("skipped"),
    errors: count("error"),
  });
}

export async function POST(request: Request) {
  return GET(request);
}
