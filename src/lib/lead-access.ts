import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS } from "@/lib/constants";
import { roundCredits } from "@/lib/credits";

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

/**
 * Charge + unlock leads in one atomic transaction.
 * - Locks the user row so concurrent generate/export cannot double-bill.
 * - Re-checks already-unlocked leads inside the lock.
 * - Bills only the leads that still need unlocking (actual count).
 * - With allowPartial, unlocks as many as the balance covers instead of failing.
 */
export async function unlockLeads(opts: {
  userId: string;
  leadIds: string[];
  /** Require ownership via search or saved */
  assertOwned?: boolean;
  /** Ledger / activity action — default lead_export */
  action?: "lead_export" | "lead_generate";
  /** Unlock as many as balance allows (used by Lead Finder generate) */
  allowPartial?: boolean;
}) {
  const uniqueIds = [...new Set(opts.leadIds.filter(Boolean))];
  if (!uniqueIds.length) {
    return {
      unlockedIds: [] as string[],
      charged: 0,
      newlyUnlocked: [] as string[],
      skippedForCredits: 0,
      creditsRemaining: null as number | null,
    };
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

  const action = opts.action ?? "lead_export";
  const allowPartial = Boolean(opts.allowPartial);

  return prisma.$transaction(async (tx) => {
    // Serialize all credit mutations for this user
    await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${opts.userId} FOR UPDATE`;

    const user = await tx.user.findUnique({
      where: { id: opts.userId },
      select: { creditsRemaining: true },
    });
    if (!user) throw new Error("USER_NOT_FOUND");

    const alreadyRows = await tx.leadUnlock.findMany({
      where: { userId: opts.userId, leadId: { in: ownedIds } },
      select: { leadId: true },
    });
    const already = new Set(alreadyRows.map((r) => r.leadId));
    let toUnlock = ownedIds.filter((id) => !already.has(id));

    if (!toUnlock.length) {
      return {
        unlockedIds: ownedIds,
        charged: 0,
        newlyUnlocked: [] as string[],
        skippedForCredits: 0,
        creditsRemaining: roundCredits(user.creditsRemaining),
      };
    }

    const maxAffordable = Math.max(
      0,
      Math.floor(user.creditsRemaining / CREDIT_COSTS.lead + 1e-9),
    );

    let skippedForCredits = 0;
    if (toUnlock.length > maxAffordable) {
      if (!allowPartial || maxAffordable <= 0) {
        throw new Error("INSUFFICIENT_CREDITS");
      }
      skippedForCredits = toUnlock.length - maxAffordable;
      toUnlock = toUnlock.slice(0, maxAffordable);
    }

    const cost = roundCredits(CREDIT_COSTS.lead * toUnlock.length);

    const updated = await tx.user.updateMany({
      where: {
        id: opts.userId,
        creditsRemaining: { gte: cost },
      },
      data: { creditsRemaining: { decrement: cost } },
    });
    if (updated.count !== 1) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    await tx.leadUnlock.createMany({
      data: toUnlock.map((leadId) => ({
        userId: opts.userId,
        leadId,
        credits: CREDIT_COSTS.lead,
      })),
      skipDuplicates: true,
    });

    await tx.creditLedger.create({
      data: {
        userId: opts.userId,
        amount: -cost,
        action,
        reference:
          toUnlock.length === 1 ? toUnlock[0] : `${toUnlock.length}_leads`,
      },
    });

    const fresh = await tx.user.findUnique({
      where: { id: opts.userId },
      select: { creditsRemaining: true },
    });

    await tx.activityLog.create({
      data: {
        userId: opts.userId,
        type: action,
        message:
          action === "lead_generate"
            ? `Generated ${toUnlock.length} lead${toUnlock.length === 1 ? "" : "s"} (${cost} credits)`
            : `Exported / billed ${toUnlock.length} lead${toUnlock.length === 1 ? "" : "s"} (${cost} credits)`,
        metadata: JSON.stringify({
          leadIds: toUnlock,
          cost,
          skippedForCredits,
        }),
      },
    });

    return {
      unlockedIds: [...already, ...toUnlock],
      charged: cost,
      newlyUnlocked: toUnlock,
      skippedForCredits,
      creditsRemaining: roundCredits(fresh?.creditsRemaining ?? 0),
    };
  });
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
    error: `Insufficient credits. Need ${roundCredits(needed).toFixed(2)} credits (you have ${roundCredits(balance).toFixed(2)}). Purchase or upgrade a plan on Billing.`,
    code: "INSUFFICIENT_CREDITS",
    needed: roundCredits(needed),
    balance: roundCredits(balance),
    upgradeUrl: "/billing",
  };
}

/** How many unpaid leads the user can still generate/export with current balance. */
export function maxExportableFromBalance(balance: number) {
  return Math.max(0, Math.floor(balance / CREDIT_COSTS.lead + 1e-9));
}

/**
 * Lead generation capacity: credit slots minus owned leads not yet billed.
 * Prevents generating more inventory than the user can pay for.
 */
export async function getLeadGenerationCapacity(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditsRemaining: true },
  });
  const balance = roundCredits(user?.creditsRemaining ?? 0);
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
          ? `Lead limit reached. You have ${capacity.unpaidOwned} lead${capacity.unpaidOwned === 1 ? "" : "s"} waiting to be billed and ${capacity.balance.toFixed(2)} credits (~${capacity.creditSlots} slots). Export those leads or purchase more credits on Billing.`
          : `No lead capacity left. You have ${capacity.balance.toFixed(2)} credits. Purchase a plan on Billing to generate more leads.`
        : `You can generate at most ${capacity.available} more lead${capacity.available === 1 ? "" : "s"} with your current credits.`,
    code: "LEAD_LIMIT",
    ...capacity,
    upgradeUrl: "/billing",
  };
}
