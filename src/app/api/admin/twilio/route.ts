import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getTwilioStatus, saveTwilioConfig } from "@/lib/twilio-config";
import { appBaseUrl } from "@/lib/email-brand";
import { toE164 } from "@/lib/phone";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getTwilioStatus(appBaseUrl()));
}

export async function PUT(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const accountSid =
    typeof body.accountSid === "string" ? body.accountSid.trim() : "";
  const authToken =
    typeof body.authToken === "string" ? body.authToken.trim() : "";
  const fromNumber =
    typeof body.fromNumber === "string" ? body.fromNumber.trim() : undefined;
  const messagingServiceSid =
    typeof body.messagingServiceSid === "string"
      ? body.messagingServiceSid.trim()
      : undefined;

  if (accountSid && !/^AC[a-f0-9]{32}$/i.test(accountSid)) {
    return NextResponse.json(
      { error: "Account SID must look like AC… (34 characters)." },
      { status: 400 },
    );
  }
  if (
    messagingServiceSid &&
    messagingServiceSid.length > 0 &&
    !/^MG[a-f0-9]{32}$/i.test(messagingServiceSid)
  ) {
    return NextResponse.json(
      { error: "Messaging Service SID must look like MG…." },
      { status: 400 },
    );
  }
  if (fromNumber !== undefined && fromNumber) {
    const e164 = toE164(fromNumber);
    if (!e164) {
      return NextResponse.json(
        {
          error:
            "From number must be a valid phone, preferably E.164 like +15551234567.",
        },
        { status: 400 },
      );
    }
  }

  await saveTwilioConfig({
    accountSid: accountSid || undefined,
    authToken: authToken || undefined,
    fromNumber:
      fromNumber === undefined
        ? undefined
        : fromNumber
          ? toE164(fromNumber) || fromNumber
          : "",
    messagingServiceSid,
    clearAccountSid: body.clearAccountSid === true,
    clearAuthToken: body.clearAuthToken === true,
    clearFromNumber: body.clearFromNumber === true,
    clearMessagingServiceSid: body.clearMessagingServiceSid === true,
  });

  return NextResponse.json({
    ok: true,
    ...(await getTwilioStatus(appBaseUrl())),
  });
}
