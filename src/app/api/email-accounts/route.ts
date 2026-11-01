import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGlobalSuperAdmin } from "@/lib/roles";
import { encryptSecret } from "@/lib/crypto-secret";
import { checkDomainDns } from "@/lib/dns-checker";
import {
  saveAccountToHostingerRelay,
  testAccountViaHostingerRelay,
} from "@/lib/mail-gateway";
import {
  calculateRampTarget,
  calculate7DayHealthScore,
} from "@/lib/warmup-engine";
import { seedSystemMailboxes } from "@/lib/system-smtp";
import { clearMailboxFailure, diagnoseMailboxError, publicMailError } from "@/lib/mailbox-send-status";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").toLowerCase().trim();
  const filterDomain = searchParams.get("domain") || "";
  const filterStatus = searchParams.get("status") || "";
  const filterHealth = searchParams.get("health") || ""; // e.g. "at_risk"

  const isSuper = isGlobalSuperAdmin(user);

  // Ensure system mailboxes are seeded
  let systemAccounts = await prisma.systemSmtpAccount.findMany({
    where: isSuper ? {} : { assignedUserId: user.id },
    orderBy: [{ provider: "asc" }, { domain: "asc" }, { fromEmail: "asc" }],
  });

  if (systemAccounts.length === 0 && isSuper) {
    await seedSystemMailboxes(false);
    systemAccounts = await prisma.systemSmtpAccount.findMany({
      orderBy: [{ provider: "asc" }, { domain: "asc" }, { fromEmail: "asc" }],
    });
  }

  // Also include user custom SMTP accounts
  const userSmtpAccounts = await prisma.smtpAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Today start for sends counter
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Fetch today's campaign logs to count sends per mailbox
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [todayCampaignLogs, todayWarmupLogs, activeCampaigns, warmupSettingsList, cachedDnsList, recentWarmup, attempts7d, campaign7d, campaignOutcomes] = await Promise.all([
    prisma.campaignLog.findMany({
      where: { sentAt: { gte: todayStart } },
      select: { mailboxId: true, fromEmail: true, status: true },
    }),
    prisma.warmupMessage.findMany({
      where: { sentAt: { gte: todayStart } },
      select: { fromEmail: true, landed: true, rescued: true },
    }),
    prisma.campaign.findMany({
      where: { status: "active" },
      select: { id: true, selectedMailboxIds: true, userId: true, user: { select: { role: true, email: true } } },
    }),
    prisma.warmupSettings.findMany(),
    prisma.domainDnsCache.findMany(),
    // Mailboxes with any real warmup traffic in the last 7 days have a measured health score
    prisma.warmupMessage.findMany({
      where: { sentAt: { gte: sevenDaysAgo } },
      select: { fromEmail: true, toEmail: true },
    }),
    // Real send attempts per mailbox over the last 7 days (health)
    prisma.mailboxDailyStat.groupBy({
      by: ["mailboxEmail"],
      where: { date: { gte: sevenDaysAgo.toISOString().split("T")[0] } },
      _sum: { sendOk: true, sendFailures: true },
    }),
    prisma.campaignLog.groupBy({
      by: ["fromEmail", "status"],
      where: { sentAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
    // Real reply / bounce rates per sending mailbox over the last 30 days
    prisma.campaignLog.groupBy({
      by: ["fromEmail", "status"],
      where: { sentAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
    }),
  ]);

  const outcomeByMailbox = new Map<string, { sent: number; replied: number; bounced: number }>();
  for (const o of campaignOutcomes) {
    const key = (o.fromEmail || "").toLowerCase();
    const cur = outcomeByMailbox.get(key) || { sent: 0, replied: 0, bounced: 0 };
    if (o.status !== "failed") cur.sent += o._count._all;
    if (o.status === "replied") cur.replied += o._count._all;
    if (o.status === "bounced") cur.bounced += o._count._all;
    outcomeByMailbox.set(key, cur);
  }
  /** null = no campaign sends in 30 days, so no rate is shown. */
  const rates = (email: string) => {
    const o = outcomeByMailbox.get(email);
    if (!o || o.sent === 0) return { replyRate: null as number | null, bounceRate: null as number | null, campaignSent30d: 0 };
    return {
      replyRate: Math.round((o.replied / o.sent) * 1000) / 10,
      bounceRate: Math.round((o.bounced / o.sent) * 1000) / 10,
      campaignSent30d: o.sent,
    };
  };

  const mailboxesWithTraffic = new Set<string>();
  const warmupSent7d = new Map<string, number>();
  for (const m of recentWarmup) {
    const from = m.fromEmail.toLowerCase();
    mailboxesWithTraffic.add(from);
    mailboxesWithTraffic.add(m.toEmail.toLowerCase());
    warmupSent7d.set(from, (warmupSent7d.get(from) || 0) + 1);
  }
  const attemptsByMailbox = new Map(
    attempts7d.map((a) => [a.mailboxEmail.toLowerCase(), { ok: a._sum.sendOk || 0, failed: a._sum.sendFailures || 0 }]),
  );
  const campaign7dByMailbox = new Map<string, { delivered: number; failed: number; bounced: number }>();
  for (const c of campaign7d) {
    const key = (c.fromEmail || "").toLowerCase();
    const cur = campaign7dByMailbox.get(key) || { delivered: 0, failed: 0, bounced: 0 };
    if (c.status === "failed") cur.failed += c._count._all;
    else if (c.status === "bounced") cur.bounced += c._count._all;
    else cur.delivered += c._count._all;
    campaign7dByMailbox.set(key, cur);
  }
  /**
   * Live 7-day sending health (same rule as calculate7DayHealthScore): successful sends ÷ all
   * attempts, bounces counted as failures. null when the mailbox attempted nothing in 7 days.
   */
  const liveHealth = (email: string): number | null => {
    const a = attemptsByMailbox.get(email) || { ok: 0, failed: 0 };
    const c = campaign7dByMailbox.get(email) || { delivered: 0, failed: 0, bounced: 0 };
    const ok = Math.max(a.ok, (warmupSent7d.get(email) || 0) + c.delivered);
    const failed = Math.max(a.failed, c.failed);
    const total = ok + failed + c.bounced;
    return total > 0 ? Math.round((ok / total) * 1000) / 10 : null;
  };

  /**
   * Real sending state for a mailbox. "failing" when the latest send attempt failed
   * (e.g. wrong password): health is then 0, because the mailbox cannot deliver anything.
   * "unknown" when nothing has been sent or measured yet, so no score is claimed.
   */
  const sendState = (email: string) => {
    const w = warmupSettingsMap.get(email);
    const measured = liveHealth(email);
    const failing =
      Boolean(w?.lastSendErrorAt) &&
      (w?.consecutiveSendFailures ?? 0) > 0 &&
      (!w?.lastSendOkAt || new Date(w.lastSendErrorAt) > new Date(w.lastSendOkAt));
    const known = failing || measured != null;
    return {
      sendStatus: (failing ? "failing" : known ? "ok" : "unknown") as "failing" | "ok" | "unknown",
      // Always rebuilt from the raw error, so stored wording can never expose internals.
      lastSendError: failing ? publicMailError(w?.lastSendErrorRaw || w?.lastSendError) : null,
      sendProblem: failing ? diagnoseMailboxError(w?.lastSendErrorRaw || w?.lastSendError).problem : null,
      lastSendErrorAt: failing && w?.lastSendErrorAt ? new Date(w.lastSendErrorAt).toISOString() : null,
      lastSendOkAt: w?.lastSendOkAt ? new Date(w.lastSendOkAt).toISOString() : null,
      healthKnown: known,
      healthScore: failing ? 0 : measured ?? 0,
    };
  };

  const warmupSettingsMap = new Map<string, any>();
  for (const w of warmupSettingsList) {
    warmupSettingsMap.set(w.mailboxEmail.toLowerCase(), w);
  }

  const dnsCacheMap = new Map<string, any>();
  for (const d of cachedDnsList) {
    dnsCacheMap.set(d.domain.toLowerCase(), d);
  }

  // Count campaign sends today per mailbox
  const campaignSendsToday = new Map<string, number>();
  for (const log of todayCampaignLogs) {
    if (log.status === "failed") continue;
    const key = (log.mailboxId || log.fromEmail || "").toLowerCase();
    campaignSendsToday.set(key, (campaignSendsToday.get(key) || 0) + 1);
  }

  // Count warmup sends today per mailbox
  const warmupSendsToday = new Map<string, number>();
  for (const w of todayWarmupLogs) {
    const key = w.fromEmail.toLowerCase();
    warmupSendsToday.set(key, (warmupSendsToday.get(key) || 0) + 1);
  }

  // Count attached campaigns per mailbox
  const attachedCampaignsMap = new Map<string, number>();
  // Campaigns set to "ALL" mailboxes use every mailbox their owner can send from.
  const allCampaignsByUser = new Map<string, number>();
  let superAdminAllCampaigns = 0;
  for (const c of activeCampaigns) {
    let ids: unknown = "ALL";
    try {
      ids = c.selectedMailboxIds ? JSON.parse(c.selectedMailboxIds) : "ALL";
    } catch {
      ids = "ALL";
    }
    if (Array.isArray(ids) && ids.length > 0) {
      for (const mId of ids) {
        attachedCampaignsMap.set(String(mId), (attachedCampaignsMap.get(String(mId)) || 0) + 1);
      }
    } else {
      allCampaignsByUser.set(c.userId, (allCampaignsByUser.get(c.userId) || 0) + 1);
      if (isGlobalSuperAdmin(c.user)) superAdminAllCampaigns++;
    }
  }

  // Unique domains encountered
  const uniqueDomains = new Set<string>();

  // Map system accounts to uniform PlusVibe row format
  const rows = [
    ...systemAccounts.map((s) => {
      const email = s.fromEmail.toLowerCase();
      const domain = (s.domain || email.split("@")[1] || "custom").toLowerCase();
      uniqueDomains.add(domain);

      const wSettings = warmupSettingsMap.get(email);
      // No settings row yet means warmup has not started: day 1, not a made-up "day 14".
      const startedAt = wSettings ? new Date(wSettings.startedAt) : new Date();
      const ramp = calculateRampTarget(startedAt, {
        startVolume: wSettings?.startVolume,
        increment: wSettings?.dailyIncrement,
        maxPerDay: wSettings?.maxDailyWarmup,
      });

      // Only real logged sends: no stored counters that may be stale.
      const warmupSent = warmupSendsToday.get(email) || 0;
      const campaignSent = (campaignSendsToday.get(s.id.toLowerCase()) || 0) + (campaignSendsToday.get(email) || 0);
      const dailyCampaignLimit = s.dailyLimit || 30;

      const state = sendState(email);
      const healthScore = state.healthScore;
      const attachedCount =
        (attachedCampaignsMap.get(s.id) || 0) +
        superAdminAllCampaigns +
        (s.assignedUserId ? allCampaignsByUser.get(s.assignedUserId) || 0 : 0);

      return {
        id: s.id,
        email: s.fromEmail,
        senderName: s.fromName || s.fromEmail.split("@")[0].replace(".", " "),
        domain,
        provider: s.provider || "hostinger",
        type: "system",
        status: !s.enabled ? "Paused" : state.sendStatus === "failing" ? "Sending failed" : "Active",
        ...state,
        campaignSends: { sent: campaignSent, limit: dailyCampaignLimit },
        warmupSends: { sent: warmupSent, target: ramp.warmupTarget },
        warmupEnabled: wSettings ? wSettings.enabled : s.warmupEnabled,
        warmupConfig: {
          startVolume: wSettings?.startVolume ?? 3,
          dailyIncrement: wSettings?.dailyIncrement ?? 2,
          maxDailyWarmup: wSettings?.maxDailyWarmup ?? 25,
          weekdaysOnly: wSettings?.weekdaysOnly ?? false,
        },
        healthScore: Math.round(healthScore * 10) / 10,
        ...rates(email),
        attachedCampaigns: attachedCount,
        tags: s.tags ? s.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        isReady: s.enabled && state.sendStatus === "ok" && healthScore >= 90 && ramp.status !== "warming",
        warmingDays: ramp.dayNumber,
        rampStatus: ramp.status,
      };
    }),
    ...userSmtpAccounts.map((u) => {
      const email = u.fromEmail.toLowerCase();
      const domain = (email.split("@")[1] || "custom").toLowerCase();
      uniqueDomains.add(domain);

      const wSettings = warmupSettingsMap.get(email);
      // No settings row yet means warmup has not started: day 1, not a made-up "day 14".
      const startedAt = wSettings ? new Date(wSettings.startedAt) : new Date();
      const ramp = calculateRampTarget(startedAt, {
        startVolume: wSettings?.startVolume,
        increment: wSettings?.dailyIncrement,
        maxPerDay: wSettings?.maxDailyWarmup,
      });

      const warmupSent = warmupSendsToday.get(email) || 0;
      const campaignSent = (campaignSendsToday.get(u.id.toLowerCase()) || 0) + (campaignSendsToday.get(email) || 0);
      const state = sendState(email);
      const healthScore = state.healthScore;

      return {
        id: u.id,
        email: u.fromEmail,
        senderName: u.fromName || u.label || u.fromEmail.split("@")[0],
        domain,
        provider: "custom",
        type: "user",
        status: !u.enabled ? "Paused" : state.sendStatus === "failing" ? "Sending failed" : "Active",
        ...state,
        campaignSends: { sent: campaignSent, limit: 30 },
        warmupSends: { sent: warmupSent, target: ramp.warmupTarget },
        warmupEnabled: wSettings ? wSettings.enabled : true,
        warmupConfig: {
          startVolume: wSettings?.startVolume ?? 3,
          dailyIncrement: wSettings?.dailyIncrement ?? 2,
          maxDailyWarmup: wSettings?.maxDailyWarmup ?? 25,
          weekdaysOnly: wSettings?.weekdaysOnly ?? false,
        },
        healthScore: Math.round(healthScore * 10) / 10,
        ...rates(email),
        attachedCampaigns: (attachedCampaignsMap.get(u.id) || 0) + (allCampaignsByUser.get(u.userId) || 0),
        tags: ["custom-smtp"],
        isReady: u.enabled && state.sendStatus === "ok" && healthScore >= 90,
        warmingDays: ramp.dayNumber,
        rampStatus: ramp.status,
      };
    }),
  ];

  // 2. Real DNS status per domain. Domains never checked (or checked over 24h ago) are
  // checked now; if a check cannot finish within a few seconds the domain shows "unknown"
  // (grey) instead of a made-up pass, and the result is stored when it completes.
  const DNS_STALE_MS = 24 * 60 * 60 * 1000;
  const domainDnsMap: Record<string, any> = {};

  const saveReport = async (domain: string) => {
    const report = await checkDomainDns(domain);
    const data = {
      provider: report.provider,
      overallStatus: report.overallStatus,
      spfStatus: report.spf.status,
      spfRecord: report.spf.record,
      dkimStatus: report.dkim.status,
      dkimSelector: report.dkim.selector || null,
      dkimRecord: report.dkim.record,
      dmarcStatus: report.dmarc.status,
      dmarcRecord: report.dmarc.record,
      mxStatus: report.mx.status,
      mxRecords: report.mx.record,
      lastCheckedAt: new Date(),
    };
    return prisma.domainDnsCache.upsert({
      where: { domain },
      update: data,
      create: { domain, ...data },
    });
  };

  const unknownDns = (domain: string) => ({
    domain,
    overallStatus: "unknown",
    spfStatus: "unknown",
    dkimStatus: "unknown",
    dmarcStatus: "unknown",
    mxStatus: "unknown",
    lastCheckedAt: null,
  });

  await Promise.all(
    Array.from(uniqueDomains).map(async (domain) => {
      const cached = dnsCacheMap.get(domain);
      // Results written by the old checker (made-up DKIM "pass") are always re-checked.
      const legacyFake =
        cached?.dkimSelector === "provider-relay" ||
        cached?.dkimRecord === "Provider-managed authentication & relay envelope";
      const fresh =
        !legacyFake &&
        cached?.lastCheckedAt &&
        Date.now() - new Date(cached.lastCheckedAt).getTime() < DNS_STALE_MS;
      if (cached && fresh) {
        domainDnsMap[domain] = cached;
        return;
      }
      const pending = saveReport(domain).catch(() => null);
      const result = await Promise.race([
        pending,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
      ]);
      // Fall back to the last real result if there is one, else "unknown".
      domainDnsMap[domain] = result || (cached && !legacyFake ? cached : unknownDns(domain));
    }),
  );

  // Filter rows
  let filteredRows = rows;
  if (search) {
    filteredRows = filteredRows.filter(
      (r) =>
        r.email.toLowerCase().includes(search) ||
        r.senderName.toLowerCase().includes(search) ||
        r.domain.toLowerCase().includes(search)
    );
  }
  if (filterDomain) {
    filteredRows = filteredRows.filter((r) => r.domain.toLowerCase() === filterDomain.toLowerCase());
  }
  if (filterStatus) {
    filteredRows = filteredRows.filter((r) => r.status.toLowerCase() === filterStatus.toLowerCase());
  }
  if (filterHealth === "at_risk") {
    filteredRows = filteredRows.filter((r) => r.healthScore < 80);
  } else if (filterHealth === "watch") {
    filteredRows = filteredRows.filter((r) => r.healthScore >= 80 && r.healthScore < 90);
  } else if (filterHealth === "healthy") {
    filteredRows = filteredRows.filter((r) => r.healthScore >= 90);
  }

  // Group into domain folders
  const domainFolders: Record<
    string,
    {
      domain: string;
      dns: any;
      mailboxCount: number;
      avgHealth: number;
      totalDailyCapacity: number;
      mailboxes: typeof filteredRows;
    }
  > = {};

  for (const row of filteredRows) {
    if (!domainFolders[row.domain]) {
      const dns = domainDnsMap[row.domain] || unknownDns(row.domain);
      domainFolders[row.domain] = {
        domain: row.domain,
        dns,
        mailboxCount: 0,
        avgHealth: 0,
        totalDailyCapacity: 0,
        mailboxes: [],
      };
    }
    const folder = domainFolders[row.domain];
    // When DNS could not identify the provider, use the mailbox's own provider so fix steps
    // match (e.g. GoDaddy mailboxes get GoDaddy records, not Hostinger ones).
    if ((!folder.dns.provider || folder.dns.provider === "custom") && (row.provider === "godaddy" || row.provider === "hostinger")) {
      folder.dns = { ...folder.dns, provider: row.provider };
    }
    folder.mailboxes.push(row);
    folder.mailboxCount++;
    folder.totalDailyCapacity += row.campaignSends.limit;
  }

  // Calculate folder avg health
  for (const folder of Object.values(domainFolders)) {
    const measured = folder.mailboxes.filter((m) => m.healthKnown);
    if (measured.length > 0) {
      const sum = measured.reduce((acc, m) => acc + m.healthScore, 0);
      folder.avgHealth = Math.round((sum / measured.length) * 10) / 10;
    }
    (folder as any).healthKnown = measured.length > 0;
    (folder as any).failingCount = folder.mailboxes.filter((m) => m.sendStatus === "failing").length;
  }

  // Summary KPIs
  const totalMailboxes = rows.length;
  const warmingCount = rows.filter((r) => r.warmupEnabled).length;
  const readyCount = rows.filter((r) => r.isReady).length;
  const failingCount = rows.filter((r) => r.sendStatus === "failing").length;
  const measuredRows = rows.filter((r) => r.healthKnown);
  const atRiskCount = measuredRows.filter((r) => r.healthScore < 80).length;
  // Average only over mailboxes with real data; null means nothing has been measured yet.
  const avgPlatformHealth =
    measuredRows.length > 0
      ? Math.round((measuredRows.reduce((acc, r) => acc + r.healthScore, 0) / measuredRows.length) * 10) / 10
      : null;

  return NextResponse.json({
    ok: true,
    summary: {
      totalMailboxes,
      warmingCount,
      readyCount,
      atRiskCount,
      failingCount,
      unmeasuredCount: totalMailboxes - measuredRows.length,
      avgPlatformHealth,
    },
    domainFolders: Object.values(domainFolders),
    mailboxes: filteredRows,
    domainsList: Array.from(uniqueDomains).sort(),
  });
}

/**
 * Add / Connect a new Mailbox account
 * Automatically validates via Hostinger relay and stores on Hostinger mailer.php
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const email = (body.email || "").toLowerCase().trim();
  const password = body.password || "";
  const host = body.host?.trim() || "";
  let port = parseInt(body.port || "465", 10);
  const senderName = body.senderName?.trim() || email.split("@")[0].replace(".", " ");
  const provider = body.provider?.trim() || "custom";
  const dailyLimit = parseInt(body.dailyLimit || "30", 10);

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Mailbox password is required" }, { status: 400 });
  }

  // A pool mailbox already connected to another account cannot be taken over here.
  const existingMailbox = await prisma.systemSmtpAccount.findUnique({ where: { fromEmail: email } });
  if (existingMailbox && !isGlobalSuperAdmin(user) && existingMailbox.assignedUserId && existingMailbox.assignedUserId !== user.id) {
    return NextResponse.json(
      { error: "This mailbox is already connected to another account. Ask an admin to reassign it." },
      { status: 409 },
    );
  }

  // 1. Test connectivity via Hostinger Relay (bypassing Railway TCP port restrictions)
  const testRes = await testAccountViaHostingerRelay({
    fromEmail: email,
    password,
    host,
    port,
  });

  if (!testRes.ok) {
    const admin = isGlobalSuperAdmin(user);
    const diagnosis = diagnoseMailboxError(testRes.error || "", { admin });
    return NextResponse.json(
      {
        error: `${diagnosis.title}. ${diagnosis.explanation}`,
        detail: admin ? testRes.error || null : null,
        diagnosis,
      },
      { status: 400 }
    );
  }

  // The gateway may have authenticated on a fallback port: keep the one that worked.
  if (testRes.port && testRes.port !== port) port = testRes.port;

  // 2. Persist to Hostinger mailer.php storage (save_account action)
  await saveAccountToHostingerRelay({
    fromEmail: email,
    fromName: senderName,
    password,
    host,
    port,
    provider,
  });

  // 3. Save to database in Railway
  const domain = email.split("@")[1];
  const passwordEnc = encryptSecret(password);

  const newAccount = await prisma.systemSmtpAccount.upsert({
    where: { fromEmail: email },
    update: {
      fromName: senderName,
      passwordEnc,
      host: host || "smtp.hostinger.com",
      port,
      domain,
      provider,
      dailyLimit,
      enabled: true,
      lastTestedAt: new Date(),
      // Re-adding with a verified password counts as a user correction: seeds keep it.
      passwordUpdatedByUserAt: new Date(),
      ...(existingMailbox && !existingMailbox.assignedUserId ? { assignedUserId: user.id } : {}),
    },
    create: {
      fromEmail: email,
      fromName: senderName,
      username: email,
      passwordEnc,
      host: host || "smtp.hostinger.com",
      port,
      domain,
      provider,
      dailyLimit,
      enabled: true,
      assignedUserId: user.id,
      lastTestedAt: new Date(),
      passwordUpdatedByUserAt: new Date(),
    },
  });

  // A verified login clears any earlier "Sending failed" state.
  await clearMailboxFailure(email);

  // 4. Initialize Warmup Settings
  await prisma.warmupSettings.upsert({
    where: { mailboxEmail: email },
    update: { enabled: true },
    create: {
      mailboxEmail: email,
      enabled: true,
      startVolume: 3,
      dailyIncrement: 2,
      maxDailyWarmup: 25,
      startedAt: new Date(),
    },
  });

  // 5. Trigger live DNS check for the domain
  try {
    const dnsReport = await checkDomainDns(domain);
    await prisma.domainDnsCache.upsert({
      where: { domain },
      update: {
        provider: dnsReport.provider,
        overallStatus: dnsReport.overallStatus,
        spfStatus: dnsReport.spf.status,
        spfRecord: dnsReport.spf.record,
        dkimStatus: dnsReport.dkim.status,
        dkimSelector: dnsReport.dkim.selector,
        dkimRecord: dnsReport.dkim.record,
        dmarcStatus: dnsReport.dmarc.status,
        dmarcRecord: dnsReport.dmarc.record,
        mxStatus: dnsReport.mx.status,
        mxRecords: dnsReport.mx.record,
        lastCheckedAt: new Date(),
      },
      create: {
        domain,
        provider: dnsReport.provider,
        overallStatus: dnsReport.overallStatus,
        spfStatus: dnsReport.spf.status,
        spfRecord: dnsReport.spf.record,
        dkimStatus: dnsReport.dkim.status,
        dkimSelector: dnsReport.dkim.selector,
        dkimRecord: dnsReport.dkim.record,
        dmarcStatus: dnsReport.dmarc.status,
        dmarcRecord: dnsReport.dmarc.record,
        mxStatus: dnsReport.mx.status,
        mxRecords: dnsReport.mx.record,
      },
    });
  } catch {
    // ignore DNS check failures on initial connect
  }

  return NextResponse.json({
    ok: true,
    message: "Mailbox connected and verified",
    account: {
      id: newAccount.id,
      email: newAccount.fromEmail,
      senderName: newAccount.fromName,
      domain: newAccount.domain,
    },
  });
}

/**
 * Bulk action on mailboxes (enable/disable warmup, set limits, pause, tag)
 */
export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const mailboxIds: string[] = Array.isArray(body.mailboxIds) ? body.mailboxIds.map(String) : [];
  // "warmup_on" | "warmup_off" | "pause" | "activate" | "set_limit" | "add_tag" | "update_settings"
  const action: string = body.action;
  const limit: number = parseInt(body.limit || "30", 10);
  const tag: string = (body.tag || "").trim();

  if (mailboxIds.length === 0) {
    return NextResponse.json({ error: "No mailboxes selected" }, { status: 400 });
  }

  const isSuper = isGlobalSuperAdmin(user);
  // Only mailboxes this user may manage: assigned pool mailboxes (all for super admins)
  // and their own connected SMTP accounts.
  const [systemAccounts, userAccounts] = await Promise.all([
    prisma.systemSmtpAccount.findMany({
      where: { id: { in: mailboxIds }, ...(isSuper ? {} : { assignedUserId: user.id }) },
      select: { id: true, fromEmail: true, tags: true },
    }),
    prisma.smtpAccount.findMany({
      where: { id: { in: mailboxIds }, userId: user.id },
      select: { id: true, fromEmail: true },
    }),
  ]);
  const systemIds = systemAccounts.map((a) => a.id);
  const userIds = userAccounts.map((a) => a.id);
  const emails = [...systemAccounts, ...userAccounts].map((a) => a.fromEmail.toLowerCase());
  const matched = systemIds.length + userIds.length;

  if (matched === 0) {
    return NextResponse.json({ error: "None of the selected mailboxes belong to you" }, { status: 404 });
  }

  const ensureSettings = async (data: Record<string, unknown>) => {
    for (const em of emails) {
      await prisma.warmupSettings.upsert({
        where: { mailboxEmail: em },
        update: data,
        // A brand-new warmup starts at day 1 of the ramp.
        create: { mailboxEmail: em, startedAt: new Date(), weekdaysOnly: false, ...data },
      });
    }
  };

  let applied = matched;
  if (action === "warmup_on") {
    await ensureSettings({ enabled: true });
    await prisma.systemSmtpAccount.updateMany({ where: { id: { in: systemIds } }, data: { warmupEnabled: true } });
  } else if (action === "warmup_off") {
    await ensureSettings({ enabled: false });
    await prisma.systemSmtpAccount.updateMany({ where: { id: { in: systemIds } }, data: { warmupEnabled: false } });
  } else if (action === "update_settings") {
    const num = (v: unknown, min: number, max: number, fallback: number) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    const enabled = body.enabled !== false;
    const startVolume = num(body.startVolume, 1, 10, 3);
    const dailyIncrement = num(body.dailyIncrement, 0, 5, 2);
    const maxDailyWarmup = Math.max(startVolume, num(body.maxDailyWarmup, 5, 50, 25));
    await ensureSettings({
      enabled,
      startVolume,
      dailyIncrement,
      maxDailyWarmup,
      weekdaysOnly: body.weekdaysOnly === true,
    });
    await prisma.systemSmtpAccount.updateMany({
      where: { id: { in: systemIds } },
      data: { warmupEnabled: enabled, warmupTarget: maxDailyWarmup },
    });
  } else if (action === "pause") {
    await prisma.systemSmtpAccount.updateMany({ where: { id: { in: systemIds } }, data: { enabled: false } });
    await prisma.smtpAccount.updateMany({ where: { id: { in: userIds } }, data: { enabled: false } });
  } else if (action === "activate") {
    await prisma.systemSmtpAccount.updateMany({ where: { id: { in: systemIds } }, data: { enabled: true } });
    await prisma.smtpAccount.updateMany({ where: { id: { in: userIds } }, data: { enabled: true } });
  } else if (action === "set_limit") {
    // Only pool mailboxes carry a per-mailbox daily limit.
    await prisma.systemSmtpAccount.updateMany({
      where: { id: { in: systemIds } },
      data: { dailyLimit: Math.max(5, Math.min(100, limit)) },
    });
    applied = systemIds.length;
  } else if (action === "add_tag" && tag) {
    for (const acc of systemAccounts) {
      const existingTags = acc.tags ? acc.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      if (!existingTags.includes(tag)) {
        existingTags.push(tag);
        await prisma.systemSmtpAccount.update({ where: { id: acc.id }, data: { tags: existingTags.join(",") } });
      }
    }
    applied = systemIds.length;
  } else {
    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  }

  const skipped = mailboxIds.length - applied;
  return NextResponse.json({
    ok: true,
    applied,
    skipped,
    message: `Applied to ${applied} mailbox${applied === 1 ? "" : "es"}${skipped > 0 ? `, ${skipped} skipped` : ""}.`,
  });
}
