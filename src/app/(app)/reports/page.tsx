import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { requirePlanFeatureOrRedirect } from "@/lib/plan-access-server";
import { ClientReportsView } from "@/components/reports/client-reports-view";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUSES } from "@/lib/constants";

export default async function ClientReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  requirePlanFeatureOrRedirect(user, "reports");

  const [saved, industriesRaw, statusGroups] = await Promise.all([
    prisma.savedLead.findMany({
      where: { userId: user.id },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            phone: true,
            email: true,
            website: true,
            city: true,
            state: true,
            industry: true,
            leadScore: true,
            qualityTier: true,
            googleRating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 300,
    }),
    prisma.savedLead.findMany({
      where: { userId: user.id },
      select: { lead: { select: { industry: true } } },
      take: 500,
    }),
    prisma.savedLead.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    }),
  ]);

  const leads = saved.map((s) => ({
    id: s.lead.id,
    savedLeadId: s.id,
    businessName: s.lead.businessName,
    ownerName: s.lead.ownerName,
    phone: s.lead.phone,
    email: s.lead.email,
    website: s.lead.website,
    city: s.lead.city,
    state: s.lead.state,
    industry: s.lead.industry,
    leadScore: s.lead.leadScore,
    qualityTier: s.lead.qualityTier,
    status: s.status,
    googleRating: s.lead.googleRating,
    reviewCount: s.lead.reviewCount,
    updatedAt: s.updatedAt.toISOString(),
  }));

  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
  const byQuality = leads.reduce<Record<string, number>>((acc, l) => {
    const k = l.qualityTier || "nurture";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const industries = [
    ...new Set(
      industriesRaw
        .map((r) => r.lead.industry?.trim())
        .filter((v): v is string => Boolean(v)),
    ),
  ].sort((a, b) => a.localeCompare(b));

  const initial = {
    agency: {
      companyName: user.companyName,
      name: user.name,
      email: user.email,
    },
    summary: {
      total: leads.length,
      hot: byQuality.hot || 0,
      warm: byQuality.warm || 0,
      nurture: byQuality.nurture || 0,
      avgScore: leads.length
        ? Math.round(
            leads.reduce((n, l) => n + (l.leadScore || 0), 0) / leads.length,
          )
        : 0,
      closed: byStatus.closed || 0,
      byStatus,
      byQuality,
    },
    pipelineTotals: Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all]),
    ),
    industries,
    statuses: [...LEAD_STATUSES],
    leads,
    generatedAt: new Date().toISOString(),
  };

  return <ClientReportsView initial={initial} />;
}
