import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";
import { resolveSearchCriteria } from "@/lib/search-criteria";

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
