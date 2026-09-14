import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";
import { resolveSearchCriteria } from "@/lib/search-criteria";

const contactSelect = {
  id: true,
  businessName: true,
  ownerName: true,
  ownerTitle: true,
  ownerConfidence: true,
  teamMembersJson: true,
  peopleEnrichedAt: true,
  phone: true,
  email: true,
  emailSourceUrl: true,
  website: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  country: true,
  industry: true,
  serviceCategory: true,
  leadScore: true,
  qualityTier: true,
  googleRating: true,
  reviewCount: true,
  googleMapsLink: true,
  linkedinUrl: true,
  linkedinCompanyUrl: true,
  linkedinOwnerUrl: true,
  facebook: true,
  instagram: true,
  youtube: true,
  tiktok: true,
  createdAt: true,
} as const;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry")?.trim() ?? "";
  const filter = searchParams.get("filter")?.trim() ?? "all";
  const q = searchParams.get("q")?.trim() ?? "";
  const take = Math.min(
    1000,
    Math.max(1, Number(searchParams.get("take") ?? 100) || 100),
  );
  const skip = Math.max(0, Number(searchParams.get("skip") ?? 0) || 0);

  if (!industry) {
    // Return all niches with counts
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

    // Global contact stats across all leads
    const [totalLeads, totalEmails, totalPhones, totalOwners] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { email: { not: null } } }),
      prisma.lead.count({ where: { phone: { not: null } } }),
      prisma.lead.count({ where: { ownerName: { not: null } } }),
    ]);

    return NextResponse.json({
      niches,
      globalStats: {
        totalLeads,
        totalEmails,
        totalPhones,
        totalOwners,
      },
    });
  }

  // Build where clause for industry & optional contact filters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    industry: { equals: industry, mode: "insensitive" },
  };

  if (filter === "has_email") {
    where.email = { not: null };
  } else if (filter === "has_phone") {
    where.phone = { not: null };
  } else if (filter === "has_name") {
    where.ownerName = { not: null };
  } else if (filter === "has_social") {
    where.OR = [
      { linkedinUrl: { not: null } },
      { linkedinOwnerUrl: { not: null } },
      { linkedinCompanyUrl: { not: null } },
      { facebook: { not: null } },
      { instagram: { not: null } },
    ];
  } else if (filter === "complete") {
    where.email = { not: null };
    where.phone = { not: null };
    where.ownerName = { not: null };
  }

  if (q) {
    const qLower = q.toLowerCase();
    where.AND = [
      {
        OR: [
          { businessName: { contains: qLower, mode: "insensitive" } },
          { ownerName: { contains: qLower, mode: "insensitive" } },
          { email: { contains: qLower, mode: "insensitive" } },
          { phone: { contains: qLower, mode: "insensitive" } },
          { city: { contains: qLower, mode: "insensitive" } },
          { state: { contains: qLower, mode: "insensitive" } },
        ],
      },
    ];
  }

  // Fetch metrics for this niche
  const [
    totalNicheLeads,
    totalNicheEmails,
    totalNichePhones,
    totalNicheOwners,
    filteredTotal,
    leads,
  ] = await Promise.all([
    prisma.lead.count({
      where: { industry: { equals: industry, mode: "insensitive" } },
    }),
    prisma.lead.count({
      where: {
        industry: { equals: industry, mode: "insensitive" },
        email: { not: null },
      },
    }),
    prisma.lead.count({
      where: {
        industry: { equals: industry, mode: "insensitive" },
        phone: { not: null },
      },
    }),
    prisma.lead.count({
      where: {
        industry: { equals: industry, mode: "insensitive" },
        ownerName: { not: null },
      },
    }),
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { leadScore: "desc" }],
      take,
      skip,
      select: contactSelect,
    }),
  ]);

  return NextResponse.json({
    industry,
    stats: {
      total: totalNicheLeads,
      withEmail: totalNicheEmails,
      withPhone: totalNichePhones,
      withOwner: totalNicheOwners,
      filteredTotal,
    },
    leads,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const resolved = resolveSearchCriteria(body);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
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
      targetLeadCount,
    } = resolved.criteria;

    const wantsStream =
      body.stream === true ||
      request.headers.get("accept")?.includes("text/event-stream");

    if (wantsStream) {
      const responseStream = new TransformStream();
      const writer = responseStream.writable.getWriter();
      const encoder = new TextEncoder();

      const sendEvent = async (event: string, data: unknown) => {
        try {
          await writer.write(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          /* client disconnected */
        }
      };

      // Immediate handshake byte flush
      void writer.write(encoder.encode(": connected\n\n"));

      (async () => {
        try {
          await sendEvent("start", {
            targetLeadCount,
            industry,
            country,
          });

          const result = await runLeadPipeline({
            userId: user.id,
            industry,
            country,
            locationScope,
            state,
            city,
            zip,
            customLocation,
            radius,
            targetLeadCount,
            fastContactsOnly: true,
            onLeadDiscovered: async (lead, progress) => {
              await sendEvent("lead", {
                lead,
                current: progress.current,
                target: progress.target,
                placeName: progress.placeName,
                scanned: progress.scanned,
              });
            },
          });

          // Fetch fresh detailed records for the discovered batch
          const finalLeads = await prisma.lead.findMany({
            where: { id: { in: result.leads.map((l) => l.id) } },
            orderBy: [{ createdAt: "desc" }, { leadScore: "desc" }],
            select: contactSelect,
          });

          await logActivity(
            user.id,
            "bulk_finder",
            `Bulk email finder for ${industry}: ${finalLeads.length} leads discovered`,
            {
              industry,
              leadCount: finalLeads.length,
              country,
            },
          );

          await sendEvent("done", {
            message: `Discovered & enriched ${finalLeads.length} contacts for ${industry}`,
            leads: finalLeads,
            stats: result.stats,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Bulk contact search failed";
          await sendEvent("error", { error: message });
        } finally {
          try {
            await writer.close();
          } catch {
            /* ignore */
          }
        }
      })();

      return new Response(responseStream.readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // Non-streaming fallback
    const result = await runLeadPipeline({
      userId: user.id,
      industry,
      country,
      locationScope,
      state,
      city,
      zip,
      customLocation,
      radius,
      targetLeadCount,
      fastContactsOnly: true,
    });

    const leads = await prisma.lead.findMany({
      where: { id: { in: result.leads.map((l) => l.id) } },
      orderBy: [{ createdAt: "desc" }, { leadScore: "desc" }],
      select: contactSelect,
    });

    await logActivity(
      user.id,
      "bulk_finder",
      `Bulk email finder for ${industry}: ${leads.length} leads discovered`,
      { industry, leadCount: leads.length, country },
    );

    return NextResponse.json({
      ok: true,
      message: `Discovered & enriched ${leads.length} contacts`,
      leads,
      stats: result.stats,
    });
  } catch (error) {
    console.error("[bulk-finder error]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while finding bulk contacts",
      },
      { status: 500 },
    );
  }
}
