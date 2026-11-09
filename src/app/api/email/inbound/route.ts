import { NextResponse } from "next/server";
import { ingestInboundEmail } from "@/lib/lead-email";
import { bearerToken, secretsMatch } from "@/lib/rate-limit";

/**
 * Inbound email webhook — point a mail provider (Resend/SendGrid/Mailgun inbound,
 * or a forwarder) here so replies land on the lead timeline and pause sequences.
 *
 * Auth: Authorization: Bearer <INBOUND_EMAIL_SECRET>
 * Body JSON: { fromEmail, toEmail, subject, body, messageId?, inReplyTo?, userId? }
 */
export async function POST(request: Request) {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "INBOUND_EMAIL_SECRET is not configured" },
      { status: 503 },
    );
  }

  // Header only: a `?secret=` would end up in access logs and Referer headers.
  if (!secretsMatch(bearerToken(request), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const fromEmail =
    String(body.fromEmail || body.from || "").trim() ||
    extractAngle(String(body.From || ""));
  const toEmail =
    String(body.toEmail || body.to || "").trim() ||
    extractAngle(String(body.To || ""));
  const subject = String(body.subject || body.Subject || "").trim();
  const text = String(
    body.body || body.text || body["body-plain"] || body.html || "",
  ).trim();

  try {
    const result = await ingestInboundEmail({
      userId: body.userId ? String(body.userId) : undefined,
      fromEmail,
      toEmail,
      subject,
      body: text,
      messageId: body.messageId ? String(body.messageId) : undefined,
      inReplyTo: body.inReplyTo ? String(body.inReplyTo) : undefined,
      references: body.references ? String(body.references).slice(0, 2000) : undefined,
      headers: pickHeaders(body.headers),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Inbound failed" },
      { status: 400 },
    );
  }
}

function extractAngle(raw: string) {
  const m = raw.match(/<([^>]+)>/);
  return (m?.[1] || raw).trim();
}

/** Optional `headers` object from the webhook payload: keep only the auto-reply markers. */
function pickHeaders(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const keys = ["auto-submitted", "x-autoreply", "x-auto-reply", "x-autorespond", "precedence", "content-type"];
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = k.toLowerCase();
    if (keys.includes(key) && v != null) out[key] = String(v).slice(0, 200);
  }
  return Object.keys(out).length ? out : undefined;
}
