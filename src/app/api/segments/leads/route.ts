import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { startOfDaysAgo, startOfToday } from "@/lib/lead-date-filters";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const segmentId = url.searchParams.get("segmentId") || url.searchParams.get("id");
  const limitParam = Number(url.searchParams.get("limit") || "200");
  const take = Math.min(500, Math.max(1, Number.isFinite(limitParam) ? limitParam : 200));

  let industry = url.searchParams.get("industry") || url.searchParams.get("category");
  let when = url.searchParams.get("when") || "all";
  let tier = url.searchParams.get("tier") || "all";
  let strength = url.searchParams.get("strength") || "all";
  let q = url.searchParams.get("q")?.trim() || "";
  let sort = url.searchParams.get("sort") || "newest";
  let segmentName: string | null = null;

  if (segmentId) {
    const segment = await prisma.leadSegment.findFirst({
      where: { id: segmentId, userId: user.id },
    });
    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }
    segmentName = segment.name;
    if (segment.industry) industry = segment.industry;
    if (segment.when) when = segment.when;
    if (segment.tier) tier = segment.tier;
    if (segment.strength) strength = segment.strength;
    if (segment.q) q = segment.q;
    if (segment.sort) sort = segment.sort;
  }

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
      { state: { contains: queryClean(q), mode: "insensitive" } },
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
      take,
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({
    segmentId: segmentId || null,
    segmentName,
    filters: { industry, when, tier, strength, q, sort },
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

function queryClean(q: string) {
  return q.trim();
}
