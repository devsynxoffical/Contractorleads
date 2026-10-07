import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { parseCampaignHooks } from "@/lib/campaign-types";
import { resolveRecipientTimezone } from "@/lib/campaign-timezone";
import { processCampaignSends } from "@/lib/campaign-runner";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rawLeads = (Array.isArray(body.leads) ? body.leads : []) as Array<{
    email?: string;
    businessName?: string;
    ownerName?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    website?: string;
  }>;

  if (!rawLeads.length) {
    return NextResponse.json({ error: "No leads provided to import" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id, userId: user.id },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // 1. Fetch existing prospect emails for this campaign to avoid double enrollment
  const existingProspects = await prisma.campaignProspect.findMany({
    where: { campaignId: id },
    select: { email: true },
  });

  const existingEmailSet = new Set(existingProspects.map((p) => p.email.toLowerCase().trim()));

  // 2. Parse campaign hooks for round-robin assignment
  const hooks = parseCampaignHooks(campaign.hooksJson);
  const activeHooks = hooks.filter((h) => h.active);
  const usableHooks = activeHooks.length > 0 ? activeHooks : hooks;

  let hookIndex = existingProspects.length;
  const newProspectsToCreate: Array<{
    campaignId: string;
    businessName: string;
    ownerName: string | null;
    email: string;
    phone: string | null;
    city: string | null;
    state: string | null;
    country: string;
    timezone: string;
    status: string;
    assignedHookId: string;
    currentStepIndex: number;
  }> = [];

  const seenInBatch = new Set<string>();
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const lead of rawLeads) {
    const cleanEmail = lead.email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      invalidCount++;
      continue;
    }

    if (existingEmailSet.has(cleanEmail) || seenInBatch.has(cleanEmail)) {
      duplicateCount++;
      continue;
    }

    seenInBatch.add(cleanEmail);

    const hook = usableHooks[hookIndex % usableHooks.length];
    hookIndex++;

    const tz = resolveRecipientTimezone({
      state: lead.state,
      city: lead.city,
      country: lead.country || campaign.country || "US",
    });

    newProspectsToCreate.push({
      campaignId: id,
      businessName: (lead.businessName || cleanEmail.split("@")[0] || "Contractor").trim(),
      ownerName: lead.ownerName?.trim() || null,
      email: cleanEmail,
      phone: lead.phone?.trim() || null,
      city: lead.city?.trim() || null,
      state: lead.state?.trim() || null,
      country: lead.country?.trim() || campaign.country || "US",
      timezone: tz,
      status: "pending",
      assignedHookId: hook?.id || "A",
      currentStepIndex: 0,
    });
  }

  if (newProspectsToCreate.length === 0) {
    return NextResponse.json(
      {
        error:
          duplicateCount > 0
            ? `All ${duplicateCount} lead(s) in this sheet are already enrolled in this campaign.`
            : "No valid new emails found in the uploaded list.",
        skippedDuplicates: duplicateCount,
        invalidCount,
      },
      { status: 400 }
    );
  }

  // 3. Batch insert new prospects
  await prisma.campaignProspect.createMany({
    data: newProspectsToCreate,
  });

  // 4. Update campaign totals
  const totalCount = await prisma.campaignProspect.count({
    where: { campaignId: id },
  });

  await prisma.campaign.update({
    where: { id },
    data: {
      leadCount: totalCount,
      uniqueEmailCount: totalCount,
      duplicateDetectedCount: { increment: duplicateCount },
    },
  });

  // 5. If active, trigger process sends
  if (campaign.status === "active") {
    void processCampaignSends({ campaignId: id, userId: user.id });
  }

  return NextResponse.json({
    ok: true,
    message: `Successfully imported ${newProspectsToCreate.length} new prospects into this campaign.`,
    addedCount: newProspectsToCreate.length,
    skippedDuplicates: duplicateCount,
    invalidCount,
    totalProspects: totalCount,
  });
}
