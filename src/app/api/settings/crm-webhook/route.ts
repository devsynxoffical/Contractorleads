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
    },
  });

  return NextResponse.json({
    webhook: {
      url: row?.crmWebhookUrl ?? "",
      secret: row?.crmWebhookSecret ?? "",
      enabled: row?.crmWebhookEnabled ?? false,
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

  if (enabled && url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "Webhook URL must start with http:// or https://" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      crmWebhookUrl: url || null,
      crmWebhookSecret: secret || null,
      crmWebhookEnabled: enabled && Boolean(url),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { crmWebhookUrl: true },
  });

  if (!row?.crmWebhookUrl) {
    return NextResponse.json({ error: "Save a webhook URL first" }, { status: 400 });
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
    { force: true },
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
