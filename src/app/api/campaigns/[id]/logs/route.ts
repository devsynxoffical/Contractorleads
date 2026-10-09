import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status") || "all";
  const prospectId = searchParams.get("prospectId");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const campaign = await prisma.campaign.findUnique({
    where: { id, userId: user.id },
    select: { id: true, name: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const whereClause: Record<string, unknown> = {
    campaignId: id,
  };

  if (status === "opened") {
    whereClause.OR = [
      { status: "opened" },
      { openedAt: { not: null } },
      { prospect: { OR: [{ status: "opened" }, { openedAt: { not: null } }] } },
    ];
  } else if (status === "replied") {
    whereClause.OR = [
      { status: "replied" },
      { repliedAt: { not: null } },
      { prospect: { OR: [{ status: "replied" }, { repliedAt: { not: null } }] } },
    ];
  } else if (status === "clicked") {
    whereClause.OR = [
      { status: "clicked" },
      { clickedAt: { not: null } },
      { prospect: { OR: [{ status: "clicked" }, { clickedAt: { not: null } }] } },
    ];
  } else if (status === "bounced") {
    whereClause.OR = [
      { status: "bounced" },
      { bouncedAt: { not: null } },
      { prospect: { OR: [{ status: "bounced" }, { bouncedAt: { not: null } }] } },
    ];
  } else if (status === "failed") {
    whereClause.status = "failed";
  } else if (status === "sent") {
    whereClause.status = { not: "failed" };
  }

  if (prospectId) {
    whereClause.prospectId = prospectId;
  }

  if (q) {
    whereClause.OR = [
      { toEmail: { contains: q, mode: "insensitive" } },
      { fromEmail: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { prospect: { businessName: { contains: q, mode: "insensitive" } } },
      { prospect: { ownerName: { contains: q, mode: "insensitive" } } },
    ];
  }

  let [logs, totalCount] = await Promise.all([
    prisma.campaignLog.findMany({
      where: whereClause,
      take: limit,
      skip,
      orderBy: { sentAt: "desc" },
      include: {
        prospect: {
          select: {
            id: true,
            businessName: true,
            ownerName: true,
            email: true,
            phone: true,
            city: true,
            state: true,
            status: true,
            assignedHookId: true,
            openCount: true,
            clickCount: true,
            repliedAt: true,
            leadId: true,
          },
        },
      },
    }),
    prisma.campaignLog.count({
      where: whereClause,
    }),
  ]);

  // If filtering for "replied" and no logs returned or missing prospects, check replied prospects directly
  if (status === "replied" && logs.length === 0) {
    const repliedProspects = await prisma.campaignProspect.findMany({
      where: {
        campaignId: id,
        OR: [{ status: "replied" }, { repliedAt: { not: null } }],
      },
      take: limit,
      skip,
      orderBy: { updatedAt: "desc" },
    });

    if (repliedProspects.length > 0) {
      logs = repliedProspects.map((p) => ({
        id: `synth-${p.id}`,
        campaignId: p.campaignId,
        prospectId: p.id,
        stepIndex: p.currentStepIndex,
        hookId: p.assignedHookId,
        mailboxId: p.lastMailboxId,
        fromEmail: p.lastFromEmail || "agency@contractorleads.us",
        toEmail: p.email,
        subject: p.lastSubject || `Re: Outreach to ${p.businessName}`,
        body: `Prospect ${p.businessName} responded to campaign sequence.`,
        status: "replied",
        error: null,
        trackingToken: null,
        messageId: null,
        openedAt: p.openedAt || p.repliedAt,
        clickedAt: p.clickedAt,
        repliedAt: p.repliedAt || p.updatedAt,
        bouncedAt: null,
        sentAt: p.lastSentAt || p.createdAt,
        prospect: {
          id: p.id,
          businessName: p.businessName,
          ownerName: p.ownerName,
          email: p.email,
          phone: p.phone,
          city: p.city,
          state: p.state,
          status: p.status,
          assignedHookId: p.assignedHookId,
          openCount: p.openCount,
          clickCount: p.clickCount,
          repliedAt: p.repliedAt,
          leadId: p.leadId,
        },
      }));
      totalCount = repliedProspects.length;
    }
  }

  // Enrich logs with latest incoming reply messages if available
  if (logs.length > 0) {
    const prospectEmails = logs
      .map((l) => l.prospect?.email?.toLowerCase().trim())
      .filter((e): e is string => Boolean(e));

    if (prospectEmails.length > 0) {
      const inboundEmails = await prisma.leadEmail.findMany({
        where: {
          userId: user.id,
          direction: "inbound",
          fromEmail: { in: prospectEmails, mode: "insensitive" },
        },
        orderBy: { createdAt: "desc" },
      });

      if (inboundEmails.length > 0) {
        const inboundByEmail = new Map<string, (typeof inboundEmails)[0]>();
        for (const inb of inboundEmails) {
          const k = inb.fromEmail.toLowerCase().trim();
          if (!inboundByEmail.has(k)) {
            inboundByEmail.set(k, inb);
          }
        }

        logs = logs.map((log) => {
          const emailKey = log.prospect?.email?.toLowerCase().trim();
          const inbound = emailKey ? inboundByEmail.get(emailKey) : null;
          if (inbound && (log.status === "replied" || log.repliedAt || log.prospect?.repliedAt)) {
            return {
              ...log,
              repliedAt: log.repliedAt || inbound.createdAt,
              body: `💬 Received Reply:\n${inbound.body || inbound.subject}`,
              subject: inbound.subject || log.subject,
            };
          }
          return log;
        });
      }
    }
  }

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
  });
}
