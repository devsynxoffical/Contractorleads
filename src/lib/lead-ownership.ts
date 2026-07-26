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
export async function userOwnsLead(userId: string, leadId: string) {
  const found = await prisma.lead.findFirst({
    where: { id: leadId, ...leadOwnershipWhere(userId) },
    select: { id: true },
  });
  return Boolean(found);
}

type AccessUser = {
  id: string;
  role?: string | null;
  permissions?: string[] | null;
};

/**
 * Owned leads, or any lead for admin staff with leads/scrape access.
 * Used by lead-detail actions so the admin scrape console can use the
 * same profile UI as the agency app.
 */
export async function findAccessibleLead(user: AccessUser, leadId: string) {
  const owned = await findOwnedLead(user.id, leadId);
  if (owned) return owned;

  const role = (user.role || "").toUpperCase();
  const isOwnerOrSuper = role === "OWNER" || role === "SUPER_ADMIN";
  const isStaff =
    isOwnerOrSuper || role === "MANAGER" || role === "SUB_ADMIN";
  if (!isStaff) return null;

  const perms = user.permissions ?? [];
  const allowed =
    isOwnerOrSuper ||
    perms.includes("leads") ||
    perms.includes("scrape");
  if (!allowed) return null;

  return prisma.lead.findUnique({ where: { id: leadId } });
}
