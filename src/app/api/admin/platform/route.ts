import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_PLANS, featuresForPlan, planLabel } from "@/lib/plans";
import { ADMIN_STAFF_ROLES } from "@/lib/roles";

export async function GET() {
  const admin = await requirePermission("platform");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staffFilter = { role: { notIn: [...ADMIN_STAFF_ROLES] } };

  const [
    customers,
    suspended,
    leads,
    savedLeads,
    searches,
    exportsCount,
    scripts,
    aiChats,
    teamSeats,
    smtpAccounts,
    sequencesEnabled,
    leadEmails,
    referrals,
    crmConnected,
    slackConnected,
    ghlConnected,
    apiKeyed,
    marketingOptOut,
    planGroups,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: staffFilter }),
    prisma.user.count({ where: { ...staffFilter, isActive: false } }),
    prisma.lead.count(),
    prisma.savedLead.count(),
    prisma.search.count(),
    prisma.export.count(),
    prisma.script.count(),
    prisma.aiConversation.count(),
    prisma.teamMember.count({ where: { status: { not: "revoked" } } }),
    prisma.smtpAccount.count(),
    prisma.emailSequence.count({ where: { enabled: true } }),
    prisma.leadEmail.count(),
    prisma.referral.count(),
    prisma.user.count({
      where: { ...staffFilter, crmWebhookEnabled: true, crmWebhookUrl: { not: null } },
    }),
    prisma.user.count({
      where: { ...staffFilter, slackEnabled: true, slackWebhookUrl: { not: null } },
    }),
    prisma.user.count({
      where: { ...staffFilter, ghlEnabled: true, ghlWebhookUrl: { not: null } },
    }),
    prisma.user.count({
      where: { ...staffFilter, apiKeyLast4: { not: null } },
    }),
    prisma.user.count({
      where: { ...staffFilter, emailMarketingOptIn: false },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      where: staffFilter,
      _count: { _all: true },
    }),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, companyName: true, name: true } },
      },
    }),
  ]);

  const modules = [
    {
      id: "customers",
      title: "Customers & agencies",
      description: "Accounts, plans, credits, suspend, impersonate, delete",
      href: "/admin/customers",
      metric: `${customers} accounts`,
      status: customers > 0 ? "ready" : "empty",
    },
    {
      id: "site-leads",
      title: "Site leads (marketing)",
      description: "Homepage visitor capture and CSV export",
      href: "/admin/site-leads",
      metric: "Visitor funnel",
      status: "ready",
    },
    {
      id: "leads",
      title: "Lead pool",
      description: "Edit, enrich, bulk actions, export, scrape, copy to customers",
      href: "/admin/leads",
      metric: `${leads} leads · ${savedLeads} saved`,
      status: leads > 0 ? "ready" : "empty",
    },
    {
      id: "searches",
      title: "Search history",
      description: "Every agency Lead Finder run",
      href: "/admin/searches",
      metric: `${searches} searches`,
      status: "ready",
    },
    {
      id: "scrape",
      title: "Scrape leads",
      description: "Admin Places scrape into the shared pool",
      href: "/admin/scrape",
      metric: "Ops tool",
      status: "ready",
    },
    {
      id: "copy",
      title: "Copy leads",
      description: "Assign pool leads into a customer CRM",
      href: "/admin/copy-leads",
      metric: "Ops tool",
      status: "ready",
    },
    {
      id: "plans",
      title: "Plans & entitlements",
      description: "Starter → Growth → Agency → Enterprise feature gates",
      href: "/admin/plans",
      metric: `${ADMIN_PLANS.length} plans`,
      status: "ready",
    },
    {
      id: "revenue",
      title: "Revenue & subscriptions",
      description: "Plan mix, credits outstanding, subscription statuses",
      href: "/admin/revenue",
      metric: "Billing ops",
      status: "ready",
    },
    {
      id: "referrals",
      title: "Referrals & affiliates",
      description: "Reward config, leaderboard, attribution",
      href: "/admin/referrals",
      metric: `${referrals} referrals`,
      status: "ready",
    },
    {
      id: "comms",
      title: "Email dashboard",
      description: "Delivered / received / failed lead emails, SMTP, sequences",
      href: "/admin/communications",
      metric: `${leadEmails} emails · ${sequencesEnabled} sequences`,
      status: "ready",
    },
    {
      id: "templates",
      title: "Transactional templates",
      description: "Verify, welcome, reset, scrape email copy",
      href: "/admin/email-preview",
      metric: "Brand emails",
      status: "ready",
    },
    {
      id: "exports",
      title: "Exports log",
      description: "CSV / Excel / PDF export activity across agencies",
      href: "/admin/exports",
      metric: `${exportsCount} exports`,
      status: "ready",
    },
    {
      id: "integrations",
      title: "Customer integrations",
      description: "API keys, CRM / Slack / GHL webhooks (per customer)",
      href: "/admin/customers",
      metric: `${apiKeyed} API · ${crmConnected} CRM · ${slackConnected} Slack · ${ghlConnected} GHL`,
      status: "ready",
    },
    {
      id: "teams",
      title: "Agency team seats",
      description: "Users & teams invites (Agency+)",
      href: "/admin/plans",
      metric: `${teamSeats} seats invited`,
      status: "ready",
    },
    {
      id: "ai",
      title: "AI usage",
      description: "Ask Expert chats and saved outreach scripts",
      href: "/admin/activity",
      metric: `${aiChats} chats · ${scripts} scripts`,
      status: "ready",
    },
    {
      id: "activity",
      title: "Activity log",
      description: "Auditable product events",
      href: "/admin/activity",
      metric: "Audit trail",
      status: "ready",
    },
    {
      id: "health",
      title: "Feature health",
      description: "Keys and integration readiness",
      href: "/admin/health",
      metric: "Diagnostics",
      status: "ready",
    },
    {
      id: "system",
      title: "System & Stripe keys",
      description: "Edit Stripe Billing keys in-admin; other secrets stay masked from env",
      href: "/admin/system",
      metric: "Infra",
      status: "ready",
    },
    {
      id: "staff",
      title: "Team & roles",
      description: "Managers, sub-admins, permission templates",
      href: "/admin/team",
      metric: "Access control",
      status: "ready",
    },
  ];

  return NextResponse.json({
    summary: {
      customers,
      suspended,
      leads,
      savedLeads,
      searches,
      exports: exportsCount,
      scripts,
      aiChats,
      teamSeats,
      smtpAccounts,
      sequencesEnabled,
      leadEmails,
      referrals,
      crmConnected,
      slackConnected,
      ghlConnected,
      apiKeyed,
      marketingOptOut,
    },
    planMix: planGroups.map((g) => ({
      plan: g.plan,
      label: planLabel(g.plan),
      count: g._count._all,
      features: featuresForPlan(g.plan),
    })),
    modules,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt,
      user: a.user,
    })),
  });
}
