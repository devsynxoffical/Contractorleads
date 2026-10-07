import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, isRazorpayConfigured, verifyRazorpaySignature } from "@/lib/razorpay";
import { getRazorpayBillingSecrets } from "@/lib/razorpay-config";
import {
  MESSAGING_ADDON_PRICE_USD,
  hasMessagingAddon,
} from "@/lib/messaging-addon";
import { activateMessagingAddonWithRazorpay } from "@/lib/billing-razorpay";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
    },
  });

  return NextResponse.json({
    active: dbUser ? hasMessagingAddon(dbUser) : false,
    status: dbUser?.messagingAddonStatus ?? "inactive",
    comped: Boolean(dbUser?.messagingAddonManual),
    priceUsd: MESSAGING_ADDON_PRICE_USD,
    available: await isRazorpayConfigured(),
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

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      phone: true,
      role: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
    },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (hasMessagingAddon(dbUser)) {
    return NextResponse.json(
      { error: "You already have the Messaging add-on." },
      { status: 400 },
    );
  }

  try {
    const { client, keyId } = await getRazorpayClient();
    const amountCents = Math.round(MESSAGING_ADDON_PRICE_USD * 100); // $30.00 -> 3000
    const receipt = `addon_msg_${user.id.slice(-6)}_${Date.now()}`;

    const order = await client.orders.create({
      amount: amountCents,
      currency: "USD",
      receipt,
      notes: {
        userId: dbUser.id,
        addon: "messaging",
        userEmail: dbUser.email,
      },
    });

    return NextResponse.json({
      provider: "razorpay",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      name: "Messaging Add-on ($30/mo)",
      description: "Unlocks bulk automated email and SMS outreach",
      user: {
        name: dbUser.name || dbUser.companyName || "Customer",
        email: dbUser.email,
        phone: dbUser.phone || "",
      },
    });
  } catch (err) {
    console.error("[billing/messaging-addon]", err);
    const msg = err instanceof Error ? err.message : "Razorpay order creation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  // Verification handler for Messaging Add-on
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.razorpay_order_id || "").trim();
  const paymentId = String(body.razorpay_payment_id || "").trim();
  const signature = String(body.razorpay_signature || "").trim();

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

  await activateMessagingAddonWithRazorpay({
    userId: user.id,
    orderId,
    paymentId,
  });

  return NextResponse.json({ ok: true, active: true });
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, messagingAddonManual: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (dbUser.messagingAddonManual) {
    return NextResponse.json(
      { error: "Your Messaging add-on was granted by an admin. Contact support to change it." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { messagingAddonStatus: "canceled" },
  });

  return NextResponse.json({ ok: true, status: "canceled" });
}
