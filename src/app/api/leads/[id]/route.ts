import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LeadFrom = "all" | "hot" | "saved";

function parseFrom(raw: string | null): LeadFrom {
  if (raw === "hot" || raw === "saved") return raw;
  return "all";
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
  const from = parseFrom(new URL(request.url).searchParams.get("from"));

  const lead = await prisma.lead.findUnique({
    where: { id },
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

  let orderedIds: string[] = [];

  if (from === "hot") {
    const rows = await prisma.lead.findMany({
      where: { qualityTier: "hot", search: { userId: user.id } },
      orderBy: { leadScore: "desc" },
      select: { id: true },
      take: 200,
    });
    orderedIds = rows.map((r) => r.id);
  } else if (from === "saved") {
    const rows = await prisma.savedLead.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { leadId: true },
      take: 200,
    });
    orderedIds = rows.map((r) => r.leadId);
  } else {
    const rows = await prisma.lead.findMany({
      where: { search: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
      take: 200,
    });
    orderedIds = rows.map((r) => r.id);
  }

  // If current lead isn't in the scoped list (e.g. opened from search),
  // fall back to all leads so prev/next still work.
  if (!orderedIds.includes(id) && from !== "all") {
    const rows = await prisma.lead.findMany({
      where: { search: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
      take: 200,
    });
    orderedIds = rows.map((r) => r.id);
  }

  const idx = orderedIds.indexOf(id);
  const prevId = idx > 0 ? orderedIds[idx - 1] : null;
  const nextId =
    idx >= 0 && idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null;

  return NextResponse.json({
    lead,
    navigation: {
      from,
      prevId,
      nextId,
      position: idx >= 0 ? idx + 1 : null,
      total: orderedIds.length,
    },
  });
}
