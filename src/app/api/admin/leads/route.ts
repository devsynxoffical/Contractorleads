import { NextResponse } from "next/server";
import { ADMIN_STAFF_ROLES, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { INDUSTRIES } from "@/lib/constants";
import {
  adminLeadOrderBy,
  buildAdminLeadWhere,
  parseAdminLeadFilters,
} from "@/lib/admin-lead-filters";

export async function GET(request: Request) {
  const admin = await requirePermission("leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseAdminLeadFilters(searchParams);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(10, Number(searchParams.get("pageSize") ?? 50)),
  );

  const where = buildAdminLeadWhere(filters);
  const orderBy = adminLeadOrderBy(filters.sort);

  const [total, leads, users, categoryRows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy,
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
    prisma.user.findMany({
      where: { role: { notIn: [...ADMIN_STAFF_ROLES] } },
      orderBy: [{ companyName: "asc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        companyName: true,
        name: true,
        _count: { select: { searches: true } },
      },
      take: 500,
    }),
    prisma.lead.findMany({
      where: { industry: { not: null } },
      distinct: ["industry"],
      select: { industry: true },
      orderBy: { industry: "asc" },
      take: 200,
    }),
  ]);

  const categories = categoryRows
    .map((r) => r.industry)
    .filter((v): v is string => Boolean(v?.trim()));

  return NextResponse.json({
    leads,
    total,
    page,
    pageSize,
    filters: {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        label: u.companyName || u.name || u.email,
        searchCount: u._count.searches,
      })),
      categories,
    },
  });
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
