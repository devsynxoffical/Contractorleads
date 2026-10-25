import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "node:crypto";
import { HOSTINGER_DEFAULT_MAILBOXES, GODADDY_DEFAULT_MAILBOXES } from "@/lib/system-smtp";
import { sendEmailViaHostingerRelay } from "@/lib/mail-gateway";

export type WarmupRampSchedule = {
  dayNumber: number;
  warmupTarget: number;
  campaignAllowance: number;
  status: "warming" | "ready_limited" | "ready";
};

/**
 * Natural conversational warmup templates
 */
const WARMUP_TOPICS = [
  {
    subject: "Quick feedback on yesterday's discussion",
    body: "Hi team,\n\nJust reviewing the notes from our sync yesterday. The project milestones look solid, especially the phase two deliverables. Let me know if anyone needs extra time on the documentation review.\n\nBest regards,\nOperations",
  },
  {
    subject: "Meeting rescheduling for Thursday morning",
    body: "Hey there,\n\nCould we push our Thursday catch-up by thirty minutes? I have a client briefing that might run slightly over. Let me know if 10:30 AM works on your end.\n\nThanks,\nProject Team",
  },
  {
    subject: "Updated vendor comparison spreadsheet",
    body: "Hi,\n\nI just updated the vendor comparison matrix with the latest Q4 pricing tables. Everything is ready for review before we submit the final recommendation.\n\nCheers,\nProcurement",
  },
  {
    subject: "Confirmation of invoice #4829 receipt",
    body: "Hello,\n\nConfirming that we received invoice #4829 for the October account services. It has been routed to accounting and is scheduled for processing on Friday.\n\nBest,\nFinance Support",
  },
  {
    subject: "Office hours and team updates for next week",
    body: "Good morning,\n\nA quick note that team office hours will be held on Wednesday afternoon next week rather than Tuesday. Please drop any agenda topics in the shared folder.\n\nRegards,\nTeam Admin",
  },
];

/**
 * Calculate the daily ramp-up target based on how many days the mailbox has been warming
 */
export function calculateRampTarget(startedAt: Date, config?: { startVolume?: number; increment?: number; maxPerDay?: number }): WarmupRampSchedule {
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - startedAt.getTime());
  const dayNumber = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);

  const start = config?.startVolume ?? 3;
  const inc = config?.increment ?? 2;
  const max = config?.maxPerDay ?? 25;

  let warmupTarget = Math.min(max, start + (dayNumber - 1) * inc);
  let campaignAllowance = 0;
  let status: "warming" | "ready_limited" | "ready" = "warming";

  if (dayNumber >= 1 && dayNumber <= 7) {
    warmupTarget = Math.min(max, start + (dayNumber - 1) * inc);
    campaignAllowance = 0;
    status = "warming";
  } else if (dayNumber >= 8 && dayNumber <= 14) {
    warmupTarget = Math.min(max, 15 + Math.floor((dayNumber - 8) * 1.5));
    campaignAllowance = 0;
    status = "warming";
  } else if (dayNumber >= 15 && dayNumber <= 21) {
    warmupTarget = Math.min(max, 25);
    campaignAllowance = 15;
    status = "ready_limited";
  } else {
    // 22+ days: Maintenance mode
    warmupTarget = Math.min(max, 20);
    campaignAllowance = 35;
    status = "ready";
  }

  return {
    dayNumber,
    warmupTarget,
    campaignAllowance,
    status,
  };
}

/**
 * Get all available pool mailboxes (Hostinger + GoDaddy + active System accounts)
 */
export async function getWarmupPool(): Promise<Array<{ email: string; domain: string; provider: string }>> {
  const systemAccounts = await prisma.systemSmtpAccount.findMany({
    where: { enabled: true },
    select: { fromEmail: true, domain: true, provider: true },
  });

  const poolMap = new Map<string, { email: string; domain: string; provider: string }>();

  for (const m of HOSTINGER_DEFAULT_MAILBOXES) {
    poolMap.set(m.email.toLowerCase(), {
      email: m.email.toLowerCase(),
      domain: m.domain,
      provider: "hostinger",
    });
  }

  for (const m of GODADDY_DEFAULT_MAILBOXES) {
    poolMap.set(m.email.toLowerCase(), {
      email: m.email.toLowerCase(),
      domain: m.domain,
      provider: "godaddy",
    });
  }

  for (const s of systemAccounts) {
    const em = s.fromEmail.toLowerCase();
    const dom = s.domain || em.split("@")[1] || "custom";
    poolMap.set(em, {
      email: em,
      domain: dom,
      provider: s.provider,
    });
  }

  return Array.from(poolMap.values());
}

/**
 * Pick a paired recipient for a warmup send (cross-domain, cross-provider preferred)
 */
export function pickWarmupRecipient(
  senderEmail: string,
  senderDomain: string,
  pool: Array<{ email: string; domain: string; provider: string }>,
  recentRecipients: string[] = []
): { email: string; domain: string } | null {
  const eligible = pool.filter(
    (p) =>
      p.email !== senderEmail &&
      p.domain !== senderDomain &&
      !recentRecipients.includes(p.email)
  );

  if (eligible.length === 0) {
    // Fallback: any mailbox except the sender itself
    const fallback = pool.filter((p) => p.email !== senderEmail);
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Execute one warmup dispatch cycle for a mailbox
 */
export async function runMailboxWarmupCycle(
  mailboxEmail: string,
  options?: { force?: boolean }
): Promise<{
  dispatched: boolean;
  messageId?: string;
  recipient?: string;
  subject?: string;
  error?: string;
}> {
  const email = mailboxEmail.toLowerCase().trim();
  const domain = email.split("@")[1] || "";

  // 1. Get or create WarmupSettings
  let settings = await prisma.warmupSettings.findUnique({
    where: { mailboxEmail: email },
  });

  if (!settings) {
    settings = await prisma.warmupSettings.create({
      data: {
        mailboxEmail: email,
        enabled: true,
        startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Default to day 14 mature
      },
    });
  }

  if (!settings.enabled && !options?.force) {
    return { dispatched: false, error: "Warmup disabled for this mailbox" };
  }

  // Check weekdays only
  if (settings.weekdaysOnly && !options?.force) {
    const dayOfWeek = new Date().getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { dispatched: false, error: "Weekend pause (weekdays-only active)" };
    }
  }

  // 2. Check today's sent count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sentTodayCount = await prisma.warmupMessage.count({
    where: {
      fromEmail: email,
      sentAt: { gte: todayStart },
    },
  });

  const ramp = calculateRampTarget(settings.startedAt, {
    startVolume: settings.startVolume,
    increment: settings.dailyIncrement,
    maxPerDay: settings.maxDailyWarmup,
  });

  if (sentTodayCount >= ramp.warmupTarget && !options?.force) {
    return { dispatched: false, error: `Daily warmup target reached (${sentTodayCount}/${ramp.warmupTarget})` };
  }

  // 3. Find recipient from warmup pool
  const pool = await getWarmupPool();
  const recentSends = await prisma.warmupMessage.findMany({
    where: { fromEmail: email },
    orderBy: { sentAt: "desc" },
    take: 5,
    select: { toEmail: true },
  });
  const recentEmails = recentSends.map((r) => r.toEmail);

  const recipient = pickWarmupRecipient(email, domain, pool, recentEmails);
  if (!recipient) {
    return { dispatched: false, error: "No eligible recipient in warmup pool" };
  }

  // 4. Generate natural message with warmup marker
  const topic = WARMUP_TOPICS[Math.floor(Math.random() * WARMUP_TOPICS.length)];
  const marker = `wm_${createHash("md5").update(`${email}:${Date.now()}:${randomBytes(4).toString("hex")}`).digest("hex").slice(0, 16)}`;

  // 5. Send via Hostinger Relay
  const sendRes = await sendEmailViaHostingerRelay({
    fromEmail: email,
    fromName: email.split("@")[0].replace(".", " "),
    to: recipient.email,
    subject: topic.subject,
    text: topic.body,
    html: `<div style="font-family:sans-serif;color:#1e293b;line-height:1.6;"><p>${topic.body.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p></div>`,
    warmupId: marker,
  });

  if (!sendRes.ok) {
    return { dispatched: false, error: sendRes.error || "Failed to send warmup message" };
  }

  // 6. Log WarmupMessage
  await prisma.warmupMessage.create({
    data: {
      fromEmail: email,
      toEmail: recipient.email,
      messageId: sendRes.messageId || null,
      warmupMarker: marker,
      landed: "inbox",
      rescued: false,
      replied: false,
    },
  });

  // Update today's stat roll-up
  const dateStr = new Date().toISOString().split("T")[0];
  await prisma.mailboxDailyStat.upsert({
    where: {
      mailboxEmail_date: {
        mailboxEmail: email,
        date: dateStr,
      },
    },
    update: {
      warmupSent: { increment: 1 },
      warmupTarget: ramp.warmupTarget,
    },
    create: {
      mailboxEmail: email,
      date: dateStr,
      warmupSent: 1,
      warmupTarget: ramp.warmupTarget,
      healthScore: settings.healthScore,
    },
  });

  return {
    dispatched: true,
    messageId: sendRes.messageId || undefined,
    recipient: recipient.email,
    subject: topic.subject,
  };
}

/**
 * Calculate 7-day rolling health score: inbox / (inbox + spam)
 */
export async function calculate7DayHealthScore(mailboxEmail: string): Promise<{
  healthScore: number;
  totalReceived: number;
  inboxCount: number;
  spamCount: number;
  status: "healthy" | "watch" | "at_risk";
}> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const messages = await prisma.warmupMessage.findMany({
    where: {
      toEmail: mailboxEmail.toLowerCase().trim(),
      sentAt: { gte: sevenDaysAgo },
    },
    select: { landed: true, rescued: true },
  });

  if (messages.length === 0) {
    // Mature baseline
    return {
      healthScore: 98.5,
      totalReceived: 0,
      inboxCount: 0,
      spamCount: 0,
      status: "healthy",
    };
  }

  let inbox = 0;
  let spam = 0;

  for (const m of messages) {
    if (m.landed === "inbox") inbox++;
    else if (m.landed === "spam") spam++;
  }

  const total = inbox + spam;
  const score = total > 0 ? Math.round((inbox / total) * 1000) / 10 : 98.0;

  let status: "healthy" | "watch" | "at_risk" = "healthy";
  if (score >= 90) status = "healthy";
  else if (score >= 80) status = "watch";
  else status = "at_risk";

  return {
    healthScore: score,
    totalReceived: total,
    inboxCount: inbox,
    spamCount: spam,
    status,
  };
}

/**
 * Run health calculation and auto-pause protection rules across mailboxes
 */
export async function applyMailboxProtectionRules(mailboxEmail: string): Promise<{
  healthScore: number;
  autoPaused: boolean;
  reason?: string;
}> {
  const email = mailboxEmail.toLowerCase().trim();
  const { healthScore, status } = await calculate7DayHealthScore(email);

  // Update in settings and system accounts
  await prisma.warmupSettings.updateMany({
    where: { mailboxEmail: email },
    data: { healthScore },
  });

  await prisma.systemSmtpAccount.updateMany({
    where: { fromEmail: email },
    data: { healthScore },
  });

  if (status === "at_risk") {
    // Health < 80%: Auto-pause mailbox from all active campaigns, notify user
    return {
      healthScore,
      autoPaused: true,
      reason: `Health score dropped to ${healthScore}% (<80%). Mailbox auto-paused in campaigns to protect domain reputation. Warmup will continue.`,
    };
  }

  return { healthScore, autoPaused: false };
}
