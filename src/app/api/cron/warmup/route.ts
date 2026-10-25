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

  const mailboxesToWarm = enabledSettings.map((s) => s.mailboxEmail);
  const results: Array<{ email: string; dispatched: boolean; error?: string }> = [];

  for (const email of mailboxesToWarm) {
    try {
      const res = await runMailboxWarmupCycle(email);
      results.push({ email, dispatched: res.dispatched, error: res.error });
      await applyMailboxProtectionRules(email);
    } catch (err: any) {
      results.push({ email, dispatched: false, error: err.message || String(err) });
    }
  }

  const dispatchedCount = results.filter((r) => r.dispatched).length;

  return NextResponse.json({
    ok: true,
    totalEligible: mailboxesToWarm.length,
    dispatchedCount,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
