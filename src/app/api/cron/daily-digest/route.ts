import { NextResponse } from "next/server";
import { processDueDailyDigests } from "@/lib/services/daily-digest";
import { bearerToken, secretsMatch } from "@/lib/rate-limit";

/**
 * Morning daily digest: generate + email fresh verified leads for enabled
 * subscriptions. Secure with CRON_SECRET (Authorization: Bearer <secret>).
 *
 * Schedule hourly (e.g. Railway cron / cron-job.org). Each subscription sends
 * once per local day when local hour is in the morning window (7–9).
 */
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  if (!secretsMatch(bearerToken(request), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const take = Math.min(20, Math.max(1, Number(url.searchParams.get("take")) || 8));
  const force = url.searchParams.get("force") === "1";

  const results = await processDueDailyDigests({ take, force });
  const sent = results.filter((r) => r.status === "sent").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    sent,
    skipped,
    failed,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
