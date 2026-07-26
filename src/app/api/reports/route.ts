import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPlanFeatureApi } from "@/lib/plan-access-server";
import { LEAD_STATUSES } from "@/lib/constants";

export type ReportLeadRow = {
  id: string;
  savedLeadId: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  leadScore: number;
  qualityTier: string | null;
  status: string;
  googleRating: number | null;
  reviewCount: number | null;
  updatedAt: string;
};

function parseFilters(url: URL) {
  const status = url.searchParams.get("status")?.trim() || "";
  const quality = url.searchParams.get("quality")?.trim() || "";
  const industry = url.searchParams.get("industry")?.trim() || "";
  const from = url.searchParams.get("from")?.trim() || "";
  const to = url.searchParams.get("to")?.trim() || "";
  const q = url.searchParams.get("q")?.trim() || "";
  const take = Math.min(
    500,
    Math.max(1, Number(url.searchParams.get("take") ?? 200) || 200),
  );
  return { status, quality, industry, from, to, q, take };
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locked = assertPlanFeatureApi(user, "reports");
  if (locked) return locked;

  const { status, quality, industry, from, to, q, take } = parseFilters(
    new URL(request.url),
  );

  const where: Record<string, unknown> = { userId: user.id };
  if (status && LEAD_STATUSES.some((s) => s.value === status)) {
    where.status = status;
  }
  if (from || to) {
    const updatedAt: { gte?: Date; lte?: Date } = {};
    if (from) {
      const d = new Date(from);
      if (!Number.isNaN(d.getTime())) updatedAt.gte = d;
    }
    if (to) {
      const d = new Date(to);
      if (!Number.isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        updatedAt.lte = d;
      }
    }
    if (Object.keys(updatedAt).length) where.updatedAt = updatedAt;
  }

  const leadWhere: Record<string, unknown> = {};
  if (quality && ["hot", "warm", "nurture"].includes(quality)) {
    leadWhere.qualityTier = quality;
  }
  if (industry) {
    leadWhere.industry = { equals: industry, mode: "insensitive" };
  }
  if (q) {
    leadWhere.OR = [
      { businessName: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (Object.keys(leadWhere).length) where.lead = leadWhere;

  const [saved, industriesRaw, statusGroups] = await Promise.all([
    prisma.savedLead.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phone: true,
            email: true,
            website: true,
            city: true,
            state: true,
            industry: true,
            leadScore: true,
            qualityTier: true,
            googleRating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take,
    }),
    prisma.savedLead.findMany({
      where: { userId: user.id },
      select: { lead: { select: { industry: true } } },
      take: 500,
    }),
    prisma.savedLead.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    }),
  ]);

  const leads: ReportLeadRow[] = saved.map((s) => ({
    id: s.lead.id,
    savedLeadId: s.id,
    businessName: s.lead.businessName,
    ownerName: s.lead.ownerName,
    phone: s.lead.phone,
    email: s.lead.email,
    website: s.lead.website,
    city: s.lead.city,
    state: s.lead.state,
    industry: s.lead.industry,
    leadScore: s.lead.leadScore,
    qualityTier: s.lead.qualityTier,
    status: s.status,
    googleRating: s.lead.googleRating,
    reviewCount: s.lead.reviewCount,
    updatedAt: s.updatedAt.toISOString(),
  }));

  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
  const byQuality = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.qualityTier || "nurture";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const hot = byQuality.hot || 0;
  const avgScore = leads.length
    ? Math.round(leads.reduce((n, l) => n + (l.leadScore || 0), 0) / leads.length)
    : 0;

  const industries = [
    ...new Set(
      industriesRaw
        .map((r) => r.lead.industry?.trim())
        .filter((v): v is string => Boolean(v)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    agency: {
      companyName: user.companyName,
      name: user.name,
      email: user.email,
    },
    summary: {
      total: leads.length,
      hot,
      warm: byQuality.warm || 0,
      nurture: byQuality.nurture || 0,
      avgScore,
      closed: byStatus.closed || 0,
      byStatus,
      byQuality,
    },
    pipelineTotals: Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all]),
    ),
    industries,
    statuses: LEAD_STATUSES,
    leads,
    generatedAt: new Date().toISOString(),
  });
}
