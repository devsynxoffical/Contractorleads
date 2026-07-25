import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSmsDashboardStats } from "@/lib/sms-dashboard";
import { getTwilioStatus } from "@/lib/twilio-config";
import { appBaseUrl } from "@/lib/email-brand";

export async function GET(request: Request) {
  const admin = await requirePermission("communications");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 50), 200);

  const [stats, messages, topAgencies, twilio] = await Promise.all([
    getSmsDashboardStats(),
    prisma.leadSms.findMany({
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        direction: true,
        status: true,
        body: true,
        fromPhone: true,
        toPhone: true,
        createdAt: true,
        error: true,
        twilioSid: true,
        user: {
          select: {
            id: true,
            email: true,
            companyName: true,
            name: true,
          },
        },
        lead: {
          select: { id: true, businessName: true, phone: true },
        },
      },
    }),
    prisma.leadSms.groupBy({
      by: ["userId"],
      _count: { _all: true },
      orderBy: { _count: { userId: "desc" } },
      take: 15,
    }),
    getTwilioStatus(appBaseUrl()),
  ]);

  const agencyUsers = await prisma.user.findMany({
    where: { id: { in: topAgencies.map((a) => a.userId) } },
    select: {
      id: true,
      email: true,
      companyName: true,
      name: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
    },
  });
  const userMap = new Map(agencyUsers.map((u) => [u.id, u]));

  return NextResponse.json({
    stats,
    messages,
    twilio: {
      liveReady: twilio.liveReady,
      fromNumber: twilio.fromNumber,
      messagingServiceSid: twilio.messagingServiceSid,
      webhookUrl: twilio.webhookUrl,
      source: twilio.source,
    },
    topAgencies: topAgencies.map((row) => {
      const u = userMap.get(row.userId);
      return {
        userId: row.userId,
        count: row._count._all,
        email: u?.email ?? "",
        companyName: u?.companyName ?? null,
        name: u?.name ?? null,
        messagingAddonStatus: u?.messagingAddonStatus ?? "inactive",
        messagingAddonManual: Boolean(u?.messagingAddonManual),
      };
    }),
  });
}
