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
  const secretKey =
    typeof body.secretKey === "string" ? body.secretKey.trim() : "";
  const publishableKey =
    typeof body.publishableKey === "string"
      ? body.publishableKey.trim()
      : "";
  const webhookSecret =
    typeof body.webhookSecret === "string"
      ? body.webhookSecret.trim()
      : "";

  if (secretKey && !/^sk_(test|live)_/.test(secretKey)) {
    return NextResponse.json(
      { error: "Secret API key must start with sk_test_ or sk_live_." },
      { status: 400 },
    );
  }
  if (publishableKey && !/^pk_(test|live)_/.test(publishableKey)) {
    return NextResponse.json(
      { error: "Publishable key must start with pk_test_ or pk_live_." },
      { status: 400 },
    );
  }
  if (webhookSecret && !webhookSecret.startsWith("whsec_")) {
    return NextResponse.json(
      { error: "Webhook signing secret must start with whsec_." },
      { status: 400 },
    );
  }
  if (
    secretKey &&
    publishableKey &&
    secretKey.split("_")[1] !== publishableKey.split("_")[1]
  ) {
    return NextResponse.json(
      { error: "Secret and publishable keys must both use test mode or both use live mode." },
      { status: 400 },
    );
  }

  await saveStripeBillingConfig({
    secretKey: secretKey || undefined,
    publishableKey: publishableKey || undefined,
    webhookSecret: webhookSecret || undefined,
    priceStarter:
      typeof body.priceStarter === "string" ? body.priceStarter : undefined,
    priceStarterAnnual:
      typeof body.priceStarterAnnual === "string"
        ? body.priceStarterAnnual
        : undefined,
    priceGrowth:
      typeof body.priceGrowth === "string" ? body.priceGrowth : undefined,
    priceGrowthAnnual:
      typeof body.priceGrowthAnnual === "string"
        ? body.priceGrowthAnnual
        : undefined,
    priceAgency:
      typeof body.priceAgency === "string" ? body.priceAgency : undefined,
    priceAgencyAnnual:
      typeof body.priceAgencyAnnual === "string"
        ? body.priceAgencyAnnual
        : undefined,
    priceMessaging:
      typeof body.priceMessaging === "string" ? body.priceMessaging : undefined,
    priceSeoReport:
      typeof body.priceSeoReport === "string" ? body.priceSeoReport : undefined,
    clearSecretKey: body.clearSecretKey === true,
    clearPublishableKey: body.clearPublishableKey === true,
    clearWebhookSecret: body.clearWebhookSecret === true,
  });

  const status = await getStripeBillingStatus();
  return NextResponse.json({
    ok: true,
    ...status,
    webhookUrl: `${appBaseUrl()}/api/billing/webhook`,
  });
}
