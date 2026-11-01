import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayBillingSecrets } from "@/lib/razorpay-config";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { activateUserPlanWithRazorpay, activateMessagingAddonWithRazorpay } from "@/lib/billing-razorpay";
import { generateSeoAnalysisReport } from "@/lib/seo-report-addon";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secrets = await getRazorpayBillingSecrets();
  const signature = request.headers.get("x-razorpay-signature");

  const rawBody = await request.text();

  // Never process an unverified payload. Without a configured secret we
  // cannot verify anything, so refuse (503) rather than trust the body.
  if (!secrets.webhookSecret) {
    console.warn(
      "[razorpay webhook] RAZORPAY_WEBHOOK_SECRET is not configured — event ignored",
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 },
    );
  }
  if (
    !signature ||
    !verifyRazorpayWebhookSignature({
      body: rawBody,
      signature,
      webhookSecret: secrets.webhookSecret,
    })
  ) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  type RazorpayEntity = {
    id?: string;
    order_id?: string;
    notes?: Record<string, string | undefined>;
  };
  type RazorpayEvent = {
    event?: string;
    payload?: {
      payment?: { entity?: RazorpayEntity };
      order?: { entity?: RazorpayEntity };
    };
  };
  let event: RazorpayEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const payload = event?.payload;
    const payment = payload?.payment?.entity;
    const order = payload?.order?.entity;

    const notes = payment?.notes || order?.notes || {};
    const userId = notes?.userId;
    const plan = notes?.plan;
    const addon = notes?.addon;

    if (userId) {
      if (addon === "messaging" && (event.event === "payment.captured" || event.event === "order.paid")) {
        await activateMessagingAddonWithRazorpay({
          userId,
          orderId: order?.id || payment?.order_id,
          paymentId: payment?.id,
        });
      } else if (addon === "seo_report" && notes?.website && (event.event === "payment.captured" || event.event === "order.paid")) {
        const reportText = await generateSeoAnalysisReport(notes.website);
        await prisma.script.create({
          data: {
            userId,
            type: "seo_website_report",
            title: `SEO Report for ${notes.website}`,
            content: reportText,
          },
        });
      } else if (plan && (event.event === "payment.captured" || event.event === "order.paid")) {
        await activateUserPlanWithRazorpay({
          userId,
          plan,
          billingPeriod: notes.billingPeriod === "annual" ? "annual" : "monthly",
          orderId: order?.id || payment?.order_id,
          paymentId: payment?.id,
          couponCode: notes.couponCode,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[razorpay webhook error]", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
