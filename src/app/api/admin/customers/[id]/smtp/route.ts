import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSingleDefault, maskSmtpAccount } from "@/lib/user-smtp";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, companyName: true },
  });
  if (!user) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const [userAccounts, systemAccounts] = await Promise.all([
    prisma.smtpAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.systemSmtpAccount.findMany({
      where: { enabled: true },
      orderBy: [{ domain: "asc" }, { fromName: "asc" }],
    }),
  ]);

  return NextResponse.json({
    userAccounts: userAccounts.map(maskSmtpAccount),
    systemAccounts: systemAccounts.map((s) => ({
      id: s.id,
      label: `${s.fromName || s.fromEmail} (${s.domain})`,
      domain: s.domain,
      fromEmail: s.fromEmail,
      fromName: s.fromName,
      host: s.host,
      port: s.port,
      secure: s.secure,
      sendWeight: s.sendWeight,
      lastTestedAt: s.lastTestedAt,
    })),
  });
}

export async function POST(request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const systemSmtpAccountId = String(body.systemSmtpAccountId || "").trim();
  const assignAll = Boolean(body.all);
  const isDefault = Boolean(body.isDefault);

  if (assignAll) {
    const sysAccounts = await prisma.systemSmtpAccount.findMany({
      where: { enabled: true },
    });
    if (!sysAccounts.length) {
      return NextResponse.json({ error: "No enabled system SMTP accounts found" }, { status: 400 });
    }

    let createdCount = 0;
    for (const sys of sysAccounts) {
      const existing = await prisma.smtpAccount.findFirst({
        where: { userId, fromEmail: sys.fromEmail },
      });
      if (existing) {
        await prisma.smtpAccount.update({
          where: { id: existing.id },
          data: {
            host: sys.host,
            port: sys.port,
            secure: sys.secure,
            username: sys.username,
            passwordEnc: sys.passwordEnc,
            fromName: sys.fromName,
            enabled: true,
            deliveryMode: "smtp",
            sendWeight: sys.sendWeight,
          },
        });
      } else {
        await prisma.smtpAccount.create({
          data: {
            userId,
            label: `Hostinger (${sys.domain}) - ${sys.fromName || sys.fromEmail}`,
            host: sys.host,
            port: sys.port,
            secure: sys.secure,
            username: sys.username,
            passwordEnc: sys.passwordEnc,
            fromEmail: sys.fromEmail,
            fromName: sys.fromName,
            deliveryMode: "smtp",
            sendWeight: sys.sendWeight,
            enabled: true,
            isDefault: createdCount === 0 && !existing,
          },
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Assigned ${sysAccounts.length} Hostinger mailboxes to customer.`,
    });
  }

  if (!systemSmtpAccountId) {
    return NextResponse.json({ error: "Select a Hostinger mailbox to assign" }, { status: 400 });
  }

  const sys = await prisma.systemSmtpAccount.findUnique({
    where: { id: systemSmtpAccountId },
  });
  if (!sys) {
    return NextResponse.json({ error: "Hostinger mailbox not found" }, { status: 404 });
  }

  const existing = await prisma.smtpAccount.findFirst({
    where: { userId, fromEmail: sys.fromEmail },
  });

  let targetId: string;
  if (existing) {
    const updated = await prisma.smtpAccount.update({
      where: { id: existing.id },
      data: {
        label: body.label || existing.label || `Hostinger (${sys.domain}) - ${sys.fromName || sys.fromEmail}`,
        host: sys.host,
        port: sys.port,
        secure: sys.secure,
        username: sys.username,
        passwordEnc: sys.passwordEnc,
        fromName: sys.fromName,
        deliveryMode: "smtp",
        sendWeight: sys.sendWeight,
        enabled: true,
        isDefault: isDefault ? true : existing.isDefault,
      },
    });
    targetId = updated.id;
  } else {
    const isFirst = (await prisma.smtpAccount.count({ where: { userId } })) === 0;
    const created = await prisma.smtpAccount.create({
      data: {
        userId,
        label: body.label || `Hostinger (${sys.domain}) - ${sys.fromName || sys.fromEmail}`,
        host: sys.host,
        port: sys.port,
        secure: sys.secure,
        username: sys.username,
        passwordEnc: sys.passwordEnc,
        fromEmail: sys.fromEmail,
        fromName: sys.fromName,
        deliveryMode: "smtp",
        sendWeight: sys.sendWeight,
        enabled: true,
        isDefault: isDefault || isFirst,
      },
    });
    targetId = created.id;
  }

  if (isDefault) {
    await ensureSingleDefault(userId, targetId);
  }

  return NextResponse.json({
    ok: true,
    message: `Successfully assigned ${sys.fromEmail} to customer.`,
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: userId } = await params;
  const url = new URL(request.url);
  const accountId = url.searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json({ error: "accountId query parameter is required" }, { status: 400 });
  }

  const existing = await prisma.smtpAccount.findFirst({
    where: { id: accountId, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await prisma.smtpAccount.delete({ where: { id: accountId } });
  return NextResponse.json({ ok: true, message: "Removed mailbox from customer" });
}
