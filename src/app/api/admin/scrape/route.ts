import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";
import { resolveSearchCriteria } from "@/lib/search-criteria";

const leadSelect = {
  id: true,
  businessName: true,
  ownerName: true,
  phone: true,
  email: true,
  website: true,
  city: true,
  state: true,
  country: true,
  industry: true,
  leadScore: true,
  qualityTier: true,
  createdAt: true,
} as const;

/** List scraped niches (with counts) or leads for a niche. */
export async function GET(request: Request) {
  const admin = await requirePermission("scrape");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry")?.trim() ?? "";
  const take = Math.min(
    200,
    Math.max(1, Number(searchParams.get("take") ?? 100) || 100),
  );

  if (industry) {
    const where = {
      industry: { equals: industry, mode: "insensitive" as const },
    };
    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { leadScore: "desc" }],
        take,
        select: leadSelect,
      }),
    ]);
    return NextResponse.json({ industry, total, leads });
  }

  const grouped = await prisma.lead.groupBy({
    by: ["industry"],
    where: { industry: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { industry: "desc" } },
    take: 200,
  });

  const niches = grouped
    .map((row) => ({
      name: row.industry?.trim() ?? "",
      count: row._count._all,
    }))
    .filter((n) => n.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ niches });
}

export async function POST(request: Request) {
  const admin = await requirePermission("scrape");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const resolved = resolveSearchCriteria(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_PLACES_API_KEY is not configured" },
        { status: 503 },
      );
    }

    const {
      industry,
      country,
      locationScope,
      state,
      city,
      zip,
      customLocation,
      radius,
      requireSocialPresence,
      targetLeadCount,
    } = resolved.criteria;

    const result = await runLeadPipeline({
      userId: admin.id,
      industry,
      country,
      locationScope,
      state,
      city,
      zip,
      customLocation,
      radius,
      requireSocialPresence,
      targetLeadCount,
    });

    await logActivity(
      admin.id,
      "admin_scrape",
      `Admin scraped ${result.leads.length} leads for ${industry}`,
      { searchId: result.search.id },
    );

    const credits = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { creditsRemaining: true },
    });

    return NextResponse.json({
      search: result.search,
      leads: result.leads,
      creditsRemaining: credits?.creditsRemaining,
      meta: result.meta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
