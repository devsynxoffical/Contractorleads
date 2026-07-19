import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto-secret";
import { createSmtpTransport, getUserSmtpConfig } from "@/lib/user-smtp";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.userSmtpSettings.findUnique({ where: { userId: user.id } });
  if (!row) return NextResponse.json({ settings: null });

  return NextResponse.json({
    settings: {
      host: row.host,
      port: row.port,
      secure: row.secure,
      username: row.username,
      fromEmail: row.fromEmail,
      fromName: row.fromName,
      enabled: row.enabled,
      hasPassword: Boolean(row.passwordEnc),
      lastTestedAt: row.lastTestedAt,
    },
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const host = String(body.host || "").trim();
  const port = Number(body.port || 587);
  const username = String(body.username || "").trim();
  const fromEmail = String(body.fromEmail || "").trim();
  const fromName = String(body.fromName || "").trim() || null;
  const secure = Boolean(body.secure);
  const enabled = body.enabled !== false;
  const password = String(body.password || "");

  if (!host || !username || !fromEmail) {
    return NextResponse.json(
      { error: "Host, username, and from email are required" },
      { status: 400 },
    );
  }

  const existing = await prisma.userSmtpSettings.findUnique({
    where: { userId: user.id },
  });

  if (!password && !existing?.passwordEnc) {
    return NextResponse.json(
      { error: "SMTP password is required" },
      { status: 400 },
    );
  }

  const passwordEnc = password
    ? encryptSecret(password)
    : (existing!.passwordEnc as string);

  const row = await prisma.userSmtpSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      host,
      port,
      secure,
      username,
      passwordEnc,
      fromEmail,
      fromName,
      enabled,
    },
    update: {
      host,
      port,
      secure,
      username,
      passwordEnc,
      fromEmail,
      fromName,
      enabled,
    },
  });

  return NextResponse.json({
    ok: true,
    settings: {
      host: row.host,
      port: row.port,
      secure: row.secure,
      username: row.username,
      fromEmail: row.fromEmail,
      fromName: row.fromName,
      enabled: row.enabled,
      hasPassword: true,
    },
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body.action || "test";

  if (action !== "test") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const cfg = await getUserSmtpConfig(user.id);
  if (!cfg) {
    return NextResponse.json(
      { error: "Save SMTP settings first" },
      { status: 400 },
    );
  }

  try {
    const transport = createSmtpTransport(cfg);
    await transport.verify();
    await prisma.userSmtpSettings.update({
      where: { userId: user.id },
      data: { lastTestedAt: new Date() },
    });
    return NextResponse.json({ ok: true, message: "SMTP connection verified" });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "SMTP test failed",
      },
      { status: 400 },
    );
  }
}
