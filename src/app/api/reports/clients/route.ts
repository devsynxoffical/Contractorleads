import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertPlanFeatureApi } from "@/lib/plan-access-server";
import { LEAD_REPORT_SCRIPT_TYPE } from "@/lib/services/lead-intelligence-report-meta";

function reportTypesFilter() {
  return {
    OR: [
      { type: { startsWith: LEAD_REPORT_SCRIPT_TYPE } },
      { type: { startsWith: "qualification_detail:" } },
      { type: { startsWith: "qualification" } },
    ],
  };
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locked = assertPlanFeatureApi(user, "reports");
  if (locked) return locked;

  const url = new URL(request.url);
  const leadId = url.searchParams.get("leadId")?.trim() || "";
  const q = url.searchParams.get("q")?.trim() || "";

  if (leadId) {
    const saved = await prisma.savedLead.findFirst({
      where: {
        userId: user.id,
        leadId,
      },
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
            address: true,
            outreachAngle: true,
          },
        },
      },
    });

    if (!saved) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const email = saved.lead.email?.trim().toLowerCase() || null;

    const [reports, emailsByLead, emailsByAddress] = await Promise.all([
      prisma.script.findMany({
        where: {
          userId: user.id,
          relatedLeadId: leadId,
          ...reportTypesFilter(),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          type: true,
          content: true,
          createdAt: true,
        },
      }),
      prisma.leadEmail.findMany({
        where: { userId: user.id, leadId },
        orderBy: { createdAt: "desc" },
        take: 80,
      }),
      email
        ? prisma.leadEmail.findMany({
            where: {
              userId: user.id,
              OR: [
                { toEmail: { equals: email, mode: "insensitive" } },
                { fromEmail: { equals: email, mode: "insensitive" } },
              ],
            },
            orderBy: { createdAt: "desc" },
            take: 80,
            include: {
              lead: { select: { id: true, businessName: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const emailMap = new Map<string, (typeof emailsByLead)[number]>();
    for (const row of [...emailsByLead, ...emailsByAddress]) {
      emailMap.set(row.id, row);
    }
    const emails = [...emailMap.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return NextResponse.json({
      client: {
        leadId: saved.lead.id,
        savedLeadId: saved.id,
        status: saved.status,
        favorite: saved.favorite,
        businessName: saved.lead.businessName,
        ownerName: saved.lead.ownerName,
        phone: saved.lead.phone,
        email: saved.lead.email,
        website: saved.lead.website,
        city: saved.lead.city,
        state: saved.lead.state,
        industry: saved.lead.industry,
        leadScore: saved.lead.leadScore,
        qualityTier: saved.lead.qualityTier,
        googleRating: saved.lead.googleRating,
        reviewCount: saved.lead.reviewCount,
        address: saved.lead.address,
        outreachAngle: saved.lead.outreachAngle,
        updatedAt: saved.updatedAt.toISOString(),
      },
      reports: reports.map((r) => ({
        id: r.id,
        title: r.title || "Untitled report",
        type: r.type,
        preview: r.content.slice(0, 280),
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      })),
      emails: emails.map((e) => ({
        id: e.id,
        direction: e.direction,
        fromEmail: e.fromEmail,
        toEmail: e.toEmail,
        subject: e.subject,
        body: e.body,
        status: e.status,
        error: e.error,
        createdAt: e.createdAt.toISOString(),
        leadId: e.leadId,
      })),
      counts: {
        reports: reports.length,
        emails: emails.length,
        outbound: emails.filter((e) => e.direction === "outbound").length,
        inbound: emails.filter((e) => e.direction === "inbound").length,
      },
    });
  }

  const leadWhere: Record<string, unknown> = {};
  if (q) {
    leadWhere.OR = [
      { businessName: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { industry: { contains: q, mode: "insensitive" } },
    ];
  }

  const saved = await prisma.savedLead.findMany({
    where: {
      userId: user.id,
      ...(Object.keys(leadWhere).length ? { lead: leadWhere } : {}),
    },
    include: {
      lead: {
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          phone: true,
          email: true,
          city: true,
          state: true,
          industry: true,
          leadScore: true,
          qualityTier: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const leadIds = saved.map((s) => s.lead.id);
  const emailsLower = [
    ...new Set(
      saved
        .map((s) => s.lead.email?.trim().toLowerCase())
        .filter((v): v is string => Boolean(v)),
    ),
  ];

  const [reportGroups, emailByLead, emailByAddress] = await Promise.all([
    leadIds.length
      ? prisma.script.groupBy({
          by: ["relatedLeadId"],
          where: {
            userId: user.id,
            relatedLeadId: { in: leadIds },
            ...reportTypesFilter(),
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    leadIds.length
      ? prisma.leadEmail.groupBy({
          by: ["leadId"],
          where: { userId: user.id, leadId: { in: leadIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    emailsLower.length
      ? prisma.leadEmail.findMany({
          where: {
            userId: user.id,
            OR: emailsLower.flatMap((email) => [
              { toEmail: { equals: email, mode: "insensitive" as const } },
              { fromEmail: { equals: email, mode: "insensitive" as const } },
            ]),
          },
          select: { toEmail: true, fromEmail: true, leadId: true },
          take: 2000,
        })
      : Promise.resolve([]),
  ]);

  const reportCountByLead = new Map(
    reportGroups
      .filter((g) => g.relatedLeadId)
      .map((g) => [g.relatedLeadId!, g._count._all]),
  );
  const emailCountByLead = new Map(
    emailByLead.map((g) => [g.leadId, g._count._all]),
  );

  const emailCountByAddress = new Map<string, number>();
  for (const row of emailByAddress) {
    const keys = [row.toEmail, row.fromEmail]
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    for (const key of keys) {
      if (!emailsLower.includes(key)) continue;
      emailCountByAddress.set(key, (emailCountByAddress.get(key) || 0) + 1);
    }
  }

  const clients = saved.map((s) => {
    const emailKey = s.lead.email?.trim().toLowerCase() || "";
    const byLead = emailCountByLead.get(s.lead.id) || 0;
    const byEmail = emailKey ? emailCountByAddress.get(emailKey) || 0 : 0;
    return {
      leadId: s.lead.id,
      savedLeadId: s.id,
      status: s.status,
      businessName: s.lead.businessName,
      ownerName: s.lead.ownerName,
      phone: s.lead.phone,
      email: s.lead.email,
      city: s.lead.city,
      state: s.lead.state,
      industry: s.lead.industry,
      leadScore: s.lead.leadScore,
      qualityTier: s.lead.qualityTier,
      reportCount: reportCountByLead.get(s.lead.id) || 0,
      emailCount: Math.max(byLead, byEmail),
      updatedAt: s.updatedAt.toISOString(),
    };
  });

  return NextResponse.json({
    clients,
    total: clients.length,
    agency: {
      companyName: user.companyName,
      name: user.name,
      email: user.email,
    },
  });
}
