import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchCrmWebhook } from "@/lib/crm-webhook";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const body = await request.json();
  const url = String(body.url || "").trim();
  const secret = String(body.secret || "").trim();
  const enabled = Boolean(body.enabled);
  const slackUrl = String(body.slackUrl || "").trim();
  const slackEnabled = Boolean(body.slackEnabled);
  const ghlUrl = String(body.ghlUrl || "").trim();
  const ghlEnabled = Boolean(body.ghlEnabled);

  if (url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "Webhook URL must start with http:// or https://" },
      { status: 400 },
    );
  }
  if (slackUrl && !/^https?:\/\//i.test(slackUrl)) {
    return NextResponse.json(
      { error: "Slack webhook URL must start with http:// or https://" },
      { status: 400 },
    );
  }
  if (ghlUrl && !/^https?:\/\//i.test(ghlUrl)) {
    return NextResponse.json(
      { error: "GoHighLevel webhook URL must start with http:// or https://" },
      { status: 400 },
    );
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
    "leadflow.test",
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
