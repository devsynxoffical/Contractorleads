import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculate7DayHealthScore, calculateRampTarget } from "@/lib/warmup-engine";
import { userCanAccessMailbox } from "@/lib/mailbox-access";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const dayKey = (d: Date) => d.toISOString().split("T")[0];

/**
 * Per-mailbox history for the analytics drawer. Every number comes from logged sends:
 * days without activity are zero, never filled with sample data.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").toLowerCase().trim();
  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "30", 10) || 30));

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!(await userCanAccessMailbox(user, email))) {
    return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [healthReport, settings, warmupSent, warmupReceived, campaignLogs, dailyStats] = await Promise.all([
    calculate7DayHealthScore(email),
    prisma.warmupSettings.findUnique({ where: { mailboxEmail: email } }),
    prisma.warmupMessage.findMany({ where: { fromEmail: email, sentAt: { gte: since } }, select: { sentAt: true } }),
    prisma.warmupMessage.findMany({ where: { toEmail: email, sentAt: { gte: since } }, select: { sentAt: true } }),
    prisma.campaignLog.findMany({
      where: { fromEmail: { equals: email, mode: "insensitive" }, sentAt: { gte: since } },
      select: { sentAt: true, status: true, bouncedAt: true },
    }),
    prisma.mailboxDailyStat.findMany({
      where: { mailboxEmail: email, date: { gte: dayKey(since) } },
      select: { date: true, sendFailures: true },
    }),
  ]);

  type Point = {
    date: string;
    warmupSent: number;
    warmupReceived: number;
    campaignSent: number;
    failed: number;
    bounced: number;
  };
  const byDate = new Map<string, Point>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const k = dayKey(d);
    byDate.set(k, { date: k, warmupSent: 0, warmupReceived: 0, campaignSent: 0, failed: 0, bounced: 0 });
  }
  for (const m of warmupSent) {
    const p = byDate.get(dayKey(m.sentAt));
    if (p) p.warmupSent++;
  }
  for (const m of warmupReceived) {
    const p = byDate.get(dayKey(m.sentAt));
    if (p) p.warmupReceived++;
  }
  const campaignFailedByDay = new Map<string, number>();
  for (const l of campaignLogs) {
    const k = dayKey(l.sentAt);
    const p = byDate.get(k);
    if (!p) continue;
    if (l.status === "failed") campaignFailedByDay.set(k, (campaignFailedByDay.get(k) || 0) + 1);
    else if (l.status === "bounced" || l.bouncedAt) p.bounced++;
    else p.campaignSent++;
  }
  for (const s of dailyStats) {
    const p = byDate.get(s.date);
    // Relay failures are recorded per day; campaign failures are also in the campaign log.
    if (p) p.failed = Math.max(s.sendFailures, campaignFailedByDay.get(s.date) || 0);
  }
  for (const [k, n] of campaignFailedByDay) {
    const p = byDate.get(k);
    if (p && p.failed < n) p.failed = n;
  }

  const startedAt = settings ? new Date(settings.startedAt) : null;
  const ramp = startedAt
    ? calculateRampTarget(startedAt, {
        startVolume: settings?.startVolume,
        increment: settings?.dailyIncrement,
        maxPerDay: settings?.maxDailyWarmup,
      })
    : null;

  return NextResponse.json({
    ok: true,
    email,
    healthReport,
    chartData: Array.from(byDate.values()),
    ramp: ramp
      ? {
          ...ramp,
          startVolume: settings?.startVolume ?? 3,
          dailyIncrement: settings?.dailyIncrement ?? 2,
          maxDailyWarmup: settings?.maxDailyWarmup ?? 25,
          enabled: settings?.enabled ?? true,
        }
      : null,
    lastSend: settings
      ? {
          okAt: settings.lastSendOkAt?.toISOString() ?? null,
          errorAt: settings.lastSendErrorAt?.toISOString() ?? null,
          error: settings.lastSendError ?? null,
          consecutiveFailures: settings.consecutiveSendFailures,
        }
      : null,
  });
}
