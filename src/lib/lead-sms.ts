import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { dispatchCrmWebhook } from "@/lib/crm-webhook";
import { findOwnedLead } from "@/lib/lead-ownership";
import { getTwilioSecrets } from "@/lib/twilio-config";
import { toE164 } from "@/lib/phone";

const MAX_BODY = 1600;

export async function getTwilioClient() {
  const secrets = await getTwilioSecrets();
  if (
    !secrets.accountSid ||
    !secrets.authToken ||
    (!secrets.fromNumber && !secrets.messagingServiceSid)
  ) {
    throw new Error(
      "Twilio is not configured. Ask an admin to add Account SID, Auth Token, and a From number in Admin → System.",
    );
  }
  return {
    client: twilio(secrets.accountSid, secrets.authToken),
    secrets,
  };
}

/**
 * Send a one-off SMS to a lead's phone via the platform Twilio number.
 * Auto-saves the lead if needed and moves pipeline to contacted.
 */
export async function sendLeadSms(opts: {
  userId: string;
  leadId: string;
  body: string;
}) {
  const body = opts.body.trim();
  if (!body) throw new Error("Message body is required");
  if (body.length > MAX_BODY) {
    throw new Error(`Message must be ${MAX_BODY} characters or fewer`);
  }

  const lead = await findOwnedLead(opts.userId, opts.leadId);
  if (!lead) throw new Error("Lead not found");

  const to = toE164(lead.phone);
  if (!to) {
    throw new Error(
      "This lead has no valid phone number. Add a US number like (555) 123-4567.",
    );
  }

  let saved = await prisma.savedLead.findUnique({
    where: {
      userId_leadId: { userId: opts.userId, leadId: opts.leadId },
    },
  });
  if (!saved) {
    saved = await prisma.savedLead.create({
      data: { userId: opts.userId, leadId: opts.leadId, status: "new" },
    });
  }

  const { client, secrets } = await getTwilioClient();

  const createOpts: {
    to: string;
    body: string;
    from?: string;
    messagingServiceSid?: string;
  } = {
    to,
    body,
  };
  if (secrets.messagingServiceSid) {
    createOpts.messagingServiceSid = secrets.messagingServiceSid;
  } else {
    createOpts.from = secrets.fromNumber;
  }

  try {
    const msg = await client.messages.create(createOpts);
    const fromPhone =
      msg.from || secrets.fromNumber || secrets.messagingServiceSid || "";

    const row = await prisma.leadSms.create({
      data: {
        userId: opts.userId,
        leadId: opts.leadId,
        savedLeadId: saved.id,
        direction: "outbound",
        fromPhone,
        toPhone: to,
        body,
        status: msg.status === "failed" ? "failed" : "sent",
        twilioSid: msg.sid,
        error: msg.errorMessage || null,
      },
    });

    if (saved.status === "new") {
      await prisma.savedLead.update({
        where: { id: saved.id },
        data: { status: "contacted" },
      });
      void dispatchCrmWebhook(
        opts.userId,
        "lead.status_changed",
        {
          id: lead.id,
          businessName: lead.businessName,
          phone: lead.phone,
          email: lead.email,
          website: lead.website,
          address: lead.address,
          industry: lead.industry,
          qualityTier: lead.qualityTier,
          leadScore: lead.leadScore,
        },
        { from: "new", to: "contacted" },
      );
    }

    await logActivity(
      opts.userId,
      "sms.sent",
      `SMS to ${lead.businessName}`,
      { leadId: opts.leadId, twilioSid: msg.sid },
    );

    return { sms: row, twilioSid: msg.sid };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Twilio send failed";
    await prisma.leadSms.create({
      data: {
        userId: opts.userId,
        leadId: opts.leadId,
        savedLeadId: saved.id,
        direction: "outbound",
        fromPhone: secrets.fromNumber || secrets.messagingServiceSid || "",
        toPhone: to,
        body,
        status: "failed",
        error: message,
      },
    });
    throw new Error(message);
  }
}

/**
 * Record an inbound Twilio SMS and attach it to the most recent outbound
 * conversation with that phone number (platform shared number).
 */
export async function recordInboundSms(opts: {
  fromPhone: string;
  toPhone: string;
  body: string;
  twilioSid?: string | null;
}) {
  const from = toE164(opts.fromPhone);
  const to = toE164(opts.toPhone) || opts.toPhone.trim();
  if (!from) return null;

  if (opts.twilioSid) {
    const existing = await prisma.leadSms.findUnique({
      where: { twilioSid: opts.twilioSid },
    });
    if (existing) return existing;
  }

  // Prefer the most recent outbound we sent TO this phone
  const prior = await prisma.leadSms.findFirst({
    where: {
      direction: "outbound",
      OR: [{ toPhone: from }, { toPhone: opts.fromPhone.trim() }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!prior) {
    // No thread to attach — ignore (or could store orphan later)
    return null;
  }

  const row = await prisma.leadSms.create({
    data: {
      userId: prior.userId,
      leadId: prior.leadId,
      savedLeadId: prior.savedLeadId,
      direction: "inbound",
      fromPhone: from,
      toPhone: to,
      body: opts.body || "",
      status: "received",
      twilioSid: opts.twilioSid || null,
    },
  });

  await logActivity(
    prior.userId,
    "sms.received",
    `SMS reply from lead`,
    { leadId: prior.leadId, twilioSid: opts.twilioSid },
  );

  return row;
}
