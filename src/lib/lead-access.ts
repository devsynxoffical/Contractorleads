import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS } from "@/lib/constants";
import { deductCredits, logActivity } from "@/lib/credits";

const LOCKED = "••••";

/** Fields exposed before unlock — discovery only, no scrape-worthy contacts. */
export type LeadTeaserFields = {
  id: string;
  businessName: string;
  leadScore: number;
  qualityTier: string | null;
  industry: string | null;
  serviceCategory: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  unlocked: boolean;
};

export async function getUnlockedLeadIds(
  userId: string,
  leadIds: string[],
): Promise<Set<string>> {
  if (!leadIds.length) return new Set();
  const rows = await prisma.leadUnlock.findMany({
    where: { userId, leadId: { in: leadIds } },
    select: { leadId: true },
  });
  return new Set(rows.map((r) => r.leadId));
}

export async function isLeadUnlocked(userId: string, leadId: string) {
  const row = await prisma.leadUnlock.findUnique({
    where: { userId_leadId: { userId, leadId } },
    select: { id: true },
  });
  return Boolean(row);
}

/** Strip contact / enrichment PII until the user pays to unlock. */
export function redactLead<T extends Record<string, unknown>>(
  lead: T,
  unlocked: boolean,
): T & { unlocked: boolean } {
  if (unlocked) {
    return { ...lead, unlocked: true };
  }

  return {
    ...lead,
    unlocked: false,
    ownerName: null,
    ownerTitle: null,
    ownerSourceUrl: null,
    ownerConfidence: null,
    teamMembersJson: null,
    phone: null,
    email: null,
    emailSourceUrl: null,
    website: null,
    address: null,
    googleMapsLink: null,
    latitude: null,
    longitude: null,
    zip: null,
    outreachAngle: null,
    revenueRangeEstimate: null,
    facebook: null,
    instagram: null,
    tiktok: null,
    yelpUrl: null,
    nextdoor: null,
    houzzUrl: null,
    linkedinUrl: null,
    linkedinCompanyUrl: null,
    linkedinOwnerUrl: null,
    youtube: null,
    facebookAdsData: null,
    // Keep scores / city / business name for browsing
  } as T & { unlocked: boolean };
}

export async function redactLeadsForUser<T extends { id: string }>(
  userId: string,
  leads: T[],
) {
  const unlocked = await getUnlockedLeadIds(
    userId,
    leads.map((l) => l.id),
  );
  return leads.map((lead) =>
    redactLead(lead as T & Record<string, unknown>, unlocked.has(lead.id)),
  );
}

export async function unlockLeads(opts: {
  userId: string;
  leadIds: string[];
  /** Require ownership via search or saved */
  assertOwned?: boolean;
}) {
  const uniqueIds = [...new Set(opts.leadIds.filter(Boolean))];
  if (!uniqueIds.length) {
    return { unlockedIds: [] as string[], charged: 0, creditsRemaining: null as number | null };
  }

  let ownedIds = uniqueIds;
  if (opts.assertOwned !== false) {
    const owned = await prisma.lead.findMany({
      where: {
        id: { in: uniqueIds },
        OR: [
          { search: { userId: opts.userId } },
          { savedBy: { some: { userId: opts.userId } } },
        ],
      },
      select: { id: true },
    });
    ownedIds = owned.map((l) => l.id);
  }

  if (!ownedIds.length) {
    throw new Error("LEAD_NOT_FOUND");
  }

  const already = await getUnlockedLeadIds(opts.userId, ownedIds);
  const toUnlock = ownedIds.filter((id) => !already.has(id));

  if (!toUnlock.length) {
    const user = await prisma.user.findUnique({
      where: { id: opts.userId },
      select: { creditsRemaining: true },
    });
    return {
      unlockedIds: ownedIds,
      charged: 0,
      creditsRemaining: user?.creditsRemaining ?? null,
    };
  }

  const cost =
    Math.round(CREDIT_COSTS.lead * toUnlock.length * 100) / 100;

  await deductCredits(
    opts.userId,
    cost,
    "lead_export",
    toUnlock.length === 1 ? toUnlock[0] : `${toUnlock.length}_leads`,
  );

  await prisma.leadUnlock.createMany({
    data: toUnlock.map((leadId) => ({
      userId: opts.userId,
      leadId,
      credits: CREDIT_COSTS.lead,
    })),
    skipDuplicates: true,
  });

  await logActivity(
    opts.userId,
    "lead_export",
    `Exported / billed ${toUnlock.length} lead${toUnlock.length === 1 ? "" : "s"} (${cost} credits)`,
    { leadIds: toUnlock, cost },
  );

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { creditsRemaining: true },
  });

  return {
    unlockedIds: [...already, ...toUnlock],
    charged: cost,
    newlyUnlocked: toUnlock,
    creditsRemaining: user?.creditsRemaining ?? null,
  };
}

/** Soft anti-scrape: limit how often a user can run Lead Finder. */
export async function assertSearchRateLimit(userId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.search.count({
    where: { userId, createdAt: { gte: since } },
  });
  const MAX_PER_HOUR = 40;
  if (count >= MAX_PER_HOUR) {
    return {
      ok: false as const,
      error: `Search rate limit reached (${MAX_PER_HOUR}/hour). Try again later.`,
    };
  }
  return { ok: true as const };
}

export function lockedContactPlaceholder() {
  return LOCKED;
}

export function insufficientCreditsPayload(needed: number, balance: number) {
  return {
    error: `Insufficient credits to export. Export costs ${needed.toFixed(2)} credits (you have ${balance.toFixed(2)}). Purchase or upgrade a plan on Billing.`,
    code: "INSUFFICIENT_CREDITS",
    needed,
    balance,
    upgradeUrl: "/billing",
  };
}

/** How many unpaid leads the user can still export with current balance. */
export function maxExportableFromBalance(balance: number) {
  return Math.max(0, Math.floor(balance / CREDIT_COSTS.lead + 1e-9));
}

/**
 * Lead generation capacity: credit slots minus owned leads not yet exported/paid.
 * Prevents generating more inventory than the user can export with current credits.
 */
export async function getLeadGenerationCapacity(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsRemaining: true },
  });
  const balance = user?.creditsRemaining ?? 0;
  const creditSlots = maxExportableFromBalance(balance);

  const unpaidOwned = await prisma.lead.count({
    where: {
      search: { userId },
      unlocks: { none: { userId } },
    },
  });

  const available = Math.max(0, creditSlots - unpaidOwned);

  return {
    balance,
    creditSlots,
    unpaidOwned,
    available,
    costPerLead: CREDIT_COSTS.lead,
  };
}

export function leadLimitPayload(capacity: {
  available: number;
  creditSlots: number;
  unpaidOwned: number;
  balance: number;
}) {
  return {
    error:
      capacity.available <= 0
        ? capacity.unpaidOwned > 0
          ? `Lead limit reached. You have ${capacity.unpaidOwned} lead${capacity.unpaidOwned === 1 ? "" : "s"} waiting to export and ${capacity.balance.toFixed(2)} credits (~${capacity.creditSlots} export slots). Export existing leads or purchase more credits on Billing.`
          : `No lead capacity left. You have ${capacity.balance.toFixed(2)} credits. Purchase a plan on Billing to generate more leads.`
        : `You can generate at most ${capacity.available} more lead${capacity.available === 1 ? "" : "s"} with your current credits.`,
    code: "LEAD_LIMIT",
    ...capacity,
    upgradeUrl: "/billing",
  };
}
