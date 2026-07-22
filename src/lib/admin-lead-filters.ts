import type { Prisma } from "@prisma/client";

export type AdminLeadFilterInput = {
  industry?: string;
  country?: string;
  city?: string;
  q?: string;
  when?: string;
  tier?: string;
  strength?: string;
  userId?: string;
  sort?: string;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDaysAgo(days: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - days);
  return d;
}

export function buildAdminLeadWhere(
  input: AdminLeadFilterInput,
): Prisma.LeadWhereInput {
  const industry = input.industry?.trim() ?? "";
  const country = input.country?.trim() ?? "";
  const city = input.city?.trim() ?? "";
  const q = input.q?.trim() ?? "";
  const when = input.when ?? "all";
  const tier = input.tier ?? "all";
  const strength = input.strength ?? "all";
  const userId = input.userId?.trim() ?? "";

  const where: Prisma.LeadWhereInput = {
    ...(industry ? { industry: { equals: industry, mode: "insensitive" } } : {}),
    ...(country ? { country } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
  };

  if (q) {
    where.OR = [
      { businessName: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
    ];
  }

  if (when === "today") {
    where.createdAt = { gte: startOfToday() };
  } else if (when === "week") {
    where.createdAt = { gte: startOfDaysAgo(7) };
  } else if (when === "month") {
    where.createdAt = { gte: startOfDaysAgo(30) };
  }

  if (tier === "hot" || tier === "warm" || tier === "nurture") {
    where.qualityTier = tier;
  }

  if (strength === "strong") {
    where.leadScore = { gte: 75 };
  } else if (strength === "medium") {
    where.leadScore = { gte: 50, lt: 75 };
  } else if (strength === "developing") {
    where.leadScore = { lt: 50 };
  }

  if (userId) {
    where.search = { userId };
  }

  return where;
}

export function adminLeadOrderBy(
  sort?: string,
): Prisma.LeadOrderByWithRelationInput {
  if (sort === "score") return { leadScore: "desc" };
  if (sort === "oldest") return { createdAt: "asc" };
  return { createdAt: "desc" };
}

export function parseAdminLeadFilters(
  searchParams: URLSearchParams,
): AdminLeadFilterInput {
  return {
    industry: searchParams.get("industry") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    when: searchParams.get("when") ?? undefined,
    tier: searchParams.get("tier") ?? undefined,
    strength: searchParams.get("strength") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  };
}
