import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanEmailBody, getEmailPreviewSnippet } from "@/lib/email-content";

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

  const where = {
    userId: user.id,
    ...directionFilter,
    ...(unreadOnly ? { readAt: null } : {}),
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
      },
    }),
    prisma.leadEmail.count({
      where: {
        userId: user.id,
        direction: "inbound",
      },
    }),
    prisma.leadEmail.count({
      where: {
        userId: user.id,
        direction: "outbound",
      },
    }),
    prisma.leadEmail.count({
      where: {
        userId: user.id,
      },
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    inboundCount,
    outboundCount,
    totalCount,
    emails: emails.map((e) => {
      const clean = cleanEmailBody(e.body);
      return {
        ...e,
        body: clean,
        preview: getEmailPreviewSnippet(e.body, 140),
      };
    }),
  });
}
