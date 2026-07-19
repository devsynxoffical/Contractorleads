import { NextResponse } from "next/server";
import { processDueEnrollments } from "@/lib/email-automation";

/**
 * Process due Day 2/3 sequence emails for all users.
 * Secure with CRON_SECRET (Authorization: Bearer <secret> or ?secret=).
 * Call hourly from Railway cron, cron-job.org, or similar.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const url = new URL(request.url);
  const token =
    (auth.startsWith("Bearer ") ? auth.slice(7) : "") ||
    url.searchParams.get("secret") ||
    "";

  if (token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processDueEnrollments({ take: 100 });
  const sent = results.filter((r) => "sent" in r && r.sent).length;
  const errors = results.filter((r) => "error" in r && r.error).length;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    sent,
    errors,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
