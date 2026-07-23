import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamSeatLimit } from "@/lib/plans";
import { userHasPlanFeature } from "@/lib/plan-access";

const ROLES = new Set(["admin", "member", "viewer"]);

async function requireOwner() {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { user };
}

export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth && auth.error) return auth.error;
  const user = auth.user!;

  if (!userHasPlanFeature(user, "teams")) {
    return NextResponse.json(
      {
        error: "Users & teams requires the Agency plan",
        locked: true,
        seatLimit: teamSeatLimit(user.plan),
        members: [],
      },
      { status: 403 },
    );
  }

  const members = await prisma.teamMember.findMany({
    where: { ownerUserId: user.id, status: { not: "revoked" } },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json({
    members,
    seatLimit: teamSeatLimit(user.plan),
    locked: false,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth && auth.error) return auth.error;
  const user = auth.user!;

  if (!userHasPlanFeature(user, "teams")) {
    return NextResponse.json(
      { error: "Users & teams requires the Agency plan" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const name = String(body.name || "").trim() || null;
  const role = String(body.role || "member").toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (email === user.email.toLowerCase()) {
    return NextResponse.json({ error: "You are already the owner" }, { status: 400 });
  }

  const activeCount = await prisma.teamMember.count({
    where: { ownerUserId: user.id, status: { not: "revoked" } },
  });
  const limit = teamSeatLimit(user.plan);
  if (1 + activeCount >= limit) {
    return NextResponse.json(
      { error: `Seat limit reached (${limit}). Upgrade or remove a seat.` },
      { status: 400 },
    );
  }

  try {
    const member = await prisma.teamMember.upsert({
      where: {
        ownerUserId_email: { ownerUserId: user.id, email },
      },
      create: {
        ownerUserId: user.id,
        email,
        name,
        role,
        status: "pending",
      },
      update: {
        name,
        role,
        status: "pending",
        invitedAt: new Date(),
        acceptedAt: null,
      },
    });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: "Could not invite teammate" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth && auth.error) return auth.error;
  const user = auth.user!;

  if (!userHasPlanFeature(user, "teams")) {
    return NextResponse.json(
      { error: "Users & teams requires the Agency plan" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const role = String(body.role || "").toLowerCase();
  const status = body.status ? String(body.status).toLowerCase() : null;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (role && !ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.teamMember.findFirst({
    where: { id, ownerUserId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      ...(role ? { role } : {}),
      ...(status === "active" || status === "pending" || status === "revoked"
        ? { status }
        : {}),
    },
  });

  return NextResponse.json({ member });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth && auth.error) return auth.error;
  const user = auth.user!;

  if (!userHasPlanFeature(user, "teams")) {
    return NextResponse.json(
      { error: "Users & teams requires the Agency plan" },
      { status: 403 },
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await prisma.teamMember.findFirst({
    where: { id, ownerUserId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
