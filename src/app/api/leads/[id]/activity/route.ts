import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEAD_REPORT_SCRIPT_TYPE } from "@/lib/services/lead-intelligence-report-meta";

type Params = { params: Promise<{ id: string }> };

function reportTypesFilter() {
  return {
    OR: [
      { type: { startsWith: LEAD_REPORT_SCRIPT_TYPE } },
      { type: { startsWith: "qualification_detail:" } },
      { type: { startsWith: "qualification" } },
    ],
  };
}

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: leadId } = await params;

  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      OR: [
        { search: { userId: user.id } },
        { savedBy: { some: { userId: user.id } } },
      ],
    },
    select: {
      id: true,
      email: true,
      businessName: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const email = lead.email?.trim().toLowerCase() || null;

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

  const outbound = emails.filter((e) => e.direction === "outbound").length;
  const inbound = emails.filter((e) => e.direction === "inbound").length;

  return NextResponse.json({
    leadId: lead.id,
    businessName: lead.businessName,
    email: lead.email,
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
    })),
    counts: {
      reports: reports.length,
      emails: emails.length,
      outbound,
      inbound,
    },
  });
}
