import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  insufficientCreditsPayload,
  isLeadUnlocked,
  redactLead,
  unlockLeads,
} from "@/lib/lead-access";
import { CREDIT_COSTS } from "@/lib/constants";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    if (await isLeadUnlocked(user.id, id)) {
      const lead = await prisma.lead.findFirst({
        where: {
          id,
          OR: [
            { search: { userId: user.id } },
            { savedBy: { some: { userId: user.id } } },
          ],
        },
        include: {
          savedBy: {
            where: { userId: user.id },
            include: { notes: { orderBy: { createdAt: "desc" } } },
          },
        },
      });
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        alreadyUnlocked: true,
        charged: 0,
        lead: redactLead(lead, true),
        creditsRemaining: user.creditsRemaining,
      });
    }

    if (user.creditsRemaining < CREDIT_COSTS.lead) {
      return NextResponse.json(
        insufficientCreditsPayload(CREDIT_COSTS.lead, user.creditsRemaining),
        { status: 402 },
      );
    }

    const result = await unlockLeads({
      userId: user.id,
      leadIds: [id],
    });

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        savedBy: {
          where: { userId: user.id },
          include: { notes: { orderBy: { createdAt: "desc" } } },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      alreadyUnlocked: false,
      charged: result.charged,
      lead: lead ? redactLead(lead, true) : null,
      creditsRemaining: result.creditsRemaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unlock failed";
    if (message === "INSUFFICIENT_CREDITS") {
      const fresh = await prisma.user.findUnique({
        where: { id: user.id },
        select: { creditsRemaining: true },
      });
      return NextResponse.json(
        insufficientCreditsPayload(
          CREDIT_COSTS.lead,
          fresh?.creditsRemaining ?? 0,
        ),
        { status: 402 },
      );
    }
    if (message === "LEAD_NOT_FOUND") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
