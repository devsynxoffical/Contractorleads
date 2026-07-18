import { NextResponse } from "next/server";
import { isAdminStaff, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import type { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const admin = await requirePermission("copy_leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const agencyId = typeof body.agencyId === "string" ? body.agencyId : "";
  if (!agencyId) {
    return NextResponse.json({ error: "agencyId is required" }, { status: 400 });
  }

  const agency = await prisma.user.findUnique({ where: { id: agencyId } });
  if (!agency || isAdminStaff(agency)) {
    return NextResponse.json({ error: "Invalid agency" }, { status: 400 });
  }

  let leadIds: string[] = Array.isArray(body.leadIds)
    ? body.leadIds.filter((id: unknown) => typeof id === "string")
    : [];

  if (!leadIds.length && body.filters?.industry) {
    const filters = body.filters as {
      industry: string;
      country?: string;
      state?: string;
      city?: string;
      minScore?: number;
      limit?: number;
    };
    const where: Prisma.LeadWhereInput = {
      industry: filters.industry,
      ...(filters.country ? { country: filters.country } : {}),
      ...(filters.state ? { state: filters.state } : {}),
      ...(filters.city
        ? { city: { contains: filters.city, mode: "insensitive" } }
        : {}),
      ...(filters.minScore
        ? { leadScore: { gte: Number(filters.minScore) } }
        : {}),
    };
    const matches = await prisma.lead.findMany({
      where,
      select: { id: true },
      take: Math.min(200, Number(filters.limit) || 100),
      orderBy: { leadScore: "desc" },
    });
    leadIds = matches.map((m) => m.id);
  }

  if (!leadIds.length) {
    return NextResponse.json({ copied: 0, skipped: 0, leadIds: [] });
  }

  const existing = await prisma.savedLead.findMany({
    where: { userId: agencyId, leadId: { in: leadIds } },
    select: { leadId: true },
  });
  const already = new Set(existing.map((e) => e.leadId));
  const toCreate = leadIds.filter((id) => !already.has(id));

  if (toCreate.length) {
    await prisma.savedLead.createMany({
      data: toCreate.map((leadId) => ({
        userId: agencyId,
        leadId,
        status: "new",
      })),
      skipDuplicates: true,
    });
  }

  await logActivity(
    admin.id,
    "admin_copy_leads",
    `Copied ${toCreate.length} leads to ${agency.email}`,
    { agencyId, copied: toCreate.length, skipped: already.size },
  );

  return NextResponse.json({
    copied: toCreate.length,
    skipped: leadIds.length - toCreate.length,
    leadIds: toCreate,
  });
}
