import type { SessionUser } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS } from "@/lib/admin";

function planLabel(plan: string) {
  return ADMIN_PLANS.find((p) => p.value === plan)?.label ?? plan;
}

/** Full account + business profile for Ask Expert system prompt */
export function buildBusinessContext(user: SessionUser) {
  const lines = [
    user.name && `Account name: ${user.name}`,
    `Login email: ${user.email}`,
    user.companyName && `Company / agency: ${user.companyName}`,
    user.ownerName && `Agency owner: ${user.ownerName}`,
    user.ownerEmail && `Owner email: ${user.ownerEmail}`,
    user.ownerPhone && `Owner phone: ${user.ownerPhone}`,
    user.phone && `Account phone: ${user.phone}`,
    user.businessDescription && `Business description: ${user.businessDescription}`,
    user.services && `Services offered: ${user.services}`,
    user.idealCustomer && `Ideal customer / ICP: ${user.idealCustomer}`,
    user.serviceAreas && `Service areas: ${user.serviceAreas}`,
    user.mainGoal && `Main growth goal: ${user.mainGoal}`,
    `Plan: ${planLabel(user.plan)} (${user.plan})`,
    user.subscriptionStatus && `Subscription status: ${user.subscriptionStatus}`,
    `Credits remaining: ${Math.round(user.creditsRemaining * 100) / 100}`,
    `Onboarding complete: ${user.onboardingComplete ? "yes" : "no"}`,
  ].filter(Boolean) as string[];

  if (lines.length <= 4) {
    lines.push(
      "Profile is incomplete — ask the user to fill Settings (company, services, ICP, goal) so advice can be personalized. Do not invent a company name or leave blank placeholders like [Name].",
    );
  } else {
    lines.push(
      "Always address the user by their account name or owner name when known. Never leave empty name placeholders. Use their company, services, ICP, and goal in every recommendation.",
    );
  }

  return lines.join("\n");
}

/** Extra live workspace stats appended to the AI system prompt */
export async function buildWorkspaceDataContext(userId: string) {
  const [
    searchCount,
    savedCount,
    hotSaved,
    recentSearches,
    recentSaved,
    qualityGroups,
  ] = await Promise.all([
    prisma.search.count({ where: { userId } }),
    prisma.savedLead.count({ where: { userId } }),
    prisma.savedLead.count({
      where: { userId, lead: { qualityTier: "hot" } },
    }),
    prisma.search.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        industry: true,
        country: true,
        state: true,
        city: true,
        resultCount: true,
        createdAt: true,
      },
    }),
    prisma.savedLead.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        lead: {
          select: {
            businessName: true,
            city: true,
            state: true,
            industry: true,
            qualityTier: true,
            leadScore: true,
            ownerName: true,
          },
        },
      },
    }),
    prisma.lead.groupBy({
      by: ["qualityTier"],
      where: { search: { userId } },
      _count: { _all: true },
    }),
  ]);

  const quality = qualityGroups
    .map((g) => `${g.qualityTier || "unknown"}: ${g._count._all}`)
    .join(", ");

  const searchLines = recentSearches.map(
    (s) =>
      `- ${s.industry} · ${s.country}${s.state ? `/${s.state}` : ""}${s.city ? `/${s.city}` : ""} → ${s.resultCount} results (${s.createdAt.toISOString().slice(0, 10)})`,
  );

  const savedLines = recentSaved.map(
    (s) =>
      `- ${s.lead.businessName} (${s.lead.qualityTier || "n/a"}, score ${s.lead.leadScore})${s.lead.ownerName ? ` · owner ${s.lead.ownerName}` : ""}${s.lead.city ? ` · ${s.lead.city}` : ""}`,
  );

  return [
    "Workspace data (live):",
    `Total searches run: ${searchCount}`,
    `Saved leads in CRM: ${savedCount} (${hotSaved} hot)`,
    quality && `Lead quality mix from searches: ${quality}`,
    searchLines.length ? `Recent searches:\n${searchLines.join("\n")}` : null,
    savedLines.length ? `Recent saved leads:\n${savedLines.join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
