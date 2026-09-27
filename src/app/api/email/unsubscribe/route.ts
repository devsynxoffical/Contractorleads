import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailActionToken } from "@/lib/email";
import { triggerFollowUpStopLogic } from "@/lib/campaign-runner";

/** One-click / link unsubscribe for product notifications and campaign prospects. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const email = url.searchParams.get("email")?.trim() ?? "";
  const campaignId = url.searchParams.get("campaignId")?.trim() ?? undefined;

  // If email is directly passed for a prospect unsubscribe
  if (email) {
    await triggerFollowUpStopLogic(email, "unsubscribed", { campaignId });
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Unsubscribed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; color: #1e293b; }
    .card { background: white; padding: 2.5rem; border-radius: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); max-width: 420px; text-align: center; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-bottom: 1.5rem; }
    .badge { display: inline-block; background: #ecfdf5; color: #059669; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Preferences Updated</div>
    <h1>Successfully Unsubscribed</h1>
    <p><strong>${email}</strong> has been removed from all future email outreach and automated follow-ups.</p>
  </div>
</body>
</html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Token-based unsubscribe (user notification preferences)
  const verified = verifyEmailActionToken(token, "unsub");
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: verified.userId },
    data: { emailMarketingOptIn: false },
  });
  return NextResponse.json({
    ok: true,
    message: "You have been unsubscribed from product notification emails.",
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? "").trim();
  const token = String(body.token ?? "").trim();
  const campaignId = body.campaignId ? String(body.campaignId) : undefined;

  if (email) {
    await triggerFollowUpStopLogic(email, "unsubscribed", { campaignId });
    return NextResponse.json({ ok: true, message: "Unsubscribed from outreach campaigns" });
  }

  const verified = verifyEmailActionToken(token, "unsub");
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: verified.userId },
    data: { emailMarketingOptIn: false },
  });
  return NextResponse.json({ ok: true });
}
