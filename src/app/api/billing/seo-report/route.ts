import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, isRazorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";
import { getRazorpayBillingSecrets } from "@/lib/razorpay-config";
import {
  generateSeoAnalysisReport,
  normalizeWebsiteInput,
  SEO_REPORT_ADDON_PRICE_USD,
} from "@/lib/seo-report-addon";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const latest = await prisma.script.findFirst({
    where: { userId: user.id, type: "seo_website_report" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, content: true, createdAt: true },
  });

  return NextResponse.json({
    available: await isRazorpayConfigured(),
    priceUsd: SEO_REPORT_ADDON_PRICE_USD,
    latest,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await isRazorpayConfigured())) {
    return NextResponse.json(
      { error: "Razorpay is not configured. Ask an admin to check Admin → System & API Keys." },
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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      phone: true,
    },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const { client, keyId } = await getRazorpayClient();
    const amountCents = Math.round(SEO_REPORT_ADDON_PRICE_USD * 100); // $15.00 -> 1500
    const receipt = `addon_seo_${user.id.slice(-6)}_${Date.now()}`;

    const order = await client.orders.create({
      amount: amountCents,
      currency: "USD",
      receipt,
      notes: {
        userId: dbUser.id,
        addon: "seo_report",
        website,
        userEmail: dbUser.email,
      },
    });

    return NextResponse.json({
      provider: "razorpay",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      name: "AI Website + SEO Report ($15)",
      description: `In-depth SEO report for ${website}`,
      website,
      user: {
        name: dbUser.name || dbUser.companyName || "Customer",
        email: dbUser.email,
        phone: dbUser.phone || "",
      },
    });
  } catch (err) {
    console.error("[billing/seo-report]", err);
    const msg = err instanceof Error ? err.message : "Razorpay order creation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.razorpay_order_id || "").trim();
  const paymentId = String(body.razorpay_payment_id || "").trim();
  const signature = String(body.razorpay_signature || "").trim();
  const website = normalizeWebsiteInput(body.website || "");

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "Incomplete payment verification payload from Razorpay." },
      { status: 400 },
    );
  }

  const secrets = await getRazorpayBillingSecrets();
  const isValid = verifyRazorpaySignature({
    orderId,
    paymentId,
    signature,
    keySecret: secrets.keySecret,
  });

  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid payment signature. Verification failed." },
      { status: 400 },
    );
  }

  let report = null;
  if (website) {
    const reportText = await generateSeoAnalysisReport(website);
    report = await prisma.script.create({
      data: {
        userId: user.id,
        type: "seo_website_report",
        title: `SEO Report for ${website}`,
        content: reportText,
      },
      select: { id: true, title: true, content: true, createdAt: true },
    });
  }

  return NextResponse.json({ ok: true, report });
}
