import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { dispatchCrmWebhook } from "@/lib/crm-webhook";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.savedLead.findUnique({
    where: { userId_leadId: { userId: user.id, leadId: id } },
  });

  const saved = await prisma.savedLead.upsert({
    where: { userId_leadId: { userId: user.id, leadId: id } },
    create: { userId: user.id, leadId: id },
    update: {},
    include: { lead: true },
  });

  await logActivity(user.id, "save", `Saved ${saved.lead.businessName}`);

  // Only notify CRM on first save
  if (!existing) {
    void dispatchCrmWebhook(user.id, "lead.saved", {
      id: saved.lead.id,
      businessName: saved.lead.businessName,
      phone: saved.lead.phone,
      email: saved.lead.email,
      website: saved.lead.website,
      address: saved.lead.address,
      industry: saved.lead.industry,
      qualityTier: saved.lead.qualityTier,
      leadScore: saved.lead.leadScore,
      status: saved.status,
    });
  }

  return NextResponse.json({ saved });
}
