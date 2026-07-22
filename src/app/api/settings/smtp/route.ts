import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createSmtpTransport,
  getUserSmtpConfig,
  listSmtpAccounts,
  maskSmtpAccount,
  migrateLegacySmtpIfNeeded,
  upsertSmtpAccount,
} from "@/lib/user-smtp";
import { prisma } from "@/lib/prisma";

/** Legacy single-SMTP API — reads/writes the default SmtpAccount. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await migrateLegacySmtpIfNeeded(user.id);
  const rows = await listSmtpAccounts(user.id);
  const def = rows.find((r) => r.isDefault) || rows[0];
  if (!def) return NextResponse.json({ settings: null, accounts: [] });

  return NextResponse.json({
    settings: maskSmtpAccount(def),
    accounts: rows.map(maskSmtpAccount),
  });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await migrateLegacySmtpIfNeeded(user.id);
  const rows = await listSmtpAccounts(user.id);
  const def = rows.find((r) => r.isDefault) || rows[0];

  try {
    const row = await upsertSmtpAccount({
      userId: user.id,
      id: def?.id,
      label: String(body.label || def?.label || "Primary"),
      host: String(body.host || "").trim(),
      port: Number(body.port || 587),
      secure: Boolean(body.secure),
      username: String(body.username || "").trim(),
      password: String(body.password || ""),
      fromEmail: String(body.fromEmail || "").trim(),
      fromName: String(body.fromName || "").trim() || null,
      enabled: body.enabled !== false,
      isDefault: true,
    });
    return NextResponse.json({
      ok: true,
      settings: maskSmtpAccount(row),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save SMTP" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body.action || "test";
  if (action !== "test") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const cfg = await getUserSmtpConfig(user.id, body.id ? String(body.id) : null);
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
    } else {
      await prisma.userSmtpSettings.update({
        where: { userId: user.id },
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
