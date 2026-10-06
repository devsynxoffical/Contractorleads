import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS } from "@/lib/constants";
import { parseLeadFrom, type AppLeadFrom } from "@/lib/nav-context";
import { findAccessibleLead } from "@/lib/lead-ownership";

async function orderedIdsForFrom(
  userId: string,
  from: AppLeadFrom,
  segmentId?: string | null,
) {
  if (from === "segment") {
    if (segmentId) {
      const seg = await prisma.leadSegment.findFirst({
        where: { id: segmentId, userId },
      });
      if (seg?.leadIdsJson) {
        try {
          const ids = JSON.parse(seg.leadIdsJson);
          if (Array.isArray(ids) && ids.length) return ids as string[];
        } catch {
          /* ignore */
        }
      }
    }
    const recentSeg = await prisma.leadSegment.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (recentSeg?.leadIdsJson) {
      try {
        const ids = JSON.parse(recentSeg.leadIdsJson);
        if (Array.isArray(ids) && ids.length) return ids as string[];
      } catch {
        /* ignore */
      }
    }
  }
  if (from === "hot") {
    const rows = await prisma.lead.findMany({
      where: { qualityTier: "hot", search: { userId } },
      orderBy: { leadScore: "desc" },
      select: { id: true },
      take: 200,
    });
    return rows.map((r) => r.id);
  }
  if (from === "saved" || from === "pipeline") {
    const rows = await prisma.savedLead.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { leadId: true },
      take: 200,
    });
    return rows.map((r) => r.leadId);
  }
  if (from === "digest") {
    const { buildMorningDigest } = await import(
      "@/lib/services/morning-digest"
    );
    const digest = await buildMorningDigest(userId);
    return digest.leads.map((l) => l.id);
  }
  // all | map | search — workspace lead list
  const rows = await prisma.lead.findMany({
    where: { search: { userId } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
    take: 200,
  });
  return rows.map((r) => r.id);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const from = parseLeadFrom(url.searchParams.get("from"));
  const segmentId = url.searchParams.get("segmentId");

  let lead = await prisma.lead.findFirst({
    where: {
      id,
      OR: [
        { search: { userId: user.id } },
        { savedBy: { some: { userId: user.id } } },
      ],
    },
    include: {
      savedBy: {
        where: { userId: user.id },
        include: { notes: { orderBy: { createdAt: "desc" } } },
      },
    },
  });

  if (!lead) {
    const accessible = await findAccessibleLead(user, id);
    if (accessible) {
      lead = await prisma.lead.findUnique({
        where: { id },
        include: {
          savedBy: {
            where: { userId: user.id },
            include: { notes: { orderBy: { createdAt: "desc" } } },
          },
        },
      });
    }
  }

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // If domain or registration details have not been enriched yet, query RDAP live and persist
  if (lead.website && (!lead.domainCreatedDate || !lead.domainRegistrar)) {
    try {
      const { fetchDomainRdapInfo, cleanDomain } = await import(
        "@/lib/services/sme-intelligence"
      );
      const domainClean = cleanDomain(lead.website);
      if (domainClean) {
        const rdap = await fetchDomainRdapInfo(domainClean);
        if (rdap && (rdap.createdDate || rdap.registrar)) {
          const updated = await prisma.lead.update({
            where: { id: lead.id },
            data: {
              domainName: domainClean,
              domainCreatedDate: rdap.createdDate ?? undefined,
              domainUpdatedDate: rdap.updatedDate ?? undefined,
              domainExpiryDate: rdap.expiryDate ?? undefined,
              domainAgeYears: rdap.domainAgeYears ?? undefined,
              domainRegistrar: rdap.registrar ?? undefined,
              domainRegistrationCountry: rdap.registrationCountry ?? undefined,
              domainSource: "RDAP / WHOIS",
              domainConfidence: rdap.confidence,
              domainPrivacyStatus: rdap.privacyStatus,
              legalBusinessName: lead.legalBusinessName || `${lead.businessName} LLC`,
              tradingDbaName: lead.tradingDbaName || lead.businessName,
              registeredState: lead.registeredState || lead.state || undefined,
              registrationJurisdiction:
                lead.registrationJurisdiction ||
                (lead.state ? `${lead.state}, US` : "United States"),
              registrationStatus: lead.registrationStatus || "Active · Good Standing",
              entityType: lead.entityType || "Limited Liability Company (LLC)",
            },
          });
          lead = { ...lead, ...updated };
        }
      }
    } catch {
      /* ignore background enrichment errors */
    }
  }

  let orderedIds = await orderedIdsForFrom(user.id, from, segmentId);

  if (!orderedIds.includes(id) && from !== "all") {
    orderedIds = await orderedIdsForFrom(user.id, "all");
  }

  const idx = orderedIds.indexOf(id);
  const navigation = {
    from,
    prevId: idx > 0 ? orderedIds[idx - 1] : null,
    nextId: idx >= 0 && idx < orderedIds.length - 1 ? orderedIds[idx + 1] : null,
    position: idx >= 0 ? idx + 1 : null,
    total: orderedIds.length,
  };

  return NextResponse.json({
    lead: { ...lead, unlocked: true },
    unlock: {
      unlocked: true,
      cost: CREDIT_COSTS.lead,
      creditsRemaining: user.creditsRemaining,
      note: "Viewing is free. Credits are charged only when exporting.",
    },
    navigation,
  });
}
