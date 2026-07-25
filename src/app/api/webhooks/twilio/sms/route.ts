import { NextResponse } from "next/server";
import twilio from "twilio";
import { getTwilioSecrets } from "@/lib/twilio-config";
import { recordInboundSms } from "@/lib/lead-sms";

/**
 * Twilio inbound SMS webhook.
 * Configure in Twilio Console → Phone Number → Messaging →
 * "A message comes in" → Webhook → POST this URL.
 */
export async function POST(request: Request) {
  const secrets = await getTwilioSecrets();
  if (!secrets.authToken) {
    return new NextResponse("Twilio not configured", { status: 503 });
  }

  const form = await request.formData();
  const params: Record<string, string> = {};
  form.forEach((value, key) => {
    params[key] = String(value);
  });

  const signature = request.headers.get("x-twilio-signature") || "";
  const url = request.url;

  const valid = twilio.validateRequest(
    secrets.authToken,
    signature,
    url,
    params,
  );

  // In local/dev behind tunnels the public URL may differ — still require a signature
  // when we have one, but allow missing signature only when TWILIO_SKIP_VALIDATE=1.
  if (!valid) {
    if (process.env.TWILIO_SKIP_VALIDATE === "1") {
      console.warn("[twilio webhook] signature skipped (TWILIO_SKIP_VALIDATE=1)");
    } else {
      return new NextResponse("Invalid signature", { status: 403 });
    }
  }

  const from = params.From || "";
  const to = params.To || "";
  const body = params.Body || "";
  const sid = params.MessageSid || params.SmsSid || "";

  try {
    await recordInboundSms({
      fromPhone: from,
      toPhone: to,
      body,
      twilioSid: sid || null,
    });
  } catch (err) {
    console.error("[twilio webhook]", err);
  }

  // Empty TwiML — no auto-reply
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    },
  );
}
