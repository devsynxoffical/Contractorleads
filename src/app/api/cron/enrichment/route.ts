import { NextResponse } from "next/server";
import { bearerToken, secretsMatch } from "@/lib/rate-limit";
import { runEnrichmentTick } from "@/lib/enrichment/engine";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Background worker for enrichment jobs. Claims due rows with row locks (SKIP LOCKED), so
 * overlapping ticks or several servers never process the same row twice.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !secretsMatch(bearerToken(request), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { processed } = await runEnrichmentTick({ budgetMs: 40_000, batch: 4 });
  return NextResponse.json({ ok: true, processed });
}

export async function POST(request: Request) {
  return GET(request);
}
