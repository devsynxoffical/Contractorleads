import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTeamInviteToken, serializeTeamMember } from "@/lib/team-invite";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  if (!token) {
    return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
  }

  const parsed = parseTeamInviteToken(token);
  if (!parsed) {
    return NextResponse.json(
      { error: "This invite link is invalid or has expired." },
      { status: 400 },
    );
  }

  const member = await prisma.teamMember.findFirst({
    where: {
      id: parsed.memberId,
      ownerUserId: parsed.ownerUserId,
      email: parsed.email,
      status: { not: "revoked" },
    },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
          companyName: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json(
      { error: "This invite is no longer available." },
      { status: 404 },
    );
  }

  const updated =
    member.status === "active"
      ? member
      : await prisma.teamMember.update({
          where: { id: member.id },
          data: {
            status: "active",
            acceptedAt: new Date(),
          },
          include: {
            owner: {
              select: {
                name: true,
                email: true,
                companyName: true,
              },
            },
          },
        });

  const owner = updated.owner;
  return NextResponse.json({
    ok: true,
    alreadyAccepted: member.status === "active",
    member: serializeTeamMember(updated),
    workspace: {
      name: owner.companyName || owner.name || owner.email,
      ownerEmail: owner.email,
    },
  });
}
