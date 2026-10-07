import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  getRazorpayBillingStatus,
  saveRazorpayBillingConfig,
} from "@/lib/razorpay-config";
import { appBaseUrl } from "@/lib/email-brand";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = await getRazorpayBillingStatus();
  return NextResponse.json({
    ...status,
    webhookUrl: `${appBaseUrl()}/api/billing/webhook`,
  });
}

export async function PUT(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const keyId = typeof body.keyId === "string" ? body.keyId.trim() : "";
  const keySecret = typeof body.keySecret === "string" ? body.keySecret.trim() : "";
  const webhookSecret = typeof body.webhookSecret === "string" ? body.webhookSecret.trim() : "";

  if (keyId && !/^rzp_(test|live)_/.test(keyId)) {
    return NextResponse.json(
      { error: "Razorpay Key ID must start with rzp_test_ or rzp_live_." },
      { status: 400 },
    );
  }

  await saveRazorpayBillingConfig({
    keyId: keyId || undefined,
    keySecret: keySecret || undefined,
    webhookSecret: webhookSecret || undefined,
    clearKeyId: body.clearKeyId === true,
    clearKeySecret: body.clearKeySecret === true,
    clearWebhookSecret: body.clearWebhookSecret === true,
  });

  const status = await getRazorpayBillingStatus();
  return NextResponse.json({
    ok: true,
    ...status,
    webhookUrl: `${appBaseUrl()}/api/billing/webhook`,
  });
}
