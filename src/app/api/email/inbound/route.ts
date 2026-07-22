import { NextResponse } from "next/server";
import { ingestInboundEmail } from "@/lib/lead-email";

/**
 * Inbound email webhook — point a mail provider (Resend/SendGrid/Mailgun inbound,
 * or a forwarder) here so replies land on the lead timeline and pause sequences.
 *
 * Auth: Authorization: Bearer <INBOUND_EMAIL_SECRET> or ?secret=
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

  const url = new URL(request.url);
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const qs = url.searchParams.get("secret") || "";
  if (bearer !== secret && qs !== secret) {
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
