import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";

type Params = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = [
  "businessName",
  "ownerName",
  "ownerTitle",
  "phone",
  "email",
  "website",
  "address",
  "googleMapsLink",
  "googleRating",
  "reviewCount",
  "yearsInBusiness",
  "leadScore",
  "serviceCategory",
  "revenueRangeEstimate",
  "websiteQualityScore",
  "marketingOpportunityScore",
  "ppcOpportunityScore",
  "seoOpportunityScore",
  "outreachAngle",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "yelpUrl",
  "yelpRating",
  "yelpReviews",
  "houzzUrl",
  "houzzRating",
  "houzzReviews",
  "nextdoor",
  "linkedinUrl",
  "linkedinCompanyUrl",
  "linkedinOwnerUrl",
  "qualityTier",
  "industry",
  "country",
  "state",
  "city",
  "zip",
  "verificationStatus",
] as const;

export async function GET(_request: Request, { params }: Params) {
  const admin = await requirePermission("leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      search: {
        select: {
          id: true,
          industry: true,
          createdAt: true,
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
      savedBy: {
        include: {
          user: {
            select: { id: true, email: true, companyName: true },
          },
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(request: Request, { params }: Params) {
  const admin = await requirePermission("leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  for (const key of EDITABLE_FIELDS) {
    if (body[key] === undefined) continue;
    const value = body[key];
    if (
      [
        "googleRating",
        "reviewCount",
        "yearsInBusiness",
        "leadScore",
        "websiteQualityScore",
        "marketingOpportunityScore",
        "ppcOpportunityScore",
        "seoOpportunityScore",
        "yelpRating",
        "yelpReviews",
        "houzzRating",
        "houzzReviews",
      ].includes(key)
    ) {
      data[key] =
        value === null || value === ""
          ? null
          : Number.isFinite(Number(value))
            ? Number(value)
            : existing[key as keyof typeof existing];
    } else {
      data[key] = value === "" ? null : value;
    }
  }

  const lead = await prisma.lead.update({ where: { id }, data });
  await logActivity(admin.id, "admin_edit_lead", `Edited lead ${lead.businessName}`, {
    leadId: id,
  });

  return NextResponse.json({ lead });
}

export async function DELETE(_request: Request, { params }: Params) {
  const admin = await requirePermission("leads");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id } });
  await logActivity(
    admin.id,
    "admin_delete_lead",
    `Deleted lead ${existing.businessName}`,
    { leadId: id },
  );

  return NextResponse.json({ ok: true });
}
