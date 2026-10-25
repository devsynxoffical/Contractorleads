import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runMailboxWarmupCycle, applyMailboxProtectionRules } from "@/lib/warmup-engine";
import { bearerToken, secretsMatch } from "@/lib/rate-limit";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Automated Cron runner for Mailbox Warmup cycles.
 * Dispatches peer-to-peer warmup emails across all enabled mailboxes,
 * evaluates 7-day health scores, and applies auto-pause protection rules.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && !secretsMatch(bearerToken(request), secret)) {
    const url = new URL(request.url);
    const querySecret = url.searchParams.get("secret");
    if (!querySecret || !secretsMatch(querySecret, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // 1. Fetch all mailboxes where warmup is enabled
  const enabledSettings = await prisma.warmupSettings.findMany({
    where: { enabled: true },
    select: { mailboxEmail: true },
  });

  if (enabledSettings.length === 0) {
    return NextResponse.json({ ok: true, message: "No mailboxes have warmup enabled" });
  }

  // Shuffle to randomize sending order throughout the day
  const shuffled = enabledSettings
    .map((s) => s.mailboxEmail)
    .sort(() => Math.random() - 0.5);

  // Process a batch of up to 12 mailboxes per 3-minute cron cycle
  // Spacing sends evenly across 24 hours mimics authentic human activity
  const batch = shuffled.slice(0, 12);
  const results: Array<{ email: string; dispatched: boolean; error?: string }> = [];

  // Execute in small parallel chunks of 3 to stay well within 60s timeout
  const chunkSize = 3;
  for (let i = 0; i < batch.length; i += chunkSize) {
    const chunk = batch.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (email) => {
        try {
          const res = await runMailboxWarmupCycle(email);
          await applyMailboxProtectionRules(email);
          return { email, dispatched: res.dispatched, error: res.error };
        } catch (err: any) {
          return { email, dispatched: false, error: err.message || String(err) };
        }
      })
    );
    results.push(...chunkResults);
  }

  const dispatchedCount = results.filter((r) => r.dispatched).length;

  return NextResponse.json({
    ok: true,
    totalPool: enabledSettings.length,
    batchSize: batch.length,
    dispatchedCount,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
