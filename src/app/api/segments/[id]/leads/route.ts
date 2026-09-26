import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { startOfDaysAgo, startOfToday } from "@/lib/lead-date-filters";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: segmentId } = await params;
  if (!segmentId) {
    return NextResponse.json({ error: "Missing segment ID" }, { status: 400 });
  }

  const segment = await prisma.leadSegment.findFirst({
    where: { id: segmentId, userId: user.id },
  });

  if (!segment) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  const industry = segment.industry;
  const when = segment.when || "all";
  const tier = segment.tier || "all";
  const strength = segment.strength || "all";
  const q = segment.q || "";
  const sort = segment.sort || "newest";

  const searchFilter: Prisma.SearchWhereInput = {
    userId: user.id,
  };

  if (when === "today") {
    searchFilter.createdAt = { gte: startOfToday() };
  } else if (when === "yesterday") {
    searchFilter.createdAt = { gte: startOfDaysAgo(1), lt: startOfToday() };
  } else if (when === "week") {
    searchFilter.createdAt = { gte: startOfDaysAgo(7) };
  } else if (when === "month") {
    searchFilter.createdAt = { gte: startOfDaysAgo(30) };
  } else if (when === "90days") {
    searchFilter.createdAt = { gte: startOfDaysAgo(90) };
  }

  const where: Prisma.LeadWhereInput = {
    AND: [
      { email: { not: null } },
      { email: { not: "" } },
      { search: searchFilter },
    ],
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
      { address: { contains: q, mode: "insensitive" } },
    ];
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

  if (industry && industry !== "all") {
    where.industry = { equals: industry, mode: "insensitive" };
  }

  const orderBy: Prisma.LeadOrderByWithRelationInput[] =
    sort === "score"
      ? [{ leadScore: "desc" }, { createdAt: "desc" }]
      : sort === "oldest"
        ? [{ search: { createdAt: "asc" } }, { createdAt: "asc" }]
        : [{ search: { createdAt: "desc" } }, { leadScore: "desc" }];

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        industry: true,
        qualityTier: true,
        leadScore: true,
        createdAt: true,
      },
      orderBy,
      take: 200,
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({
    segment,
    total,
    leads: leads.map((l) => ({
      id: l.id,
      businessName: l.businessName,
      ownerName: l.ownerName,
      email: l.email,
      phone: l.phone,
      city: l.city,
      state: l.state,
      industry: l.industry,
      qualityTier: l.qualityTier,
      leadScore: l.leadScore,
      status: "lead",
    })),
  });
}
