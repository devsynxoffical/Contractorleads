import { NextResponse } from "next/server";
import { processCampaignSends } from "@/lib/campaign-runner";
import { bearerToken, secretsMatch } from "@/lib/rate-limit";

/**
 * Hourly / 5-min automated processor for scheduled and active email campaigns.
 * Secure with CRON_SECRET (Authorization: Bearer <secret>) or public fallback if not set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !secretsMatch(bearerToken(request), secret)) {
    // Check search params fallback for local dev / testing
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret");
    if (!querySecret || !secretsMatch(querySecret, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await processCampaignSends({ limitPerCampaign: 40 });
  const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  return NextResponse.json({
    ok: true,
    campaignsProcessed: results.length,
    totalSent,
    totalErrors,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
