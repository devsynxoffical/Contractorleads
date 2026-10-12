import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncUserInboxes } from "@/lib/inbox-sync";
import { OWNER_EMAIL, OWNER_ROLE, SUPER_ADMIN_ROLE } from "@/lib/roles";
import { bearerToken, secretsMatch } from "@/lib/rate-limit";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Prevents overlapping runs when a sync takes longer than the cron interval. */
let running = false;

function isLoopback(request: Request): boolean {
  const host = (request.headers.get("host") || "").toLowerCase();
  return host.startsWith("127.0.0.1") || host.startsWith("localhost");
}

/**
 * Background inbox sync for ALL users with connected mailboxes
 * (assigned system mailboxes, their own SMTP accounts, and platform owner/super admins).
 * Secure with CRON_SECRET (Authorization: Bearer <secret>). If CRON_SECRET is not
 * configured, only loopback (in-process scheduler) calls are accepted.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (!secretsMatch(bearerToken(request), secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!isLoopback(request)) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  if (running) {
    return NextResponse.json({ ok: true, skipped: "previous sync still running" });
  }
  running = true;

  try {
    const [systemAssigned, smtpOwners, admins] = await Promise.all([
      prisma.systemSmtpAccount.findMany({
        where: { enabled: true, assignedUserId: { not: null } },
        select: { assignedUserId: true },
        distinct: ["assignedUserId"],
      }),
      prisma.smtpAccount.findMany({
        where: { enabled: true },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { role: { in: [OWNER_ROLE, SUPER_ADMIN_ROLE] } },
            { email: OWNER_EMAIL },
          ],
        },
        select: { id: true },
      }),
    ]);

    const userIds = Array.from(
      new Set(
        [
          ...systemAssigned.map((a) => a.assignedUserId),
          ...smtpOwners.map((a) => a.userId),
          ...admins.map((a) => a.id),
        ].filter(Boolean) as string[],
      ),
    );

    let totalSynced = 0;
    const failures: { userId: string; mailbox: string; error: string }[] = [];

    for (const userId of userIds) {
      try {
        const r = await syncUserInboxes(userId, { fetchAll: false, limitPerMailbox: 25 });
        totalSynced += r.totalSynced;
        for (const res of r.results) {
          if (res.error) failures.push({ userId, mailbox: res.mailbox, error: res.error });
        }
      } catch (err) {
        failures.push({
          userId,
          mailbox: "*",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      users: userIds.length,
      totalSynced,
      failedMailboxes: failures.length,
      failures: failures.slice(0, 20),
    });
  } finally {
    running = false;
  }
}

export async function POST(request: Request) {
  return GET(request);
}
