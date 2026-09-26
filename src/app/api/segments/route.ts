import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_WHEN = ["all", "today", "yesterday", "week", "month", "90days"];
const ALLOWED_TIER = ["all", "hot", "warm", "nurture"];
const ALLOWED_STRENGTH = ["all", "strong", "medium", "developing"];
const ALLOWED_SORT = ["newest", "score", "oldest"];
const MAX_SEGMENTS = 20;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const segments = await prisma.leadSegment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      industry: true,
      when: true,
      tier: true,
      strength: true,
      q: true,
      sort: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ segments });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
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
  const when =
    typeof body.when === "string" && ALLOWED_WHEN.includes(body.when) ? body.when : null;
  const tier =
    typeof body.tier === "string" && ALLOWED_TIER.includes(body.tier) ? body.tier : null;
  const strength =
    typeof body.strength === "string" && ALLOWED_STRENGTH.includes(body.strength)
      ? body.strength
      : null;
  const q = typeof body.q === "string" ? body.q.trim().slice(0, 100) || null : null;
  const sort =
    typeof body.sort === "string" && ALLOWED_SORT.includes(body.sort) ? body.sort : null;

  const segment = await prisma.leadSegment.create({
    data: {
      userId: user.id,
      name,
      industry,
      when,
      tier,
      strength,
      q,
      sort,
    },
  });

  return NextResponse.json({ segment }, { status: 201 });
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
