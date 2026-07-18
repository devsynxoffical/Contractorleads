import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enrichLeadSocial } from "@/lib/services/social-enrichment";
import { logActivity } from "@/lib/credits";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await enrichLeadSocial({
      id: lead.id,
      businessName: lead.businessName,
      ownerName: lead.ownerName,
      website: lead.website,
      industry: lead.industry,
      country: lead.country,
      state: lead.state,
      city: lead.city,
      zip: lead.zip,
      email: lead.email,
      facebook: lead.facebook,
      instagram: lead.instagram,
      youtube: lead.youtube,
      tiktok: lead.tiktok,
    });

    await logActivity(
      admin.id,
      "admin_enrich_lead",
      `Enriched ${lead.businessName}`,
      { leadId: id, found: result.found },
    );

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Enrichment failed" },
      { status: 500 },
    );
  }
}
