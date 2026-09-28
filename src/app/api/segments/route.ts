import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const ALLOWED_WHEN = ["all", "today", "yesterday", "week", "month", "90days"];
const ALLOWED_TIER = ["all", "hot", "warm", "nurture"];
const ALLOWED_STRENGTH = ["all", "strong", "medium", "developing"];
const ALLOWED_SORT = ["newest", "score", "oldest"];
const MAX_SEGMENTS = 50;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawSegments = await prisma.leadSegment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      industry: true,
      country: true,
      state: true,
      city: true,
      leadCount: true,
      leadIdsJson: true,
      when: true,
      tier: true,
      strength: true,
      q: true,
      sort: true,
      createdAt: true,
      _count: {
        select: { campaigns: true },
      },
    },
  });

  // Calculate accurate lead counts and auto-heal empty segments
  const segments = await Promise.all(
    rawSegments.map(async (s) => {
      let count = s.leadCount ?? 0;
      let leadIds: string[] = [];

      if (s.leadIdsJson) {
        try {
          const parsed = JSON.parse(s.leadIdsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            leadIds = parsed;
            count = parsed.length;
          }
        } catch {
          /* ignore */
        }
      }

      // If count is still 0, dynamically match leads from the database
      if (count === 0) {
        try {
          const isGeneral =
            !s.industry ||
            s.industry.toLowerCase().includes("general") ||
            s.industry.toLowerCase() === "all";

          const indFilter: Prisma.LeadWhereInput = !isGeneral
            ? {
                OR: [
                  { industry: { equals: s.industry!, mode: "insensitive" } },
                  { serviceCategory: { equals: s.industry!, mode: "insensitive" } },
                ],
              }
            : {};

          const baseWhere: Prisma.LeadWhereInput = {
            AND: [
              indFilter,
              s.state ? { state: { contains: s.state, mode: "insensitive" } } : {},
              s.city ? { city: { contains: s.city, mode: "insensitive" } } : {},
              s.q ? { businessName: { contains: s.q, mode: "insensitive" } } : {},
            ],
          };

          // Try user's searches / saved leads first
          let matchingLeads = await prisma.lead.findMany({
            where: {
              AND: [
                {
                  OR: [
                    { search: { userId: user.id } },
                    { savedBy: { some: { userId: user.id } } },
                  ],
                },
                baseWhere,
              ],
            },
            select: { id: true },
            take: 500,
          });

          // Fallback to all leads in DB if none found under specific search
          if (matchingLeads.length === 0) {
            matchingLeads = await prisma.lead.findMany({
              where: baseWhere,
              select: { id: true },
              take: 500,
            });
          }

          if (matchingLeads.length > 0) {
            count = matchingLeads.length;
            leadIds = matchingLeads.map((m) => m.id);

            // Auto-heal segment in DB so it permanently stores the lead IDs
            void prisma.leadSegment
              .update({
                where: { id: s.id },
                data: {
                  leadCount: count,
                  leadIdsJson: JSON.stringify(leadIds),
                },
              })
              .catch(() => {});
          }
        } catch {
          /* ignore */
        }
      }

      return {
        ...s,
        leadCount: count,
        leadIdsJson: leadIds.length > 0 ? JSON.stringify(leadIds) : s.leadIdsJson,
      };
    }),
  );

  return NextResponse.json({ segments });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  if (!name) return NextResponse.json({ error: "Segment name is required." }, { status: 400 });

  // Check limit
  const count = await prisma.leadSegment.count({ where: { userId: user.id } });
  if (count >= MAX_SEGMENTS) {
    return NextResponse.json(
      { error: `You can save up to ${MAX_SEGMENTS} segments. Delete one first.` },
      { status: 400 },
    );
  }

  const industry = typeof body.industry === "string" ? body.industry.trim() || null : null;
  const country = typeof body.country === "string" ? body.country.trim() || "US" : "US";
  const state = typeof body.state === "string" ? body.state.trim() || null : null;
  const city = typeof body.city === "string" ? body.city.trim() || null : null;
  const q = typeof body.q === "string" ? body.q.trim().slice(0, 100) || null : null;

  let leadIds = Array.isArray(body.leadIds)
    ? body.leadIds.filter((id): id is string => typeof id === "string")
    : null;
  let leadCount = typeof body.leadCount === "number" ? body.leadCount : (leadIds ? leadIds.length : 0);

  // If no lead IDs provided, query matching leads from database
  if (!leadIds || leadIds.length === 0) {
    try {
      const isGeneral =
        !industry ||
        industry.toLowerCase().includes("general") ||
        industry.toLowerCase() === "all";

      const indFilter: Prisma.LeadWhereInput = !isGeneral
        ? {
            OR: [
              { industry: { equals: industry, mode: "insensitive" } },
              { serviceCategory: { equals: industry, mode: "insensitive" } },
            ],
          }
        : {};

      const baseWhere: Prisma.LeadWhereInput = {
        AND: [
          indFilter,
          state ? { state: { contains: state, mode: "insensitive" } } : {},
          city ? { city: { contains: city, mode: "insensitive" } } : {},
          q ? { businessName: { contains: q, mode: "insensitive" } } : {},
        ],
      };

      let leads = await prisma.lead.findMany({
        where: {
          AND: [
            {
              OR: [
                { search: { userId: user.id } },
                { savedBy: { some: { userId: user.id } } },
              ],
            },
            baseWhere,
          ],
        },
        select: { id: true },
        take: 500,
      });

      if (leads.length === 0) {
        leads = await prisma.lead.findMany({
          where: baseWhere,
          select: { id: true },
          take: 500,
        });
      }

      if (leads.length > 0) {
        leadIds = leads.map((l) => l.id);
        leadCount = leads.length;
      }
    } catch {
      /* ignore */
    }
  }

  const leadIdsJson = leadIds && leadIds.length > 0 ? JSON.stringify(leadIds) : null;

  const when =
    typeof body.when === "string" && ALLOWED_WHEN.includes(body.when) ? body.when : null;
  const tier =
    typeof body.tier === "string" && ALLOWED_TIER.includes(body.tier) ? body.tier : null;
  const strength =
    typeof body.strength === "string" && ALLOWED_STRENGTH.includes(body.strength)
      ? body.strength
      : null;
  const sort =
    typeof body.sort === "string" && ALLOWED_SORT.includes(body.sort) ? body.sort : null;

  const segment = await prisma.leadSegment.create({
    data: {
      userId: user.id,
      name,
      industry,
      country,
      state,
      city,
      leadCount,
      leadIdsJson,
      when,
      tier,
      strength,
      q,
      sort,
    },
  });

  return NextResponse.json({ segment }, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "Segment ID is required" }, { status: 400 });
  }

  const existing = await prisma.leadSegment.findFirst({
    where: { id: body.id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Segment not found" }, { status: 404 });
  }

  let currentLeadIds: string[] = [];
  if (existing.leadIdsJson) {
    try {
      const parsed = JSON.parse(existing.leadIdsJson);
      if (Array.isArray(parsed)) currentLeadIds = parsed;
    } catch {
      /* ignore */
    }
  }

  // Handle removing a specific lead ID
  if (typeof body.removeLeadId === "string") {
    currentLeadIds = currentLeadIds.filter((id) => id !== body.removeLeadId);
  }

  // Handle removing multiple lead IDs
  if (Array.isArray(body.removeLeadIds)) {
    const toRemove = new Set(body.removeLeadIds);
    currentLeadIds = currentLeadIds.filter((id) => !toRemove.has(id));
  }

  // Handle adding more lead IDs
  if (Array.isArray(body.addLeadIds)) {
    const toAdd = body.addLeadIds.filter((id): id is string => typeof id === "string");
    currentLeadIds = Array.from(new Set([...currentLeadIds, ...toAdd]));
  }

  // Explicit replace of all leadIds
  if (Array.isArray(body.leadIds)) {
    currentLeadIds = body.leadIds.filter((id): id is string => typeof id === "string");
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : existing.name;
  const industry = typeof body.industry === "string" ? body.industry.trim() || null : existing.industry;
  const country = typeof body.country === "string" ? body.country.trim() || "US" : existing.country;
  const state = typeof body.state === "string" ? body.state.trim() || null : existing.state;
  const city = typeof body.city === "string" ? body.city.trim() || null : existing.city;
  const leadCount = currentLeadIds.length > 0 ? currentLeadIds.length : (typeof body.leadCount === "number" ? body.leadCount : existing.leadCount);
  const leadIdsJson = currentLeadIds.length > 0 ? JSON.stringify(currentLeadIds) : (body.leadIds ? JSON.stringify(body.leadIds) : existing.leadIdsJson);

  const updated = await prisma.leadSegment.update({
    where: { id: existing.id },
    data: {
      name,
      industry,
      country,
      state,
      city,
      leadCount,
      leadIdsJson,
    },
  });

  return NextResponse.json({ segment: updated, leadCount: updated.leadCount });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.leadSegment.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.leadSegment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
