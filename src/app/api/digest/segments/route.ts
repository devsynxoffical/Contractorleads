import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INDUSTRIES, TIER_ONE_COUNTRIES, getRegionsForCountry } from "@/lib/constants";
import { DIGEST_LEAD_COUNTS, isDigestLeadCount } from "@/lib/services/daily-digest";

const MAX_DIGEST_SEGMENTS = 10;

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "Europe/London",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [segments, options] = await Promise.all([
    prisma.digestEmailSegment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    Promise.resolve({
      industries: INDUSTRIES,
      countries: TIER_ONE_COUNTRIES.map((c) => ({
        code: c.code,
        name: c.name,
        regionLabel: c.regionLabel,
      })),
      leadCounts: [...DIGEST_LEAD_COUNTS],
      timezones: TIMEZONES,
      regionsByCountry: Object.fromEntries(
        TIER_ONE_COUNTRIES.map((c) => [c.code, getRegionsForCountry(c.code)]),
      ),
    }),
  ]);

  return NextResponse.json({
    segments: segments.map((s) => ({
      id: s.id,
      name: s.name,
      enabled: s.enabled,
      industry: s.industry,
      country: s.country,
      locationScope: s.locationScope,
      state: s.state,
      city: s.city,
      dailyLeadCount: s.dailyLeadCount,
      timezone: s.timezone,
      lastRunAt: s.lastRunAt?.toISOString() ?? null,
      lastError: s.lastError,
    })),
    options,
  });
}

function validate(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return { ok: false as const, error: "Segment name is required." };

  const industry = typeof body.industry === "string" ? body.industry.trim() : "";
  if (!industry || !(INDUSTRIES as readonly string[]).includes(industry)) {
    return { ok: false as const, error: "Pick a valid industry." };
  }

  const country =
    typeof body.country === "string" ? body.country.trim().toUpperCase() : "US";
  if (!TIER_ONE_COUNTRIES.some((c) => c.code === country)) {
    return { ok: false as const, error: "Pick a valid country." };
  }

  const locationScope = body.locationScope === "country" ? "country" : "local";
  const state =
    typeof body.state === "string" && body.state.trim()
      ? body.state.trim().toUpperCase()
      : null;
  const city =
    typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;

  if (locationScope === "local" && !state && !city) {
    return { ok: false as const, error: "Choose a state/region (or entire country)." };
  }

  if (state) {
    const regions = getRegionsForCountry(country);
    if (!regions.some((r) => r.code === state)) {
      return { ok: false as const, error: "Invalid state/region for that country." };
    }
  }

  const dailyLeadCount = Number(body.dailyLeadCount);
  if (!isDigestLeadCount(dailyLeadCount)) {
    return { ok: false as const, error: "Daily leads must be 20, 50, or 100." };
  }

  const timezone =
    typeof body.timezone === "string" && body.timezone.trim()
      ? body.timezone.trim()
      : "America/Chicago";

  const enabled = body.enabled !== false;

  return {
    ok: true as const,
    data: {
      name,
      enabled,
      industry,
      country,
      locationScope,
      state: locationScope === "country" ? null : state,
      city: locationScope === "country" ? null : city,
      dailyLeadCount,
      timezone,
    },
  };
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const count = await prisma.digestEmailSegment.count({ where: { userId: user.id } });
  if (count >= MAX_DIGEST_SEGMENTS) {
    return NextResponse.json(
      { error: `You can have up to ${MAX_DIGEST_SEGMENTS} digest segments. Delete one first.` },
      { status: 400 },
    );
  }

  const v = validate(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const segment = await prisma.digestEmailSegment.create({
    data: { userId: user.id, ...v.data },
  });

  return NextResponse.json(
    {
      segment: {
        id: segment.id,
        name: segment.name,
        enabled: segment.enabled,
        industry: segment.industry,
        country: segment.country,
        locationScope: segment.locationScope,
        state: segment.state,
        city: segment.city,
        dailyLeadCount: segment.dailyLeadCount,
        timezone: segment.timezone,
        lastRunAt: null,
        lastError: null,
      },
    },
    { status: 201 },
  );
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const existing = await prisma.digestEmailSegment.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Allow toggling enabled without full validation
  if (Object.keys(body).length === 1 && "enabled" in body) {
    const updated = await prisma.digestEmailSegment.update({
      where: { id },
      data: { enabled: Boolean(body.enabled) },
    });
    return NextResponse.json({ ok: true, enabled: updated.enabled });
  }

  const v = validate({ ...body });
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const updated = await prisma.digestEmailSegment.update({
    where: { id },
    data: { ...v.data },
  });

  return NextResponse.json({
    ok: true,
    segment: {
      id: updated.id,
      name: updated.name,
      enabled: updated.enabled,
      industry: updated.industry,
      country: updated.country,
      locationScope: updated.locationScope,
      state: updated.state,
      city: updated.city,
      dailyLeadCount: updated.dailyLeadCount,
      timezone: updated.timezone,
      lastRunAt: updated.lastRunAt?.toISOString() ?? null,
      lastError: updated.lastError,
    },
  });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.digestEmailSegment.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.digestEmailSegment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
