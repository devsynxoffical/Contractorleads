import { prisma } from "@/lib/prisma";

export type CrmWebhookEvent =
  | "leadflow.test"
  | "lead.saved"
  | "lead.status_changed";

type LeadPayload = {
  id?: string;
  businessName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  industry?: string | null;
  qualityTier?: string | null;
  leadScore?: number | null;
  status?: string | null;
};

/**
 * Fire-and-forget CRM webhook. Never throws to callers.
 * Pass `force: true` for manual test pings (ignores enabled toggle if URL exists).
 */
export async function dispatchCrmWebhook(
  userId: string,
  event: CrmWebhookEvent,
  lead?: LeadPayload,
  extra?: Record<string, unknown>,
  opts?: { force?: boolean },
): Promise<{ delivered: boolean; status?: number; error?: string }> {
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        crmWebhookUrl: true,
        crmWebhookSecret: true,
        crmWebhookEnabled: true,
        companyName: true,
        email: true,
      },
    });

    if (!row?.crmWebhookUrl) {
      return { delivered: false, error: "no url" };
    }
    if (!opts?.force && !row.crmWebhookEnabled) {
      return { delivered: false, error: "disabled" };
    }

    const payload = {
      event,
      sentAt: new Date().toISOString(),
      agency: row.companyName || row.email,
      lead: lead ?? null,
      ...extra,
    };

    const res = await fetch(row.crmWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(row.crmWebhookSecret
          ? { "X-LeadFlow-Secret": row.crmWebhookSecret }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12_000),
    });

    return { delivered: res.ok, status: res.status };
  } catch (e) {
    return {
      delivered: false,
      error: e instanceof Error ? e.message : "Webhook failed",
    };
  }
}
