import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Inbox of received (inbound) emails for the logged-in agency. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 50), 100);
  const unreadOnly = url.searchParams.get("unread") === "1";

  const where = {
    userId: user.id,
    direction: "inbound",
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [emails, unreadCount] = await Promise.all([
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
  ]);

  return NextResponse.json({
    unreadCount,
    emails: emails.map((e) => ({
      ...e,
      preview: e.body.slice(0, 180),
    })),
  });
}
