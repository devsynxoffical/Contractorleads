import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ leads: [], saved: [], total: 0 });
  }

  const [leads, saved] = await Promise.all([
    prisma.lead.findMany({
      where: {
        search: { userId: user.id },
        OR: [
          { businessName: { contains: q, mode: "insensitive" } },
          { ownerName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { state: { contains: q, mode: "insensitive" } },
          { industry: { contains: q, mode: "insensitive" } },
          { address: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        businessName: true,
        industry: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        leadScore: true,
        qualityTier: true,
      },
    }),
    prisma.savedLead.findMany({
      where: {
        userId: user.id,
        OR: [
          { lead: { businessName: { contains: q, mode: "insensitive" } } },
          { lead: { industry: { contains: q, mode: "insensitive" } } },
          { lead: { city: { contains: q, mode: "insensitive" } } },
          { notes: { some: { content: { contains: q, mode: "insensitive" } } } },
        ],
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            industry: true,
            city: true,
            state: true,
            leadScore: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    leads,
    saved,
    total: leads.length + saved.length,
  });
}
