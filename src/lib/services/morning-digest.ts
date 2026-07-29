import { prisma } from "@/lib/prisma";
import { leadOwnershipWhere } from "@/lib/lead-ownership";
import { listSmtpAccounts } from "@/lib/user-smtp";

const DIGEST_LIMIT = 5;

const TIER_RANK: Record<string, number> = {
  hot: 3,
  warm: 2,
  nurture: 1,
};

const CONTACTED_STATUSES = new Set(["contacted", "qualified", "closed"]);

export type DigestLead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  location: string;
  industry: string | null;
  leadScore: number;
  qualityTier: string | null;
  outreachAngle: string | null;
  seoOpportunityScore: number | null;
  marketingOpportunityScore: number | null;
  savedLeadId: string | null;
  pipelineStatus: string | null;
  emailedBefore: boolean;
  reason: string;
};

export type MorningDigest = {
  greeting: string;
  generatedAt: string;
  emailReady: boolean;
  smtpAccountCount: number;
  leads: DigestLead[];
  totalActionable: number;
  /** Hot-tier leads available to work (same ownership as digest). */
  hotCount: number;
};

function digestGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatLocation(lead: {
  address: string | null;
  city: string | null;
  state: string | null;
}) {
  return (
    lead.address ||
    [lead.city, lead.state].filter(Boolean).join(", ") ||
    "Location pending"
  );
}

function buildReason(lead: {
  qualityTier: string | null;
  leadScore: number;
  email: string | null;
  phone: string | null;
  seoOpportunityScore: number | null;
  marketingOpportunityScore: number | null;
  outreachAngle: string | null;
  pipelineStatus: string | null;
}): string {
  const parts: string[] = [];

  if (lead.qualityTier === "hot") parts.push("Hot lead");
  else if (lead.qualityTier === "warm") parts.push("Warm lead");
  else if (lead.leadScore >= 70) parts.push("High score");

  if (lead.email) parts.push("email on file");
  else if (lead.phone) parts.push("phone on file");

  const seo = lead.seoOpportunityScore ?? 0;
  const marketing = lead.marketingOpportunityScore ?? 0;
  if (seo >= 65) parts.push("SEO opportunity");
  else if (marketing >= 65) parts.push("marketing gap");

  if (lead.pipelineStatus === "new") parts.push("saved · not contacted");
  else if (!lead.pipelineStatus) parts.push("not in pipeline yet");

  if (lead.outreachAngle) return lead.outreachAngle;

  return parts.length ? parts.join(" · ") : `Score ${lead.leadScore} — ready for outreach`;
}

function digestRankScore(lead: {
  leadScore: number;
  qualityTier: string | null;
  email: string | null;
  phone: string | null;
  seoOpportunityScore: number | null;
  marketingOpportunityScore: number | null;
  pipelineStatus: string | null;
  createdAt: Date;
}) {
  let score = lead.leadScore;
  score += (TIER_RANK[lead.qualityTier ?? ""] ?? 0) * 25;
  if (lead.email) score += 40;
  else if (lead.phone) score += 15;
  score += Math.max(lead.seoOpportunityScore ?? 0, lead.marketingOpportunityScore ?? 0) * 0.15;
  if (lead.pipelineStatus === "new") score += 10;
  // Slightly prefer fresher leads when scores tie
  score += Math.min(lead.createdAt.getTime() / 1e12, 5);
  return score;
}

export async function buildMorningDigest(userId: string): Promise<MorningDigest> {
  const [candidates, savedRows, emailedLeadIds, smtpAccounts, hotCount] =
    await Promise.all([
    prisma.lead.findMany({
      where: {
        ...leadOwnershipWhere(userId),
        OR: [{ email: { not: null } }, { phone: { not: null } }],
      },
      orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        state: true,
        industry: true,
        leadScore: true,
        qualityTier: true,
        outreachAngle: true,
        seoOpportunityScore: true,
        marketingOpportunityScore: true,
        createdAt: true,
      },
    }),
    prisma.savedLead.findMany({
      where: { userId },
      select: { id: true, leadId: true, status: true },
    }),
    prisma.leadEmail.findMany({
      where: {
        userId,
        direction: "outbound",
        status: "sent",
      },
      select: { leadId: true },
      distinct: ["leadId"],
    }),
    listSmtpAccounts(userId),
    prisma.lead.count({
      where: {
        ...leadOwnershipWhere(userId),
        qualityTier: "hot",
      },
    }),
  ]);

  const savedByLeadId = new Map(savedRows.map((s) => [s.leadId, s]));
  const emailedSet = new Set(emailedLeadIds.map((e) => e.leadId));
  const enabledSmtp = smtpAccounts.filter((a) => a.enabled);

  const actionable = candidates
    .map((lead) => {
      const saved = savedByLeadId.get(lead.id);
      const pipelineStatus = saved?.status ?? null;
      const emailedBefore = emailedSet.has(lead.id);

      if (emailedBefore) return null;
      if (pipelineStatus && CONTACTED_STATUSES.has(pipelineStatus)) return null;
      if (!lead.email?.trim() && !lead.phone?.trim()) return null;

      return {
        lead,
        savedLeadId: saved?.id ?? null,
        pipelineStatus,
        emailedBefore,
        rank: digestRankScore({
          ...lead,
          pipelineStatus,
        }),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.rank - a.rank);

  const picks = actionable.slice(0, DIGEST_LIMIT);

  const leads: DigestLead[] = picks.map(({ lead, savedLeadId, pipelineStatus, emailedBefore }) => ({
    id: lead.id,
    businessName: lead.businessName,
    ownerName: lead.ownerName,
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    location: formatLocation(lead),
    industry: lead.industry,
    leadScore: lead.leadScore,
    qualityTier: lead.qualityTier,
    outreachAngle: lead.outreachAngle,
    seoOpportunityScore: lead.seoOpportunityScore,
    marketingOpportunityScore: lead.marketingOpportunityScore,
    savedLeadId,
    pipelineStatus,
    emailedBefore,
    reason: buildReason({
      qualityTier: lead.qualityTier,
      leadScore: lead.leadScore,
      email: lead.email,
      phone: lead.phone,
      seoOpportunityScore: lead.seoOpportunityScore,
      marketingOpportunityScore: lead.marketingOpportunityScore,
      outreachAngle: lead.outreachAngle,
      pipelineStatus,
    }),
  }));

  return {
    greeting: digestGreeting(),
    generatedAt: new Date().toISOString(),
    emailReady: enabledSmtp.length > 0,
    smtpAccountCount: enabledSmtp.length,
    leads,
    totalActionable: actionable.length,
    hotCount,
  };
}
