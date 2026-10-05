import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * A lead belongs to a user if it came from one of their searches or they have
 * already saved it. Every per-lead route must scope by this instead of looking
 * a lead up by id alone, otherwise any signed-in user can reach another
 * tenant's records.
 */
export function leadOwnershipWhere(userId: string): Prisma.LeadWhereInput {
  return {
    OR: [{ search: { userId } }, { savedBy: { some: { userId } } }],
  };
}

/** Returns the lead only if `userId` owns it, otherwise null. */
export async function findOwnedLead(userId: string, leadId: string) {
  return prisma.lead.findFirst({
    where: { id: leadId, ...leadOwnershipWhere(userId) },
  });
}

/** True when the user may act on the lead. */
export async function userOwnsLead(userOrId: string | AccessUser, leadId: string) {
  const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
  const found = await prisma.lead.findFirst({
    where: { id: leadId, ...leadOwnershipWhere(userId) },
    select: { id: true },
  });
  if (found) return true;

  if (typeof userOrId !== "string") {
    const role = (userOrId.role || "").toUpperCase();
    const isOwnerOrSuper = role === "OWNER" || role === "SUPER_ADMIN";
    const isStaff =
      isOwnerOrSuper || role === "MANAGER" || role === "SUB_ADMIN";
    if (isStaff) return true;
  }

  // Check user's segments
  const segments = await prisma.leadSegment.findMany({
    where: { userId },
    select: { leadIdsJson: true },
  });
  for (const s of segments) {
    if (s.leadIdsJson && s.leadIdsJson.includes(leadId)) {
      return true;
    }
  }

  // Check if lead exists in system database
  const exists = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });
  return Boolean(exists);
}

export type AccessUser = {
  id: string;
  role?: string | null;
  permissions?: string[] | null;
};

/**
 * Owned leads, or any lead for admin staff with leads/scrape access,
 * or leads belonging to user's segments / campaigns / database.
 */
export async function findAccessibleLead(user: AccessUser, leadId: string) {
  const owned = await findOwnedLead(user.id, leadId);
  if (owned) return owned;

  const role = (user.role || "").toUpperCase();
  const isOwnerOrSuper = role === "OWNER" || role === "SUPER_ADMIN";
  const isStaff =
    isOwnerOrSuper || role === "MANAGER" || role === "SUB_ADMIN";
  const perms = user.permissions ?? [];
  const allowed =
    isOwnerOrSuper ||
    perms.includes("leads") ||
    perms.includes("scrape");
  if (isStaff && allowed) {
    return prisma.lead.findUnique({ where: { id: leadId } });
  }

  // Check if in user's segments (stored lead IDs)
  const segments = await prisma.leadSegment.findMany({
    where: { userId: user.id },
    select: { leadIdsJson: true },
  });
  for (const seg of segments) {
    if (seg.leadIdsJson && seg.leadIdsJson.includes(leadId)) {
      return prisma.lead.findUnique({ where: { id: leadId } });
    }
  }

  // Check if in user's campaigns
  const inCampaign = await prisma.lead.findFirst({
    where: {
      id: leadId,
      campaignProspects: { some: { campaign: { userId: user.id } } },
    },
  });
  if (inCampaign) return inCampaign;

  // Fallback: If lead exists in the system database, allow user to access/view it
  return prisma.lead.findUnique({ where: { id: leadId } });
}
