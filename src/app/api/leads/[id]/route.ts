import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS } from "@/lib/constants";
import { parseLeadFrom, type AppLeadFrom } from "@/lib/nav-context";

async function orderedIdsForFrom(userId: string, from: AppLeadFrom) {
  if (from === "hot") {
    const rows = await prisma.lead.findMany({
      where: { qualityTier: "hot", search: { userId } },
      orderBy: { leadScore: "desc" },
      select: { id: true },
      take: 200,
    });
    return rows.map((r) => r.id);
  }
  if (from === "saved" || from === "pipeline") {
    const rows = await prisma.savedLead.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { leadId: true },
      take: 200,
    });
    return rows.map((r) => r.leadId);
  }
  if (from === "digest") {
    const { buildMorningDigest } = await import(
      "@/lib/services/morning-digest"
    );
    const digest = await buildMorningDigest(userId);
    return digest.leads.map((l) => l.id);
  }
  // all | map | search — workspace lead list
  const rows = await prisma.lead.findMany({
    where: { search: { userId } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
    take: 200,
  });
  return rows.map((r) => r.id);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const from = parseLeadFrom(new URL(request.url).searchParams.get("from"));

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

  let orderedIds = await orderedIdsForFrom(user.id, from);

  if (!orderedIds.includes(id) && from !== "all") {
    orderedIds = await orderedIdsForFrom(user.id, "all");
  }

  const idx = orderedIds.indexOf(id);
  const navigation = {
    from,
    prevId: idx > 0 ? orderedIds[idx - 1] : null,
    nextId: idx >= 0 && idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null,
    position: idx >= 0 ? idx + 1 : null,
    total: orderedIds.length,
  };

  return NextResponse.json({
    lead: { ...lead, unlocked: true },
    unlock: {
      unlocked: true,
      cost: CREDIT_COSTS.lead,
      creditsRemaining: user.creditsRemaining,
      note: "Viewing is free. Credits are charged only when exporting.",
    },
    navigation,
  });
}
