import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS, INDUSTRIES, TIER_ONE_COUNTRIES, getTierOneCountry, getRegionsForCountry } from "@/lib/constants";
import { getLeadGenerationCapacity, unlockLeads } from "@/lib/lead-access";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";
import { logActivity } from "@/lib/credits";
import { sendDailyDigestEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/email-brand";

export const DIGEST_LEAD_COUNTS = [20, 50, 100] as const;
export type DigestLeadCount = (typeof DIGEST_LEAD_COUNTS)[number];

export type DigestSubscriptionInput = {
  enabled: boolean;
  industry: string;
  country: string;
  locationScope: "local" | "country";
  state: string | null;
  city: string | null;
  dailyLeadCount: DigestLeadCount;
  timezone: string;
};

export function isDigestLeadCount(n: number): n is DigestLeadCount {
  return (DIGEST_LEAD_COUNTS as readonly number[]).includes(n);
}

export function validateDigestSubscription(
  body: Record<string, unknown>,
): { ok: true; data: DigestSubscriptionInput } | { ok: false; error: string } {
  const enabled = Boolean(body.enabled);
  const industry =
    typeof body.industry === "string" ? body.industry.trim() : "";
  if (!industry || !(INDUSTRIES as readonly string[]).includes(industry)) {
    return { ok: false, error: "Pick a valid industry." };
  }

  const country =
    typeof body.country === "string" ? body.country.trim().toUpperCase() : "US";
  if (!TIER_ONE_COUNTRIES.some((c) => c.code === country)) {
    return { ok: false, error: "Pick a valid country." };
  }

  const locationScope =
    body.locationScope === "country" ? "country" : "local";
  const state =
    typeof body.state === "string" && body.state.trim()
      ? body.state.trim().toUpperCase()
      : null;
  const city =
    typeof body.city === "string" && body.city.trim()
      ? body.city.trim()
      : null;

  if (locationScope === "local" && !state && !city) {
    return {
      ok: false,
      error: "Choose a state/region (or entire country).",
    };
  }

  if (state) {
    const regions = getRegionsForCountry(country);
    if (!regions.some((r) => r.code === state)) {
      return { ok: false, error: "Invalid state/region for that country." };
    }
  }

  const dailyLeadCount = Number(body.dailyLeadCount);
  if (!isDigestLeadCount(dailyLeadCount)) {
    return { ok: false, error: "Daily leads must be 20, 50, or 100." };
  }

  const timezone =
    typeof body.timezone === "string" && body.timezone.trim()
      ? body.timezone.trim()
      : "America/Chicago";

  return {
    ok: true,
    data: {
      enabled,
      industry,
      country,
      locationScope,
      state: locationScope === "country" ? null : state,
      city: locationScope === "country" ? null : city,
      dailyLeadCount,
      timezone,
    },
  };
}

function formatLocationLabel(sub: {
  locationScope: string;
  country: string;
  state: string | null;
  city: string | null;
}) {
  const countryName = getTierOneCountry(sub.country).name;
  if (sub.locationScope === "country") return countryName;
  const regions = getRegionsForCountry(sub.country);
  const stateName =
    regions.find((r) => r.code === sub.state)?.name || sub.state || "";
  return [sub.city, stateName, countryName].filter(Boolean).join(", ");
}

/** Local calendar date YYYY-MM-DD in an IANA timezone. */
export function localDateKey(timeZone: string, date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** Local hour 0–23 in an IANA timezone. */
export function localHour(timeZone: string, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === "hour")?.value;
    return Number(hour === "24" ? "0" : hour) || 0;
  } catch {
    return date.getUTCHours();
  }
}

function alreadyRanToday(lastRunAt: Date | null, timeZone: string) {
  if (!lastRunAt) return false;
  return localDateKey(timeZone, lastRunAt) === localDateKey(timeZone);
}

export type DigestRunResult = {
  userId: string;
  status: "sent" | "skipped" | "failed";
  leadCount?: number;
  creditsCharged?: number;
  reason?: string;
};

/**
 * Generate fresh verified leads for one subscription, bill credits, email the user.
 */
export async function runDailyDigestForSubscription(
  subscriptionId: string,
): Promise<DigestRunResult> {
  const sub = await prisma.digestSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          ownerName: true,
          isActive: true,
          emailMarketingOptIn: true,
          creditsRemaining: true,
        },
      },
    },
  });

  if (!sub || !sub.enabled) {
    return { userId: sub?.userId ?? "", status: "skipped", reason: "disabled" };
  }
  if (!sub.user.isActive) {
    return { userId: sub.userId, status: "skipped", reason: "inactive_user" };
  }
  if (alreadyRanToday(sub.lastRunAt, sub.timezone)) {
    return { userId: sub.userId, status: "skipped", reason: "already_ran_today" };
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    await prisma.digestSubscription.update({
      where: { id: sub.id },
      data: { lastError: "GOOGLE_PLACES_API_KEY missing" },
    });
    return { userId: sub.userId, status: "failed", reason: "no_places_key" };
  }

  const capacity = await getLeadGenerationCapacity(sub.userId);
  const requested = Math.min(sub.dailyLeadCount, capacity.available);
  if (requested < 1) {
    await prisma.digestSubscription.update({
      where: { id: sub.id },
      data: {
        lastRunAt: new Date(),
        lastError: "Insufficient credits for daily digest",
      },
    });
    await prisma.digestDelivery.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        leadCount: 0,
        leadIds: "[]",
        creditsCharged: 0,
        emailStatus: "skipped",
        error: "Insufficient credits",
      },
    });
    return {
      userId: sub.userId,
      status: "skipped",
      reason: "insufficient_credits",
    };
  }

  const locationLabel = formatLocationLabel(sub);

  try {
    const result = await runLeadPipeline({
      userId: sub.userId,
      industry: sub.industry,
      country: sub.country,
      locationScope: sub.locationScope === "country" ? "country" : "local",
      state: sub.state ?? undefined,
      city: sub.city ?? undefined,
      targetLeadCount: requested,
    });

    const leads = result.leads;
    if (!leads.length) {
      await prisma.digestSubscription.update({
        where: { id: sub.id },
        data: {
          lastRunAt: new Date(),
          lastError: `No leads found for ${sub.industry} in ${locationLabel}`,
        },
      });
      await prisma.digestDelivery.create({
        data: {
          userId: sub.userId,
          subscriptionId: sub.id,
          leadCount: 0,
          leadIds: "[]",
          creditsCharged: 0,
          emailStatus: "skipped",
          error: "No leads found",
        },
      });
      return {
        userId: sub.userId,
        status: "skipped",
        reason: "no_leads",
        leadCount: 0,
      };
    }

    const billed = await unlockLeads({
      userId: sub.userId,
      leadIds: leads.map((l) => l.id),
      allowPartial: true,
      action: "lead_generate",
    });

    const unlocked = new Set(billed.unlockedIds);
    const delivered = leads.filter((l) => unlocked.has(l.id));
    const hotCount = delivered.filter((l) => l.qualityTier === "hot").length;
    const warmCount = delivered.filter((l) => l.qualityTier === "warm").length;

    const emailResult = await sendDailyDigestEmail({
      userId: sub.userId,
      to: sub.user.email,
      name: sub.user.name || sub.user.ownerName,
      industry: sub.industry,
      locationLabel,
      leadCount: delivered.length,
      hotCount,
      warmCount,
      sampleNames: delivered.slice(0, 8).map((l) => l.businessName),
      digestUrl: `${appBaseUrl()}/digest`,
      leadsUrl: `${appBaseUrl()}/leads?when=today`,
    });

    const emailStatus =
      "skipped" in emailResult && emailResult.skipped
        ? "skipped"
        : "ok" in emailResult && emailResult.ok === false
          ? "failed"
          : "sent";

    await prisma.digestDelivery.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        leadCount: delivered.length,
        leadIds: JSON.stringify(delivered.map((l) => l.id)),
        creditsCharged: billed.charged,
        emailStatus,
        error: emailStatus === "failed" ? "Email send failed" : null,
      },
    });

    await prisma.digestSubscription.update({
      where: { id: sub.id },
      data: { lastRunAt: new Date(), lastError: null },
    });

    await logActivity(
      sub.userId,
      "digest",
      `Daily digest: ${delivered.length} ${sub.industry} leads (${locationLabel}) · ${billed.charged} credits`,
      {
        subscriptionId: sub.id,
        leadCount: delivered.length,
        charged: billed.charged,
      },
    );

    return {
      userId: sub.userId,
      status: emailStatus === "failed" ? "failed" : "sent",
      leadCount: delivered.length,
      creditsCharged: billed.charged,
      reason: emailStatus === "skipped" ? "email_opted_out" : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Digest failed";
    await prisma.digestSubscription.update({
      where: { id: sub.id },
      data: { lastError: message.slice(0, 500) },
    });
    await prisma.digestDelivery.create({
      data: {
        userId: sub.userId,
        subscriptionId: sub.id,
        leadCount: 0,
        leadIds: "[]",
        creditsCharged: 0,
        emailStatus: "failed",
        error: message.slice(0, 500),
      },
    });
    return { userId: sub.userId, status: "failed", reason: message };
  }
}

/**
 * Process enabled subscriptions whose local morning window has started and
 * that have not run yet today. Intended for an hourly cron.
 */
export async function processDueDailyDigests(opts?: {
  take?: number;
  /** Local hour to start sending (inclusive). Default 7. */
  morningHour?: number;
  force?: boolean;
}) {
  const take = opts?.take ?? 8;
  const morningHour = opts?.morningHour ?? 7;
  const force = Boolean(opts?.force);

  const subs = await prisma.digestSubscription.findMany({
    where: { enabled: true, user: { isActive: true } },
    orderBy: [{ lastRunAt: "asc" }, { createdAt: "asc" }],
    take: 80,
    select: { id: true, timezone: true, lastRunAt: true },
  });

  const due = subs.filter((s) => {
    if (force) return true;
    if (alreadyRanToday(s.lastRunAt, s.timezone)) return false;
    const hour = localHour(s.timezone);
    return hour >= morningHour && hour < morningHour + 3;
  }).slice(0, take);

  const results: DigestRunResult[] = [];
  for (const s of due) {
    results.push(await runDailyDigestForSubscription(s.id));
  }
  return results;
}

export { CREDIT_COSTS };
