import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry")?.trim();
  if (!industry) {
    return NextResponse.json({ error: "industry is required" }, { status: 400 });
  }

  const country = searchParams.get("country")?.trim() ?? "";
  const state = searchParams.get("state")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const minScore = Number(searchParams.get("minScore") ?? 0);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 100)));

  const where: Prisma.LeadWhereInput = {
    industry,
    ...(country ? { country } : {}),
    ...(state ? { state } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(minScore > 0 ? { leadScore: { gte: minScore } } : {}),
  };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      phone: true,
      email: true,
      website: true,
      city: true,
      state: true,
      country: true,
      industry: true,
      leadScore: true,
      qualityTier: true,
      googleRating: true,
      reviewCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ leads, count: leads.length });
}
