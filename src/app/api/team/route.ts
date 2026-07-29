import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamSeatLimit } from "@/lib/plans";
import { userHasPlanFeature } from "@/lib/plan-access";
import { sendTeamInviteEmail } from "@/lib/email";
import {
  createTeamInviteToken,
  serializeTeamMember,
  teamInviteAcceptUrl,
} from "@/lib/team-invite";

const ROLES = new Set(["admin", "member", "viewer"]);

async function requireOwner() {
  const user = await getSessionUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

async function sendInviteForMember(opts: {
  member: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  owner: {
    id: string;
    email: string;
    name: string | null;
    companyName: string | null;
  };
}) {
  const token = createTeamInviteToken({
    memberId: opts.member.id,
    ownerUserId: opts.owner.id,
    email: opts.member.email,
  });
  const acceptUrl = teamInviteAcceptUrl(token);
  const ownerName =
    opts.owner.name?.trim() ||
    opts.owner.companyName?.trim() ||
    opts.owner.email;
  const result = await sendTeamInviteEmail({
    to: opts.member.email,
    inviteeName: opts.member.name,
    ownerName,
    companyName: opts.owner.companyName,
    role: opts.member.role,
    acceptUrl,
  });
  return { acceptUrl, emailOk: result.ok, emailError: result.error };
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
        owner: {
          email: user.email,
          name: user.name,
          companyName: user.companyName,
        },
      },
      { status: 403 },
    );
  }

  const members = await prisma.teamMember.findMany({
    where: { ownerUserId: user.id, status: { not: "revoked" } },
    orderBy: { invitedAt: "desc" },
  });

  return NextResponse.json({
    members: members.map(serializeTeamMember),
    seatLimit: teamSeatLimit(user.plan),
    locked: false,
    owner: {
      email: user.email,
      name: user.name,
      companyName: user.companyName,
    },
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
  const resendId = typeof body.resendId === "string" ? body.resendId : null;

  if (resendId) {
    const existing = await prisma.teamMember.findFirst({
      where: {
        id: resendId,
        ownerUserId: user.id,
        status: { not: "revoked" },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    const member = await prisma.teamMember.update({
      where: { id: existing.id },
      data: {
        status: "pending",
        invitedAt: new Date(),
        acceptedAt: null,
      },
    });
    const mail = await sendInviteForMember({
      member,
      owner: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
      },
    });
    return NextResponse.json({
      member: serializeTeamMember(member),
      inviteUrl: mail.acceptUrl,
      emailSent: mail.emailOk,
      emailError: mail.emailOk ? null : mail.emailError || "Invite email failed",
    });
  }

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

    const mail = await sendInviteForMember({
      member,
      owner: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
      },
    });

    return NextResponse.json({
      member: serializeTeamMember(member),
      inviteUrl: mail.acceptUrl,
      emailSent: mail.emailOk,
      emailError: mail.emailOk ? null : mail.emailError || "Invite email failed",
    });
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
        ? {
            status,
            ...(status === "active" && !existing.acceptedAt
              ? { acceptedAt: new Date() }
              : {}),
          }
        : {}),
    },
  });

  return NextResponse.json({ member: serializeTeamMember(member) });
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
