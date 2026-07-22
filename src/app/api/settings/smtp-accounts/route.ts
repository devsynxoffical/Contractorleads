import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createSmtpTransport,
  ensureSingleDefault,
  getUserSmtpConfig,
  listSmtpAccounts,
  maskSmtpAccount,
  migrateLegacySmtpIfNeeded,
  upsertSmtpAccount,
} from "@/lib/user-smtp";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await migrateLegacySmtpIfNeeded(user.id);
  const rows = await listSmtpAccounts(user.id);
  return NextResponse.json({
    accounts: rows.map(maskSmtpAccount),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const action = String(body.action || "create");

  if (action === "test") {
    const accountId = body.id ? String(body.id) : null;
    const cfg = await getUserSmtpConfig(user.id, accountId);
    if (!cfg) {
      return NextResponse.json({ error: "Save SMTP settings first" }, { status: 400 });
    }
    try {
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
        { error: e instanceof Error ? e.message : "SMTP test failed" },
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
