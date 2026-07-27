import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { dispatchCrmWebhook } from "@/lib/crm-webhook";
import { leadOwnershipWhere } from "@/lib/lead-ownership";

const MAX_BULK = 200;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const leadIds = (Array.isArray(body.leadIds)
    ? body.leadIds.map((x: unknown) => String(x)).filter(Boolean)
    : []) as string[];
  const uniqueLeadIds = [...new Set(leadIds)];

  if (!uniqueLeadIds.length) {
    return NextResponse.json({ error: "Select at least one lead" }, { status: 400 });
  }

  if (uniqueLeadIds.length > MAX_BULK) {
    return NextResponse.json(
      { error: `You can add up to ${MAX_BULK} leads at a time` },
      { status: 400 },
    );
  }

  const owned = await prisma.lead.findMany({
    where: { id: { in: uniqueLeadIds }, ...leadOwnershipWhere(user.id) },
    select: { id: true, businessName: true, phone: true, email: true, website: true, address: true, industry: true, qualityTier: true, leadScore: true },
  });

  if (!owned.length) {
    return NextResponse.json({ error: "No valid leads selected" }, { status: 400 });
  }

  const ownedIds = owned.map((l) => l.id);

  const existing = await prisma.savedLead.findMany({
    where: { userId: user.id, leadId: { in: ownedIds } },
    select: { leadId: true },
  });
  const existingSet = new Set(existing.map((e) => e.leadId));
  const newIds = ownedIds.filter((id) => !existingSet.has(id));

  if (newIds.length) {
    await prisma.savedLead.createMany({
      data: newIds.map((leadId) => ({ userId: user.id, leadId })),
      skipDuplicates: true,
    });
  }

  const added = newIds.length;
  const skipped = ownedIds.length - added;

  if (added > 0) {
    await logActivity(
      user.id,
      "save",
      `Added ${added} lead${added === 1 ? "" : "s"} to pipeline`,
    );

    for (const lead of owned.filter((l) => newIds.includes(l.id))) {
      void dispatchCrmWebhook(user.id, "lead.saved", {
        id: lead.id,
        businessName: lead.businessName,
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        address: lead.address,
        industry: lead.industry,
        qualityTier: lead.qualityTier,
        leadScore: lead.leadScore,
        status: "new",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    added,
    skipped,
    total: ownedIds.length,
    invalid: uniqueLeadIds.length - ownedIds.length,
  });
}
