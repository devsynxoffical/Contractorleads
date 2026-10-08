import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { isGlobalSuperAdmin } from "@/lib/roles";

/** Inbox of received (inbound) emails for the logged-in agency. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 50), 100);
  const unreadOnly = url.searchParams.get("unread") === "1";
  const tab = url.searchParams.get("tab") || "all";

  const directionFilter =
    tab === "inbound"
      ? { direction: "inbound" }
      : tab === "outbound"
      ? { direction: "outbound" }
      : {};

  const isSuper = isGlobalSuperAdmin(user);
  let allowedEmailsCondition: any = {};

  if (!isSuper) {
    const [assignedSys, userCustom] = await Promise.all([
      prisma.systemSmtpAccount.findMany({
        where: { assignedUserId: user.id, enabled: true },
        select: { fromEmail: true, id: true },
      }),
      prisma.smtpAccount.findMany({
        where: { userId: user.id, enabled: true },
        select: { fromEmail: true, id: true },
      }),
    ]);

    const allowedAddresses = [
      ...assignedSys.map((s) => s.fromEmail.toLowerCase().trim()),
      ...userCustom.map((c) => c.fromEmail.toLowerCase().trim()),
    ].filter(Boolean);

    const allowedSysIds = assignedSys.map((s) => s.id);
    const allowedCustomIds = userCustom.map((c) => c.id);

    allowedEmailsCondition = {
      OR: [
        { toEmail: { in: allowedAddresses, mode: "insensitive" } },
        { fromEmail: { in: allowedAddresses, mode: "insensitive" } },
        { systemSmtpAccountId: { in: allowedSysIds } },
        { smtpAccountId: { in: allowedCustomIds } },
      ],
    };
  }

  const where = {
    userId: user.id,
    ...directionFilter,
    ...(unreadOnly ? { readAt: null } : {}),
    ...allowedEmailsCondition,
  };

  const [emails, unreadCount, inboundCount, outboundCount, totalCount] = await Promise.all([
    prisma.leadEmail.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        direction: true,
        status: true,
        subject: true,
        body: true,
        fromEmail: true,
        toEmail: true,
        createdAt: true,
        readAt: true,
        messageId: true,
        lead: {
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    prisma.leadEmail.count({
      where: {
        userId: user.id,
        direction: "inbound",
        readAt: null,
        ...allowedEmailsCondition,
      },
    }),
    prisma.leadEmail.count({
      where: {
        userId: user.id,
        direction: "inbound",
        ...allowedEmailsCondition,
      },
    }),
    prisma.leadEmail.count({
      where: {
        userId: user.id,
        direction: "outbound",
        ...allowedEmailsCondition,
      },
    }),
    prisma.leadEmail.count({
      where: {
        userId: user.id,
        ...allowedEmailsCondition,
      },
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    inboundCount,
    outboundCount,
    totalCount,
    emails: emails.map((e) => ({
      ...e,
      preview: e.body.slice(0, 180),
    })),
  });
}
