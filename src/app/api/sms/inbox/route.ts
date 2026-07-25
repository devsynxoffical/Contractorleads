import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasMessagingAddon } from "@/lib/messaging-addon";
import { isTwilioConfigured } from "@/lib/twilio-config";

/** List recent SMS conversations for the inbox. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
    },
  });

  const addon = hasMessagingAddon(dbUser ?? user);
  const twilioReady = await isTwilioConfigured();

  const messages = await prisma.leadSms.findMany({
    where: { userId: user.id },
    include: {
      lead: {
        select: {
          id: true,
          businessName: true,
          phone: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Collapse to one row per lead (latest message)
  const byLead = new Map<
    string,
    {
      leadId: string;
      businessName: string;
      phone: string | null;
      preview: string;
      direction: string;
      status: string;
      createdAt: string;
      unread: boolean;
      lastId: string;
    }
  >();

  for (const m of messages) {
    if (byLead.has(m.leadId)) continue;
    byLead.set(m.leadId, {
      leadId: m.leadId,
      businessName: m.lead.businessName,
      phone: m.lead.phone,
      preview: m.body.slice(0, 120),
      direction: m.direction,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
      unread: m.direction === "inbound" && !m.readAt,
      lastId: m.id,
    });
  }

  const unreadCount = await prisma.leadSms.count({
    where: {
      userId: user.id,
      direction: "inbound",
      readAt: null,
    },
  });

  return NextResponse.json({
    threads: [...byLead.values()],
    unreadCount,
    hasAddon: addon,
    twilioReady,
  });
}
