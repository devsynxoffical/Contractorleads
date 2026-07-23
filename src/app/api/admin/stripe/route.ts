import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  getStripeBillingStatus,
  saveStripeBillingConfig,
} from "@/lib/stripe-config";
import { appBaseUrl } from "@/lib/stripe";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = await getStripeBillingStatus();
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
  await saveStripeBillingConfig({
    secretKey:
      typeof body.secretKey === "string" ? body.secretKey : undefined,
    webhookSecret:
      typeof body.webhookSecret === "string" ? body.webhookSecret : undefined,
    priceStarter:
      typeof body.priceStarter === "string" ? body.priceStarter : undefined,
    priceGrowth:
      typeof body.priceGrowth === "string" ? body.priceGrowth : undefined,
    priceAgency:
      typeof body.priceAgency === "string" ? body.priceAgency : undefined,
    clearSecretKey: body.clearSecretKey === true,
    clearWebhookSecret: body.clearWebhookSecret === true,
  });

  const status = await getStripeBillingStatus();
  return NextResponse.json({
    ok: true,
    ...status,
    webhookUrl: `${appBaseUrl()}/api/billing/webhook`,
  });
}
