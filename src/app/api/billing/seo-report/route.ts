import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, getStripe, isSeoReportAddonConfigured, seoReportAddonPriceId } from "@/lib/stripe";
import {
  normalizeWebsiteInput,
  SEO_REPORT_ADDON_PRICE_USD,
} from "@/lib/seo-report-addon";

function stripeErrorMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Stripe request failed";
  const e = err as { message?: string; raw?: { message?: string } };
  const raw = e.raw?.message || e.message || "Stripe request failed";
  if (/no such price/i.test(raw)) {
    return "The AI Website + SEO Report price is not configured correctly. Ask an admin to check Admin -> System & API Keys.";
  }
  return raw;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const latest = await prisma.script.findFirst({
    where: { userId: user.id, type: "seo_website_report" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, content: true, createdAt: true },
  });

  return NextResponse.json({
    available: await isSeoReportAddonConfigured(),
    priceUsd: SEO_REPORT_ADDON_PRICE_USD,
    latest,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isSeoReportAddonConfigured())) {
    return NextResponse.json(
      {
        error:
          "The AI Website + SEO Report add-on is not available yet. Ask an admin to configure its Stripe price.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const websiteRaw = typeof body.website === "string" ? body.website : "";
  const website = normalizeWebsiteInput(websiteRaw);
  if (!website) {
    return NextResponse.json(
      { error: "Enter a valid website URL (example: https://example.com)." },
      { status: 400 },
    );
  }

  const priceId = await seoReportAddonPriceId();
  if (!priceId) {
    return NextResponse.json(
      { error: "AI Website + SEO Report price is not configured." },
      { status: 503 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      stripeCustomerId: true,
    },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const stripe = await getStripe();
    let customerId = dbUser.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name || dbUser.companyName || undefined,
        metadata: { userId: dbUser.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const base = appBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: dbUser.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/billing?seo=active&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing?seo=canceled`,
      allow_promotion_codes: true,
      metadata: {
        userId: dbUser.id,
        addon: "seo_report",
        website,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create Checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[billing/seo-report]", err);
    return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 502 });
  }
}
