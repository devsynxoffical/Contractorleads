import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ADMIN_STAFF_ROLES } from "@/lib/roles";

/**
 * Super-admin activity monitor.
 *
 * Everything here is read from the tables the product writes to when a user acts, not
 * from a separate log, so the numbers match what actually happened:
 * - LeadEmail: one-to-one emails, sequence emails and inbound replies
 * - CampaignLog: campaign sends (campaign sends are not also written to LeadEmail)
 * - CampaignProspect.repliedAt: campaign replies
 * - LeadSms, Search, Export, CreditLedger, ActivityLog (sign-ins, AI, admin actions)
 */

export type ActivityPeriod = "today" | "7d" | "30d" | "90d" | "all";

export const ACTIVITY_PERIODS: Array<{ id: ActivityPeriod; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

export function parsePeriod(raw: string | null | undefined): ActivityPeriod {
  return ACTIVITY_PERIODS.some((p) => p.id === raw) ? (raw as ActivityPeriod) : "30d";
}

export function periodStart(period: ActivityPeriod): Date {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "all") return new Date(0);
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export type UserActivityStats = {
  emailsSent: number;
  emailsFailed: number;
  campaignEmails: number;
  directEmails: number;
  opens: number;
  replies: number;
  smsSent: number;
  smsFailed: number;
  smsReceived: number;
  searches: number;
  leadsFound: number;
  exports: number;
  leadsExported: number;
  creditsUsed: number;
  signIns: number;
};

export function emptyStats(): UserActivityStats {
  return {
    emailsSent: 0,
    emailsFailed: 0,
    campaignEmails: 0,
    directEmails: 0,
    opens: 0,
    replies: 0,
    smsSent: 0,
    smsFailed: 0,
    smsReceived: 0,
    searches: 0,
    leadsFound: 0,
    exports: 0,
    leadsExported: 0,
    creditsUsed: 0,
    signIns: 0,
  };
}

function hasActivity(s: UserActivityStats) {
  return (
    s.emailsSent + s.emailsFailed + s.replies + s.smsSent + s.smsFailed + s.smsReceived +
      s.searches + s.exports + s.creditsUsed + s.signIns >
    0
  );
}

function exportedCount(leadIds: string) {
  try {
    const parsed = JSON.parse(leadIds);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return leadIds ? leadIds.split(",").filter(Boolean).length : 0;
  }
}

/** Per-user counters for the period. Pass userId to compute one user only. */
export async function computeActivityStats(
  since: Date,
  userId?: string,
): Promise<Map<string, UserActivityStats>> {
  const userWhere = userId ? { userId } : {};
  const userSql = userId ? Prisma.sql`AND c."userId" = ${userId}` : Prisma.empty;

  const [emailGroups, emailOpens, campaignRows, campaignReplies, smsGroups, searchGroups, exportRows, creditGroups, signInGroups] =
    await Promise.all([
      prisma.leadEmail.groupBy({
        by: ["userId", "direction", "status"],
        where: { ...userWhere, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.leadEmail.groupBy({
        by: ["userId"],
        where: { ...userWhere, direction: "outbound", openedAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.$queryRaw<Array<{ userId: string; sent: bigint; failed: bigint; opened: bigint }>>`
        SELECT c."userId" AS "userId",
               COUNT(*) FILTER (WHERE l.status <> 'failed') AS sent,
               COUNT(*) FILTER (WHERE l.status = 'failed') AS failed,
               COUNT(*) FILTER (WHERE l."openedAt" IS NOT NULL) AS opened
        FROM "CampaignLog" l JOIN "Campaign" c ON c.id = l."campaignId"
        WHERE l."sentAt" >= ${since} ${userSql}
        GROUP BY c."userId"`,
      prisma.$queryRaw<Array<{ userId: string; replies: bigint }>>`
        SELECT c."userId" AS "userId", COUNT(*) AS replies
        FROM "CampaignProspect" p JOIN "Campaign" c ON c.id = p."campaignId"
        WHERE p."repliedAt" >= ${since} ${userSql}
        GROUP BY c."userId"`,
      prisma.leadSms.groupBy({
        by: ["userId", "direction", "status"],
        where: { ...userWhere, createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.search.groupBy({
        by: ["userId"],
        where: { ...userWhere, createdAt: { gte: since } },
        _count: { _all: true },
        _sum: { resultCount: true },
      }),
      prisma.export.findMany({
        where: { ...userWhere, createdAt: { gte: since } },
        select: { userId: true, leadIds: true },
      }),
      prisma.creditLedger.groupBy({
        by: ["userId"],
        where: { ...userWhere, createdAt: { gte: since }, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      prisma.activityLog.groupBy({
        by: ["userId"],
        where: { ...userWhere, createdAt: { gte: since }, type: "login" },
        _count: { _all: true },
      }),
    ]);

  const map = new Map<string, UserActivityStats>();
  const get = (id: string) => {
    let s = map.get(id);
    if (!s) {
      s = emptyStats();
      map.set(id, s);
    }
    return s;
  };

  for (const g of emailGroups) {
    const s = get(g.userId);
    const n = g._count._all;
    if (g.direction === "inbound") s.replies += n;
    else if (g.status === "failed") s.emailsFailed += n;
    else {
      s.emailsSent += n;
      s.directEmails += n;
    }
  }
  for (const g of emailOpens) get(g.userId).opens += g._count._all;
  for (const r of campaignRows) {
    const s = get(r.userId);
    s.emailsSent += Number(r.sent);
    s.campaignEmails += Number(r.sent);
    s.emailsFailed += Number(r.failed);
    s.opens += Number(r.opened);
  }
  for (const r of campaignReplies) get(r.userId).replies += Number(r.replies);
  for (const g of smsGroups) {
    const s = get(g.userId);
    const n = g._count._all;
    if (g.direction === "inbound") s.smsReceived += n;
    else if (g.status === "failed") s.smsFailed += n;
    else s.smsSent += n;
  }
  for (const g of searchGroups) {
    const s = get(g.userId);
    s.searches += g._count._all;
    s.leadsFound += g._sum.resultCount ?? 0;
  }
  for (const e of exportRows) {
    const s = get(e.userId);
    s.exports += 1;
    s.leadsExported += exportedCount(e.leadIds);
  }
  for (const g of creditGroups) {
    get(g.userId).creditsUsed = Math.round(Math.abs(g._sum.amount ?? 0) * 100) / 100;
  }
  for (const g of signInGroups) get(g.userId).signIns += g._count._all;

  return map;
}

/** Latest time each user did anything (all time, not limited to the period). */
async function lastActiveByUser(userIds?: string[]): Promise<Map<string, Date>> {
  const where = userIds ? { userId: { in: userIds } } : {};
  const idSql = userIds?.length
    ? Prisma.sql`WHERE c."userId" IN (${Prisma.join(userIds)})`
    : Prisma.empty;
  const [a, e, s, x, campaign] = await Promise.all([
    prisma.activityLog.groupBy({ by: ["userId"], where, _max: { createdAt: true } }),
    prisma.leadEmail.groupBy({ by: ["userId"], where: { ...where, direction: "outbound" }, _max: { createdAt: true } }),
    prisma.search.groupBy({ by: ["userId"], where, _max: { createdAt: true } }),
    prisma.export.groupBy({ by: ["userId"], where, _max: { createdAt: true } }),
    userIds && userIds.length === 0
      ? Promise.resolve([] as Array<{ userId: string; last: Date | null }>)
      : prisma.$queryRaw<Array<{ userId: string; last: Date | null }>>`
          SELECT c."userId" AS "userId", MAX(l."sentAt") AS last
          FROM "CampaignLog" l JOIN "Campaign" c ON c.id = l."campaignId"
          ${idSql}
          GROUP BY c."userId"`,
  ]);
  const map = new Map<string, Date>();
  const bump = (id: string, d: Date | null | undefined) => {
    if (!d) return;
    const cur = map.get(id);
    if (!cur || d > cur) map.set(id, d);
  };
  for (const g of a) bump(g.userId, g._max.createdAt);
  for (const g of e) bump(g.userId, g._max.createdAt);
  for (const g of s) bump(g.userId, g._max.createdAt);
  for (const g of x) bump(g.userId, g._max.createdAt);
  for (const r of campaign) bump(r.userId, r.last ? new Date(r.last) : null);
  return map;
}

export type ActivitySort = keyof UserActivityStats | "lastActive";

const SORT_KEYS: ActivitySort[] = [
  "emailsSent",
  "emailsFailed",
  "opens",
  "replies",
  "smsSent",
  "searches",
  "leadsFound",
  "exports",
  "creditsUsed",
  "signIns",
  "lastActive",
];

export function parseSort(raw: string | null | undefined): ActivitySort {
  return SORT_KEYS.includes(raw as ActivitySort) ? (raw as ActivitySort) : "emailsSent";
}

export async function getUserActivityLeaderboard(opts: {
  period: ActivityPeriod;
  q?: string;
  sort?: ActivitySort;
  onlyActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const since = periodStart(opts.period);
  const sort = opts.sort ?? "emailsSent";
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, opts.pageSize ?? 50));
  const q = opts.q?.trim();

  const users = await prisma.user.findMany({
    where: {
      role: { notIn: [...ADMIN_STAFF_ROLES] },
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { companyName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      plan: true,
      isActive: true,
      creditsRemaining: true,
      messagingAddonStatus: true,
      createdAt: true,
    },
  });

  const [stats, lastActive] = await Promise.all([computeActivityStats(since), lastActiveByUser()]);

  const totals = emptyStats();
  const rows = users.map((u) => {
    const s = stats.get(u.id) ?? emptyStats();
    for (const k of Object.keys(totals) as Array<keyof UserActivityStats>) totals[k] += s[k];
    return { user: u, stats: s, lastActiveAt: lastActive.get(u.id)?.toISOString() ?? null };
  });
  totals.creditsUsed = Math.round(totals.creditsUsed * 100) / 100;

  const activeUsers = rows.filter((r) => hasActivity(r.stats)).length;
  const filtered = opts.onlyActive ? rows.filter((r) => hasActivity(r.stats)) : rows;

  filtered.sort((a, b) => {
    if (sort === "lastActive") {
      return (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? "");
    }
    const diff = b.stats[sort] - a.stats[sort];
    if (diff !== 0) return diff;
    return (b.lastActiveAt ?? "").localeCompare(a.lastActiveAt ?? "");
  });

  return {
    period: opts.period,
    since: since.toISOString(),
    totals,
    totalUsers: users.length,
    activeUsers,
    total: filtered.length,
    page,
    pageSize,
    rows: filtered.slice((page - 1) * pageSize, page * pageSize),
  };
}

/** Emails sent/failed per day for one user (most recent `days` days). */
export async function getUserDailyEmailSeries(userId: string, days: number) {
  // Stored timestamps are UTC, so days are UTC days.
  const now = new Date();
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));

  const [direct, campaign] = await Promise.all([
    prisma.$queryRaw<Array<{ day: Date; sent: bigint; failed: bigint }>>`
      SELECT date_trunc('day', "createdAt") AS day,
             COUNT(*) FILTER (WHERE status <> 'failed') AS sent,
             COUNT(*) FILTER (WHERE status = 'failed') AS failed
      FROM "LeadEmail"
      WHERE "userId" = ${userId} AND direction = 'outbound' AND "createdAt" >= ${since}
      GROUP BY 1`,
    prisma.$queryRaw<Array<{ day: Date; sent: bigint; failed: bigint }>>`
      SELECT date_trunc('day', l."sentAt") AS day,
             COUNT(*) FILTER (WHERE l.status <> 'failed') AS sent,
             COUNT(*) FILTER (WHERE l.status = 'failed') AS failed
      FROM "CampaignLog" l JOIN "Campaign" c ON c.id = l."campaignId"
      WHERE c."userId" = ${userId} AND l."sentAt" >= ${since}
      GROUP BY 1`,
  ]);

  const byDay = new Map<string, { sent: number; failed: number }>();
  for (const r of [...direct, ...campaign]) {
    const key = new Date(r.day).toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { sent: 0, failed: 0 };
    cur.sent += Number(r.sent);
    cur.failed += Number(r.failed);
    byDay.set(key, cur);
  }

  const out: Array<{ date: string; sent: number; failed: number }> = [];
  for (let i = 0; i < days; i++) {
    const key = new Date(since.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const v = byDay.get(key) ?? { sent: 0, failed: 0 };
    out.push({ date: key, ...v });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export type ActivityKind = "email" | "campaign" | "sms" | "search" | "export" | "credits" | "account";

export const ACTIVITY_KINDS: Array<{ id: ActivityKind; label: string }> = [
  { id: "email", label: "Emails" },
  { id: "campaign", label: "Campaigns" },
  { id: "sms", label: "SMS" },
  { id: "search", label: "Lead searches" },
  { id: "export", label: "Exports" },
  { id: "credits", label: "Credits" },
  { id: "account", label: "Sign-ins & other" },
];

export function parseKinds(raw: string | null | undefined): ActivityKind[] {
  const all = ACTIVITY_KINDS.map((k) => k.id);
  if (!raw) return all;
  const picked = raw.split(",").filter((k): k is ActivityKind => all.includes(k as ActivityKind));
  return picked.length ? picked : all;
}

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  at: string;
  title: string;
  detail: string | null;
  /** ok | failed | received | info */
  status: "ok" | "failed" | "received" | "info";
  error: string | null;
  user: { id: string; email: string; name: string | null; companyName: string | null } | null;
};

// These actions are read from their own tables (Export, Search, LeadEmail, LeadSms, CreditLedger), so
// their summary log line would only repeat the same event.
const DUPLICATE_LOG_TYPES = [
  "export",
  "search",
  "email_sent",
  "email_received",
  "sms.sent",
  "sms.received",
  "lead_export", // billing line; the CreditLedger row shows the same charge
  "lead_generate",
];

const userSelect = { id: true, email: true, name: true, companyName: true } as const;

function trim(text: string | null | undefined, max = 220) {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function describeLogMetadata(type: string, metadata: string | null) {
  if (!metadata) return type;
  try {
    const m = JSON.parse(metadata) as Record<string, unknown>;
    if (type === "login") {
      const parts = [m.ip ? `IP ${m.ip}` : null, typeof m.userAgent === "string" ? trim(m.userAgent, 90) : null];
      return parts.filter(Boolean).join(" · ") || type;
    }
  } catch {
    /* not JSON */
  }
  return type;
}

export async function getActivityTimeline(opts: {
  userId?: string;
  since: Date;
  before?: Date;
  kinds: ActivityKind[];
  limit?: number;
}): Promise<{ events: ActivityEvent[]; nextCursor: string | null }> {
  const limit = Math.min(5000, Math.max(1, opts.limit ?? 50));
  const createdAt = { gte: opts.since, ...(opts.before ? { lt: opts.before } : {}) };
  const userWhere = opts.userId ? { userId: opts.userId } : {};
  const withUser = !opts.userId;
  const want = new Set(opts.kinds);

  const [emails, campaignLogs, sms, searches, exports, credits, logs] = await Promise.all([
    want.has("email")
      ? prisma.leadEmail.findMany({
          where: { ...userWhere, createdAt },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            direction: true,
            status: true,
            fromEmail: true,
            toEmail: true,
            subject: true,
            body: true,
            error: true,
            openedAt: true,
            enrollmentId: true,
            createdAt: true,
            lead: { select: { businessName: true } },
            ...(withUser ? { user: { select: userSelect } } : {}),
          },
        })
      : [],
    want.has("campaign")
      ? prisma.campaignLog.findMany({
          where: {
            sentAt: createdAt,
            ...(opts.userId ? { campaign: { userId: opts.userId } } : {}),
          },
          orderBy: { sentAt: "desc" },
          take: limit,
          select: {
            id: true,
            status: true,
            fromEmail: true,
            toEmail: true,
            subject: true,
            error: true,
            variantLabel: true,
            openedAt: true,
            repliedAt: true,
            sentAt: true,
            campaign: { select: { name: true, ...(withUser ? { user: { select: userSelect } } : {}) } },
          },
        })
      : [],
    want.has("sms")
      ? prisma.leadSms.findMany({
          where: { ...userWhere, createdAt },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            direction: true,
            status: true,
            fromPhone: true,
            toPhone: true,
            body: true,
            error: true,
            createdAt: true,
            lead: { select: { businessName: true } },
            ...(withUser ? { user: { select: userSelect } } : {}),
          },
        })
      : [],
    want.has("search")
      ? prisma.search.findMany({
          where: { ...userWhere, createdAt },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            industry: true,
            country: true,
            state: true,
            city: true,
            zip: true,
            resultCount: true,
            createdAt: true,
            ...(withUser ? { user: { select: userSelect } } : {}),
          },
        })
      : [],
    want.has("export")
      ? prisma.export.findMany({
          where: { ...userWhere, createdAt },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            format: true,
            leadIds: true,
            createdAt: true,
            ...(withUser ? { user: { select: userSelect } } : {}),
          },
        })
      : [],
    want.has("credits")
      ? prisma.creditLedger.findMany({
          where: { ...userWhere, createdAt },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            amount: true,
            action: true,
            reference: true,
            createdAt: true,
            ...(withUser ? { user: { select: userSelect } } : {}),
          },
        })
      : [],
    want.has("account")
      ? prisma.activityLog.findMany({
          where: { ...userWhere, createdAt, type: { notIn: DUPLICATE_LOG_TYPES } },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            type: true,
            message: true,
            metadata: true,
            createdAt: true,
            ...(withUser ? { user: { select: userSelect } } : {}),
          },
        })
      : [],
  ]);

  type WithUser = { user?: ActivityEvent["user"] };
  const u = (row: WithUser) => row.user ?? null;
  const events: ActivityEvent[] = [];

  for (const e of emails) {
    const inbound = e.direction === "inbound";
    const failed = !inbound && e.status === "failed";
    const who = e.lead?.businessName ? ` (${e.lead.businessName})` : "";
    events.push({
      id: `email:${e.id}`,
      kind: "email",
      at: e.createdAt.toISOString(),
      title: inbound
        ? `Reply received from ${e.fromEmail}${who}`
        : failed
          ? `Email failed to ${e.toEmail}${who}`
          : `${e.enrollmentId ? "Sequence email" : "Email"} sent to ${e.toEmail}${who}${e.openedAt ? " · opened" : ""}`,
      detail: [e.subject ? `Subject: ${e.subject}` : null, inbound ? null : `From ${e.fromEmail}`, trim(e.body, 160)]
        .filter(Boolean)
        .join(" · "),
      status: inbound ? "received" : failed ? "failed" : "ok",
      error: failed ? trim(e.error, 300) : null,
      user: u(e as WithUser),
    });
  }

  for (const l of campaignLogs) {
    const failed = l.status === "failed";
    const extra = l.repliedAt ? " · replied" : l.openedAt ? " · opened" : "";
    events.push({
      id: `campaign:${l.id}`,
      kind: "campaign",
      at: l.sentAt.toISOString(),
      title: `${failed ? "Campaign email failed to" : "Campaign email sent to"} ${l.toEmail}${failed ? "" : extra}`,
      detail: [`Campaign: ${l.campaign.name}`, l.variantLabel, l.subject ? `Subject: ${l.subject}` : null, `From ${l.fromEmail}`]
        .filter(Boolean)
        .join(" · "),
      status: failed ? "failed" : "ok",
      error: failed ? trim(l.error, 300) : null,
      user: (l.campaign as WithUser).user ?? null,
    });
  }

  for (const s of sms) {
    const inbound = s.direction === "inbound";
    const failed = !inbound && s.status === "failed";
    const who = s.lead?.businessName ? ` (${s.lead.businessName})` : "";
    events.push({
      id: `sms:${s.id}`,
      kind: "sms",
      at: s.createdAt.toISOString(),
      title: inbound
        ? `SMS received from ${s.fromPhone}${who}`
        : `${failed ? "SMS failed to" : "SMS sent to"} ${s.toPhone}${who}`,
      detail: trim(s.body, 200),
      status: inbound ? "received" : failed ? "failed" : "ok",
      error: failed ? trim(s.error, 300) : null,
      user: u(s as WithUser),
    });
  }

  for (const s of searches) {
    const place = [s.city, s.state, s.zip].filter(Boolean).join(", ") || s.country;
    events.push({
      id: `search:${s.id}`,
      kind: "search",
      at: s.createdAt.toISOString(),
      title: `Lead search: ${s.industry} in ${place}`,
      detail: `${s.resultCount} lead${s.resultCount === 1 ? "" : "s"} found`,
      status: "info",
      error: null,
      user: u(s as WithUser),
    });
  }

  for (const x of exports) {
    const n = exportedCount(x.leadIds);
    events.push({
      id: `export:${x.id}`,
      kind: "export",
      at: x.createdAt.toISOString(),
      title: `Exported ${n} lead${n === 1 ? "" : "s"} (${x.format.toUpperCase()})`,
      detail: null,
      status: "info",
      error: null,
      user: u(x as WithUser),
    });
  }

  for (const c of credits) {
    const amount = Math.round(c.amount * 100) / 100;
    events.push({
      id: `credits:${c.id}`,
      kind: "credits",
      at: c.createdAt.toISOString(),
      title: `${amount < 0 ? "Used" : "Added"} ${Math.abs(amount)} credit${Math.abs(amount) === 1 ? "" : "s"} · ${c.action}`,
      detail: c.reference ? trim(c.reference, 160) : null,
      status: "info",
      error: null,
      user: u(c as WithUser),
    });
  }

  for (const a of logs) {
    events.push({
      id: `log:${a.id}`,
      kind: "account",
      at: a.createdAt.toISOString(),
      title: a.message,
      detail: describeLogMetadata(a.type, a.metadata),
      status: "info",
      error: null,
      user: u(a as WithUser),
    });
  }

  events.sort((a, b) => b.at.localeCompare(a.at));
  const page = events.slice(0, limit);
  const sourcesFull = [emails, campaignLogs, sms, searches, exports, credits, logs].some((r) => r.length === limit);
  const nextCursor = events.length > limit || sourcesFull ? (page[page.length - 1]?.at ?? null) : null;
  return { events: page, nextCursor };
}

/** Earliest recorded action for one user, across every source (for "active since"). */
export async function getFirstActivityAt(userId: string): Promise<string | null> {
  const asc = { orderBy: { createdAt: "asc" as const }, select: { createdAt: true } };
  const [a, e, s, x, sms, c, campaign] = await Promise.all([
    prisma.activityLog.findFirst({ where: { userId }, ...asc }),
    prisma.leadEmail.findFirst({ where: { userId }, ...asc }),
    prisma.search.findFirst({ where: { userId }, ...asc }),
    prisma.export.findFirst({ where: { userId }, ...asc }),
    prisma.leadSms.findFirst({ where: { userId }, ...asc }),
    prisma.creditLedger.findFirst({ where: { userId }, ...asc }),
    prisma.campaignLog.findFirst({
      where: { campaign: { userId } },
      orderBy: { sentAt: "asc" },
      select: { sentAt: true },
    }),
  ]);
  const dates = [a, e, s, x, sms, c].map((r) => r?.createdAt).concat(campaign?.sentAt).filter(Boolean) as Date[];
  if (!dates.length) return null;
  return new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString();
}
