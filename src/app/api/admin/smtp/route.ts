import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto-secret";
import {
  HOSTINGER_DEFAULT_MAILBOXES,
  listSystemSmtpAccounts,
  maskSystemSmtpAccount,
  seedHostingerMailboxes,
  testSystemSmtpAccount,
} from "@/lib/system-smtp";

export async function GET() {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listSystemSmtpAccounts();
  const masked = rows.map(maskSystemSmtpAccount);

  const domains = Array.from(new Set(rows.map((r) => r.domain || "other"))).filter(
    Boolean,
  );

  const totalSent = rows.reduce((sum, r) => sum + (r._count?.emails ?? 0), 0);
  const activeCount = rows.filter((r) => r.enabled).length;

  return NextResponse.json({
    ok: true,
    total: rows.length,
    active: activeCount,
    totalSent,
    domains,
    accounts: masked,
    provider: "Hostinger SMTP (smtp.hostinger.com:465 SSL)",
  });
}

export async function POST(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "save");

  // 1. Re-seed all 25 Hostinger mailboxes
  if (action === "seed" || action === "reset_default") {
    const result = await seedHostingerMailboxes(true);
    const rows = await listSystemSmtpAccounts();
    return NextResponse.json({
      ok: true,
      message: `Successfully synced ${result.total} Hostinger mailboxes across 5 domains.`,
      result,
      accounts: rows.map(maskSystemSmtpAccount),
    });
  }

  // 2. Test mailbox connection
  if (action === "test") {
    if (body.testAll) {
      const rows = await listSystemSmtpAccounts({ onlyEnabled: true });
      const results: Array<{ id: string; email: string; ok: boolean; message: string }> = [];

      for (const row of rows) {
        try {
          const res = await testSystemSmtpAccount(row.id);
          results.push({ id: row.id, email: row.fromEmail, ok: res.ok, message: res.message });
        } catch (e) {
          results.push({
            id: row.id,
            email: row.fromEmail,
            ok: false,
            message: e instanceof Error ? e.message : "Test failed",
          });
        }
      }

      const passed = results.filter((r) => r.ok).length;
      return NextResponse.json({
        ok: true,
        message: `Tested ${results.length} mailboxes (${passed} passed, ${results.length - passed} failed)`,
        results,
      });
    }

    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "Mailbox ID required" }, { status: 400 });

    try {
      const res = await testSystemSmtpAccount(id);
      return NextResponse.json({ ok: res.ok, message: res.message });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Test failed" },
        { status: 400 },
      );
    }
  }

  // 3. Toggle enabled state
  if (action === "toggle") {
    const id = String(body.id || "");
    const enabled = Boolean(body.enabled);
    if (!id) return NextResponse.json({ error: "Mailbox ID required" }, { status: 400 });

    const updated = await prisma.systemSmtpAccount.update({
      where: { id },
      data: { enabled },
      include: { _count: { select: { emails: true } } },
    });

    return NextResponse.json({
      ok: true,
      account: maskSystemSmtpAccount(updated),
    });
  }

  // 4. Create or update mailbox
  const id = body.id ? String(body.id) : undefined;
  const fromEmail = String(body.fromEmail || "").toLowerCase().trim();
  const fromName = body.fromName ? String(body.fromName).trim() : null;
  const domain = body.domain
    ? String(body.domain).toLowerCase().trim()
    : fromEmail.split("@")[1] || "roofingagency.us";
  const label = body.label
    ? String(body.label).trim()
    : `${fromName || fromEmail} (${domain})`;
  const host = String(body.host || "smtp.hostinger.com").trim();
  const port = Number(body.port) || 465;
  const secure = body.secure !== false;
  const username = String(body.username || fromEmail).trim();
  const password = typeof body.password === "string" ? body.password.trim() : "";
  const sendWeight = Number(body.sendWeight) || 1;
  const enabled = body.enabled !== false;

  if (!fromEmail || !fromEmail.includes("@")) {
    return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
  }

  if (id) {
    const existing = await prisma.systemSmtpAccount.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const data: Record<string, unknown> = {
      label,
      domain,
      host,
      port,
      secure,
      username,
      fromEmail,
      fromName,
      sendWeight,
      enabled,
    };
    if (password) {
      data.passwordEnc = encryptSecret(password);
    }

    const updated = await prisma.systemSmtpAccount.update({
      where: { id },
      data,
      include: { _count: { select: { emails: true } } },
    });

    return NextResponse.json({ ok: true, account: maskSystemSmtpAccount(updated) });
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required for new mailbox" }, { status: 400 });
  }

  const created = await prisma.systemSmtpAccount.create({
    data: {
      label,
      domain,
      host,
      port,
      secure,
      username,
      passwordEnc: encryptSecret(password),
      fromEmail,
      fromName,
      sendWeight,
      enabled,
    },
    include: { _count: { select: { emails: true } } },
  });

  return NextResponse.json({ ok: true, account: maskSystemSmtpAccount(created) });
}

export async function DELETE(request: Request) {
  const admin = await requirePermission("system");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  await prisma.systemSmtpAccount.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
