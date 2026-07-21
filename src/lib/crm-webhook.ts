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

type DestinationResult = {
  name: "webhook" | "slack" | "ghl";
  delivered: boolean;
  status?: number;
  error?: string;
};

function mapEventLabel(event: CrmWebhookEvent) {
  if (event === "lead.saved") return "Lead saved";
  if (event === "lead.status_changed") return "Lead moved in pipeline";
  return "LeadFlow test";
}

async function postJson(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<{ delivered: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(headers ?? {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    return { delivered: res.ok, status: res.status };
  } catch (e) {
    return { delivered: false, error: e instanceof Error ? e.message : "Request failed" };
  }
}

/**
 * Fire-and-forget CRM webhook. Never throws to callers.
 * Pass `force: true` for manual test pings (ignores enabled toggle if URL exists).
 */
export async function dispatchCrmWebhook(
  userId: string,
  event: CrmWebhookEvent,
  lead?: LeadPayload,
  extra?: Record<string, unknown>,
  opts?: { force?: boolean; target?: "webhook" | "slack" | "ghl" },
): Promise<{ delivered: boolean; status?: number; error?: string }> {
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        crmWebhookUrl: true,
        crmWebhookSecret: true,
        crmWebhookEnabled: true,
        slackWebhookUrl: true,
        slackEnabled: true,
        ghlWebhookUrl: true,
        ghlEnabled: true,
        companyName: true,
        email: true,
      },
    });

    if (!row) {
      return { delivered: false, error: "user not found" };
    }

    const payload = {
      event,
      sentAt: new Date().toISOString(),
      agency: row.companyName || row.email,
      lead: lead ?? null,
      ...extra,
    };

    const results: DestinationResult[] = [];

    if (
      row.crmWebhookUrl &&
      (opts?.force || row.crmWebhookEnabled) &&
      (!opts?.target || opts.target === "webhook")
    ) {
      const out = await postJson(
        row.crmWebhookUrl,
        payload,
        row.crmWebhookSecret
          ? { "X-LeadFlow-Secret": row.crmWebhookSecret }
          : undefined,
      );
      results.push({ name: "webhook", ...out });
    }

    if (
      row.slackWebhookUrl &&
      (opts?.force || row.slackEnabled) &&
      (!opts?.target || opts.target === "slack")
    ) {
      const textParts = [
        `*${mapEventLabel(event)}*`,
        `Agency: ${row.companyName || row.email}`,
        lead?.businessName ? `Business: ${lead.businessName}` : null,
        lead?.status ? `Status: ${lead.status}` : null,
        lead?.leadScore != null ? `Score: ${lead.leadScore}` : null,
      ].filter(Boolean);
      const out = await postJson(row.slackWebhookUrl, {
        text: textParts.join("\n"),
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: textParts.join("\n"),
            },
          },
        ],
      });
      results.push({ name: "slack", ...out });
    }

    if (
      row.ghlWebhookUrl &&
      (opts?.force || row.ghlEnabled) &&
      (!opts?.target || opts.target === "ghl")
    ) {
      const out = await postJson(row.ghlWebhookUrl, {
        source: "leadflow",
        event,
        sentAt: new Date().toISOString(),
        agency: row.companyName || row.email,
        lead: lead ?? null,
        ...extra,
      });
      results.push({ name: "ghl", ...out });
    }

    if (!results.length) {
      return { delivered: false, error: "No CRM destination configured/enabled" };
    }

    const firstSuccess = results.find((r) => r.delivered);
    if (firstSuccess) {
      return { delivered: true, status: firstSuccess.status };
    }
    const errorText = results.map((r) => `${r.name}: ${r.error || r.status || "failed"}`).join("; ");
    return { delivered: false, error: errorText };
  } catch (e) {
    return {
      delivered: false,
      error: e instanceof Error ? e.message : "Webhook failed",
    };
  }
}
