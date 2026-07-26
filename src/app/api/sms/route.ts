import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasMessagingAddon } from "@/lib/messaging-addon";
import { findOwnedLead } from "@/lib/lead-ownership";
import { sendLeadSms } from "@/lib/lead-sms";
import { isTwilioConfigured } from "@/lib/twilio-config";

/** Thread for one lead + mark inbound as read. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leadId = new URL(request.url).searchParams.get("leadId")?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const lead = await findOwnedLead(user.id, leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const thread = await prisma.leadSms.findMany({
    where: { userId: user.id, leadId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.leadSms.updateMany({
    where: {
      userId: user.id,
      leadId,
      direction: "inbound",
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({
    lead: {
      id: lead.id,
      businessName: lead.businessName,
      phone: lead.phone,
      email: lead.email,
    },
    thread: thread.map((m) => ({
      id: m.id,
      direction: m.direction,
      status: m.status,
      body: m.body,
      fromPhone: m.fromPhone,
      toPhone: m.toPhone,
      createdAt: m.createdAt.toISOString(),
      error: m.error,
    })),
  });
}

/** Send an SMS to a lead (Messaging add-on required). */
export async function POST(request: Request) {
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

  if (!hasMessagingAddon(dbUser ?? user)) {
    return NextResponse.json(
      {
        error:
          "SMS requires the Messaging add-on ($15.50/mo). Upgrade under Plans & Billing.",
        code: "messaging_addon_required",
      },
      { status: 402 },
    );
  }

  if (!(await isTwilioConfigured())) {
    return NextResponse.json(
      {
        error:
          "SMS is not set up yet. An admin must add Twilio credentials in Admin → System.",
        code: "twilio_not_configured",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const leadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  const text = typeof body.body === "string" ? body.body : "";

  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  try {
    const result = await sendLeadSms({
      userId: user.id,
      leadId,
      body: text,
    });
    return NextResponse.json({
      ok: true,
      sms: {
        id: result.sms.id,
        twilioSid: result.twilioSid,
        status: result.sms.status,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
