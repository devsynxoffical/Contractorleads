import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { INDUSTRIES } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await requirePermission("leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const minScore = Number(searchParams.get("minScore") ?? 0);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    50,
    Math.max(10, Number(searchParams.get("pageSize") ?? 25)),
  );

  const where: Prisma.LeadWhereInput = {
    ...(industry ? { industry } : {}),
    ...(country ? { country } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    ...(minScore > 0 ? { leadScore: { gte: minScore } } : {}),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" } },
            { ownerName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        search: {
          select: {
            id: true,
            industry: true,
            user: {
              select: {
                id: true,
                email: true,
                companyName: true,
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ leads, total, page, pageSize });
}

export async function POST(request: Request) {
  const admin = await requirePermission("leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const businessName = String(body.businessName ?? "").trim();
  if (!businessName) {
    return NextResponse.json(
      { error: "businessName is required" },
      { status: 400 },
    );
  }

  const industry =
    typeof body.industry === "string" &&
    (INDUSTRIES as readonly string[]).includes(body.industry)
      ? body.industry
      : typeof body.industry === "string" && body.industry.trim()
        ? body.industry.trim()
        : "General Contractors";

  const lead = await prisma.lead.create({
    data: {
      businessName,
      ownerName: body.ownerName || null,
      ownerTitle: body.ownerTitle || null,
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      address: body.address || null,
      googleMapsLink: body.googleMapsLink || null,
      industry,
      country: body.country || "US",
      state: body.state || null,
      city: body.city || null,
      zip: body.zip || null,
      leadScore: Number(body.leadScore) || 50,
      qualityTier: body.qualityTier || "nurture",
      verificationStatus: "manual",
      outreachAngle: body.outreachAngle || null,
    },
  });

  await logActivity(
    admin.id,
    "admin_create_lead",
    `Manually created ${businessName}`,
    { leadId: lead.id },
  );

  return NextResponse.json({ lead }, { status: 201 });
}
