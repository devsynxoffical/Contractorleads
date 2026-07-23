import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function lastNDays(n: number) {
  const days: string[] = [];
  const now = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export type EmailDashboardStats = {
  sent: number;
  failed: number;
  received: number;
  unreadReceived: number;
  total: number;
  sentToday: number;
  receivedToday: number;
  failedToday: number;
  smtpAccounts: number;
  sequencesEnabled: number;
  enrollmentsActive: number;
  enrollmentsPaused: number;
  enrollmentsCompleted: number;
  last7Days: Array<{
    date: string;
    sent: number;
    failed: number;
    received: number;
  }>;
};

/**
 * Aggregate LeadEmail + enrollment metrics for one agency or the whole platform.
 */
export async function getEmailDashboardStats(
  userId?: string,
): Promise<EmailDashboardStats> {
  const whereUser = userId ? { userId } : {};
  const today = startOfDay(new Date());
  const weekAgo = startOfDay(new Date());
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [
    sent,
    failed,
    received,
    unreadReceived,
    sentToday,
    receivedToday,
    failedToday,
    smtpAccounts,
    sequencesEnabled,
    enrollmentsActive,
    enrollmentsPaused,
    enrollmentsCompleted,
    weekRows,
  ] = await Promise.all([
    prisma.leadEmail.count({
      where: { ...whereUser, direction: "outbound", status: "sent" },
    }),
    prisma.leadEmail.count({
      where: { ...whereUser, direction: "outbound", status: "failed" },
    }),
    prisma.leadEmail.count({
      where: { ...whereUser, direction: "inbound", status: "received" },
    }),
    prisma.leadEmail.count({
      where: {
        ...whereUser,
        direction: "inbound",
        status: "received",
        readAt: null,
      },
    }),
    prisma.leadEmail.count({
      where: {
        ...whereUser,
        direction: "outbound",
        status: "sent",
        createdAt: { gte: today },
      },
    }),
    prisma.leadEmail.count({
      where: {
        ...whereUser,
        direction: "inbound",
        status: "received",
        createdAt: { gte: today },
      },
    }),
    prisma.leadEmail.count({
      where: {
        ...whereUser,
        direction: "outbound",
        status: "failed",
        createdAt: { gte: today },
      },
    }),
    prisma.smtpAccount.count({
      where: userId ? { userId, enabled: true } : { enabled: true },
    }),
    prisma.emailSequence.count({
      where: userId ? { userId, enabled: true } : { enabled: true },
    }),
    prisma.emailEnrollment.count({
      where: { ...whereUser, status: "active" },
    }),
    prisma.emailEnrollment.count({
      where: { ...whereUser, status: "paused" },
    }),
    prisma.emailEnrollment.count({
      where: { ...whereUser, status: "completed" },
    }),
    prisma.leadEmail.findMany({
      where: { ...whereUser, createdAt: { gte: weekAgo } },
      select: { direction: true, status: true, createdAt: true },
    }),
  ]);

  const bucket = new Map<
    string,
    { sent: number; failed: number; received: number }
  >();
  for (const day of lastNDays(7)) {
    bucket.set(day, { sent: 0, failed: 0, received: 0 });
  }
  for (const row of weekRows) {
    const key = startOfDay(row.createdAt).toISOString().slice(0, 10);
    const b = bucket.get(key);
    if (!b) continue;
    if (row.direction === "inbound" && row.status === "received") b.received += 1;
    else if (row.direction === "outbound" && row.status === "sent") b.sent += 1;
    else if (row.direction === "outbound" && row.status === "failed")
      b.failed += 1;
  }

  return {
    sent,
    failed,
    received,
    unreadReceived,
    total: sent + failed + received,
    sentToday,
    receivedToday,
    failedToday,
    smtpAccounts,
    sequencesEnabled,
    enrollmentsActive,
    enrollmentsPaused,
    enrollmentsCompleted,
    last7Days: lastNDays(7).map((date) => ({
      date,
      ...(bucket.get(date) ?? { sent: 0, failed: 0, received: 0 }),
    })),
  };
}
