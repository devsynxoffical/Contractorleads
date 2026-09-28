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

  // Calculate accurate lead counts from stored lead IDs or record count
  const segments = rawSegments.map((s) => {
    let count = s.leadCount ?? 0;
    if (s.leadIdsJson) {
      try {
        const parsed = JSON.parse(s.leadIdsJson);
        if (Array.isArray(parsed)) {
          count = parsed.length;
        }
      } catch {
        /* ignore */
      }
    }

    return {
      ...s,
      leadCount: count,
    };
  });

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

  const leadIds = Array.isArray(body.leadIds)
    ? body.leadIds.filter((id): id is string => typeof id === "string")
    : null;
  const leadCount = typeof body.leadCount === "number" ? body.leadCount : (leadIds ? leadIds.length : 0);
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
