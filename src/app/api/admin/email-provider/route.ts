import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  getEmailProviderStatus,
  saveEmailProviderConfig,
} from "@/lib/email-config";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getEmailProviderStatus());
}

export async function PUT(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const resendApiKey =
    typeof body.resendApiKey === "string" ? body.resendApiKey.trim() : "";
  const sendgridApiKey =
    typeof body.sendgridApiKey === "string" ? body.sendgridApiKey.trim() : "";
  const fromEmail =
    typeof body.fromEmail === "string" ? body.fromEmail.trim() : undefined;

  if (resendApiKey && !resendApiKey.startsWith("re_")) {
    return NextResponse.json(
      { error: "Resend API key must start with re_." },
      { status: 400 },
    );
  }
  if (sendgridApiKey && !sendgridApiKey.startsWith("SG.")) {
    return NextResponse.json(
      { error: "SendGrid API key must start with SG." },
      { status: 400 },
    );
  }
  if (fromEmail && !/.+@.+\..+/.test(fromEmail)) {
    return NextResponse.json(
      {
        error:
          'From address must contain a valid email, e.g. Contractor Leads <noreply@contractorleads.us>.',
      },
      { status: 400 },
    );
  }

  await saveEmailProviderConfig({
    resendApiKey: resendApiKey || undefined,
    sendgridApiKey: sendgridApiKey || undefined,
    fromEmail,
    clearResendApiKey: body.clearResendApiKey === true,
    clearSendgridApiKey: body.clearSendgridApiKey === true,
  });

  return NextResponse.json({ ok: true, ...(await getEmailProviderStatus()) });
}
