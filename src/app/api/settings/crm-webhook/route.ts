import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchCrmWebhook } from "@/lib/crm-webhook";
import { assertPlanFeatureApi } from "@/lib/plan-access-server";
import { assertPublicUrl, BlockedUrlError } from "@/lib/safe-fetch";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = assertPlanFeatureApi(user, "crm");
  if (forbidden) return forbidden;

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      crmWebhookUrl: true,
      crmWebhookSecret: true,
      crmWebhookEnabled: true,
      slackWebhookUrl: true,
      slackEnabled: true,
      ghlWebhookUrl: true,
      ghlEnabled: true,
    },
  });

  return NextResponse.json({
    webhook: {
      url: row?.crmWebhookUrl ?? "",
      secret: row?.crmWebhookSecret ?? "",
      enabled: row?.crmWebhookEnabled ?? false,
    },
    slack: {
      url: row?.slackWebhookUrl ?? "",
      enabled: row?.slackEnabled ?? false,
    },
    ghl: {
      url: row?.ghlWebhookUrl ?? "",
      enabled: row?.ghlEnabled ?? false,
    },
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = assertPlanFeatureApi(user, "crm");
  if (forbidden) return forbidden;

  const body = await request.json();
  const url = String(body.url || "").trim();
  const secret = String(body.secret || "").trim();
  const enabled = Boolean(body.enabled);
  const slackUrl = String(body.slackUrl || "").trim();
  const slackEnabled = Boolean(body.slackEnabled);
  const ghlUrl = String(body.ghlUrl || "").trim();
  const ghlEnabled = Boolean(body.ghlEnabled);

  for (const [label, candidate] of [
    ["Webhook URL", url],
    ["Slack webhook URL", slackUrl],
    ["GoHighLevel webhook URL", ghlUrl],
  ] as const) {
    if (!candidate) continue;
    try {
      await assertPublicUrl(candidate);
    } catch (e) {
      const reason =
        e instanceof BlockedUrlError ? e.message : "Enter a valid https:// URL.";
      return NextResponse.json({ error: `${label}: ${reason}` }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      crmWebhookUrl: url || null,
      crmWebhookSecret: secret || null,
      crmWebhookEnabled: enabled && Boolean(url),
      slackWebhookUrl: slackUrl || null,
      slackEnabled: slackEnabled && Boolean(slackUrl),
      ghlWebhookUrl: ghlUrl || null,
      ghlEnabled: ghlEnabled && Boolean(ghlUrl),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = assertPlanFeatureApi(user, "crm");
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const targetRaw = String(body.target || "webhook");
  const target = (["webhook", "slack", "ghl"].includes(targetRaw)
    ? targetRaw
    : "webhook") as "webhook" | "slack" | "ghl";

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { crmWebhookUrl: true, slackWebhookUrl: true, ghlWebhookUrl: true },
  });

  if (
    (target === "webhook" && !row?.crmWebhookUrl) ||
    (target === "slack" && !row?.slackWebhookUrl) ||
    (target === "ghl" && !row?.ghlWebhookUrl)
  ) {
    return NextResponse.json(
      { error: `Save a ${target.toUpperCase()} URL first` },
      { status: 400 },
    );
  }

  const result = await dispatchCrmWebhook(
    user.id,
    "contractorleads.test",
    {
      businessName: "Acme Roofing Co",
      phone: "+1 555 0100",
      qualityTier: "hot",
      leadScore: 88,
    },
    undefined,
    { force: true, target },
  );

  if (!result.delivered) {
    return NextResponse.json(
      {
        ok: false,
        status: result.status,
        message: result.error || `Remote returned ${result.status}`,
        error: result.error || `Remote returned ${result.status}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    message: "Test ping delivered",
  });
}
