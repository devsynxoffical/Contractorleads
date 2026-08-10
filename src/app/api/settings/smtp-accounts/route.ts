import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyResendApiKey } from "@/lib/email";
import {
  createSmtpTransport,
  ensureSingleDefault,
  formatSmtpError,
  getSmtpAccountPerformance,
  getUserSenderConfig,
  getUserSmtpConfig,
  listSmtpAccounts,
  maskSmtpAccount,
  migrateLegacySmtpIfNeeded,
  upsertSmtpAccount,
} from "@/lib/user-smtp";
import { assertPublicSmtpHost } from "@/lib/safe-fetch";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await migrateLegacySmtpIfNeeded(user.id);
  const rows = await listSmtpAccounts(user.id);
  const performance = await getSmtpAccountPerformance(user.id);
  return NextResponse.json({
    accounts: rows.map(maskSmtpAccount),
    performance,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const action = String(body.action || "create");

  if (action === "test") {
    const accountId = body.id ? String(body.id) : null;
    const sender = await getUserSenderConfig(user.id, accountId);
    if (!sender) {
      return NextResponse.json({ error: "Save sender settings first" }, { status: 400 });
    }
    if (sender.deliveryMode === "platform") {
      const key = sender.resendApiKey;
      if (!key) {
        return NextResponse.json({ error: "Save your Resend API key first" }, { status: 400 });
      }
      const check = await verifyResendApiKey(key);
      if (!check.ok) {
        return NextResponse.json({ error: check.error || "Invalid Resend key" }, { status: 400 });
      }
      if (sender.id) {
        await prisma.smtpAccount.update({
          where: { id: sender.id },
          data: { lastTestedAt: new Date() },
        });
      }
      return NextResponse.json({
        ok: true,
        message: "Resend API key verified",
      });
    }
    const cfg = sender.smtp;
    if (!cfg) {
      return NextResponse.json({ error: "Custom SMTP is not fully configured" }, { status: 400 });
    }
    try {
      await assertPublicSmtpHost(cfg.host);
      const transport = createSmtpTransport(cfg);
      await transport.verify();
      if (cfg.id) {
        await prisma.smtpAccount.update({
          where: { id: cfg.id },
          data: { lastTestedAt: new Date() },
        });
      }
      return NextResponse.json({ ok: true, message: "SMTP connection verified" });
    } catch (e) {
      return NextResponse.json(
        { error: formatSmtpError(e) },
        { status: 400 },
      );
    }
  }

  if (action === "set_default") {
    const id = String(body.id || "");
    const row = await prisma.smtpAccount.findFirst({
      where: { id, userId: user.id },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await ensureSingleDefault(user.id, id);
    const rows = await listSmtpAccounts(user.id);
    return NextResponse.json({ ok: true, accounts: rows.map(maskSmtpAccount) });
  }

  try {
    const row = await upsertSmtpAccount({
      userId: user.id,
      label: String(body.label || "Mailbox").trim() || "Mailbox",
      host: String(body.host || "").trim(),
      port: Number(body.port || 587),
      secure: Boolean(body.secure),
      username: String(body.username || "").trim(),
      password: String(body.password || ""),
      fromEmail: String(body.fromEmail || "").trim(),
      fromName: String(body.fromName || "").trim() || null,
      enabled: body.enabled !== false,
      isDefault: Boolean(body.isDefault),
      deliveryMode: body.deliveryMode === "smtp" ? "smtp" : "platform",
      resendApiKey:
        typeof body.resendApiKey === "string" ? body.resendApiKey.trim() : undefined,
      sendWeight: typeof body.sendWeight === "number" ? body.sendWeight : undefined,
    });
    return NextResponse.json({ ok: true, account: maskSmtpAccount(row) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save SMTP" },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Lightweight action: adjust only rotation weight without resubmitting secrets.
  if (body.action === "set_weight") {
    const row = await prisma.smtpAccount.findFirst({
      where: { id, userId: user.id },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const sendWeight = Math.max(
      1,
      Math.min(100, Math.round(Number(body.sendWeight) || 1)),
    );
    await prisma.smtpAccount.update({
      where: { id },
      data: { sendWeight },
    });
    const rows = await listSmtpAccounts(user.id);
    const performance = await getSmtpAccountPerformance(user.id);
    return NextResponse.json({
      ok: true,
      accounts: rows.map(maskSmtpAccount),
      performance,
    });
  }

  try {
    const row = await upsertSmtpAccount({
      userId: user.id,
      id,
      label: String(body.label || "Mailbox").trim() || "Mailbox",
      host: String(body.host || "").trim(),
      port: Number(body.port || 587),
      secure: Boolean(body.secure),
      username: String(body.username || "").trim(),
      password: String(body.password || ""),
      fromEmail: String(body.fromEmail || "").trim(),
      fromName: String(body.fromName || "").trim() || null,
      enabled: body.enabled !== false,
      isDefault: Boolean(body.isDefault),
      deliveryMode: body.deliveryMode === "smtp" ? "smtp" : "platform",
      resendApiKey:
        typeof body.resendApiKey === "string" ? body.resendApiKey.trim() : undefined,
      sendWeight: typeof body.sendWeight === "number" ? body.sendWeight : undefined,
    });
    return NextResponse.json({ ok: true, account: maskSmtpAccount(row) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update SMTP" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const row = await prisma.smtpAccount.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.smtpAccount.delete({ where: { id } });
  await ensureSingleDefault(user.id);
  const rows = await listSmtpAccounts(user.id);
  return NextResponse.json({ ok: true, accounts: rows.map(maskSmtpAccount) });
}
