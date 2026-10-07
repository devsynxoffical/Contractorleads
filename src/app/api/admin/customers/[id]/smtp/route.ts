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
    systemAccounts: systemAccounts.map((s) => {
      const isGoDaddy =
        s.provider === "godaddy" ||
        s.domain.includes("frankmiller") ||
        s.domain === "meetfrankmiller.com" ||
        s.domain === "connectwithbdefrank.com";
      const provider = isGoDaddy ? "godaddy" : "hostinger";
      return {
        id: s.id,
        label: `${s.fromName || s.fromEmail} (${s.domain})`,
        domain: s.domain,
        provider,
        fromEmail: s.fromEmail,
        fromName: s.fromName,
        host: s.host,
        port: s.port,
        secure: s.secure,
        sendWeight: s.sendWeight,
        lastTestedAt: s.lastTestedAt,
      };
    }),
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
  const targetProvider = body.provider as "hostinger" | "godaddy" | "all" | undefined;
  const isDefault = Boolean(body.isDefault);

  if (assignAll || targetProvider) {
    let whereClause: Record<string, unknown> = { enabled: true };
    if (targetProvider === "godaddy") {
      whereClause = {
        enabled: true,
        OR: [
          { provider: "godaddy" },
          { domain: { contains: "frankmiller" } },
          { domain: { in: ["meetfrankmiller.com", "connectwithbdefrank.com"] } },
        ],
      };
    } else if (targetProvider === "hostinger") {
      whereClause = {
        enabled: true,
        provider: "hostinger",
        NOT: [
          { domain: { contains: "frankmiller" } },
          { domain: { in: ["meetfrankmiller.com", "connectwithbdefrank.com"] } },
        ],
      };
    }

    const sysAccounts = await prisma.systemSmtpAccount.findMany({
      where: whereClause,
      orderBy: [{ domain: "asc" }, { fromName: "asc" }],
    });
    if (!sysAccounts.length) {
      return NextResponse.json({ error: "No enabled system SMTP accounts found for this provider" }, { status: 400 });
    }

    let createdCount = 0;
    for (const sys of sysAccounts) {
      const isGoDaddy =
        sys.provider === "godaddy" ||
        sys.domain.includes("frankmiller") ||
        sys.domain === "meetfrankmiller.com" ||
        sys.domain === "connectwithbdefrank.com";
      const provName = isGoDaddy ? "GoDaddy" : "Hostinger";
      const customLabel = `${provName} (${sys.domain}) - ${sys.fromName || sys.fromEmail}`;

      const existing = await prisma.smtpAccount.findFirst({
        where: { userId, fromEmail: sys.fromEmail },
      });
      if (existing) {
        await prisma.smtpAccount.update({
          where: { id: existing.id },
          data: {
            label: customLabel,
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
            label: customLabel,
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

    const providerTitle =
      targetProvider === "godaddy"
        ? "GoDaddy"
        : targetProvider === "hostinger"
          ? "Hostinger"
          : "System";

    return NextResponse.json({
      ok: true,
      message: `Assigned all ${sysAccounts.length} ${providerTitle} mailboxes to customer.`,
    });
  }

  if (!systemSmtpAccountId) {
    return NextResponse.json({ error: "Select a mailbox to assign" }, { status: 400 });
  }

  const sys = await prisma.systemSmtpAccount.findUnique({
    where: { id: systemSmtpAccountId },
  });
  if (!sys) {
    return NextResponse.json({ error: "System mailbox not found" }, { status: 404 });
  }

  const isGoDaddy =
    sys.provider === "godaddy" ||
    sys.domain.includes("frankmiller") ||
    sys.domain === "meetfrankmiller.com" ||
    sys.domain === "connectwithbdefrank.com";
  const provName = isGoDaddy ? "GoDaddy" : "Hostinger";
  const defaultLabel = `${provName} (${sys.domain}) - ${sys.fromName || sys.fromEmail}`;

  const existing = await prisma.smtpAccount.findFirst({
    where: { userId, fromEmail: sys.fromEmail },
  });

  let targetId: string;
  if (existing) {
    const updated = await prisma.smtpAccount.update({
      where: { id: existing.id },
      data: {
        label: body.label || defaultLabel,
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
        label: body.label || defaultLabel,
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
  const accountIdsParam = url.searchParams.get("accountIds");
  const provider = url.searchParams.get("provider");
  const deleteAll = url.searchParams.get("all") === "true";

  // Also support JSON body if sent
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    /* empty */
  }

  const targetDeleteAll = deleteAll || Boolean(body.all);
  const targetProvider = (provider || body.provider) as "hostinger" | "godaddy" | "all" | undefined;
  const targetAccountIds = Array.isArray(body.accountIds)
    ? (body.accountIds as string[])
    : accountIdsParam
      ? accountIdsParam.split(",").map((s) => s.trim()).filter(Boolean)
      : accountId
        ? [accountId]
        : (body.accountId ? [String(body.accountId)] : []);

  // Mode 1: Delete all assigned mailboxes
  if (targetDeleteAll || targetProvider === "all") {
    const deleted = await prisma.smtpAccount.deleteMany({
      where: { userId },
    });
    return NextResponse.json({
      ok: true,
      message: `Removed all ${deleted.count} mailboxes from customer.`,
      deletedCount: deleted.count,
    });
  }

  // Mode 2: Delete by provider (hostinger vs godaddy)
  if (targetProvider === "godaddy") {
    const deleted = await prisma.smtpAccount.deleteMany({
      where: {
        userId,
        OR: [
          { label: { contains: "godaddy", mode: "insensitive" } },
          { fromEmail: { contains: "frankmiller" } },
          { fromEmail: { contains: "meetfrankmiller" } },
          { fromEmail: { contains: "connectwithbdefrank" } },
        ],
      },
    });
    return NextResponse.json({
      ok: true,
      message: `Removed ${deleted.count} GoDaddy mailboxes from customer.`,
      deletedCount: deleted.count,
    });
  }

  if (targetProvider === "hostinger") {
    const deleted = await prisma.smtpAccount.deleteMany({
      where: {
        userId,
        NOT: [
          { label: { contains: "godaddy", mode: "insensitive" } },
          { fromEmail: { contains: "frankmiller" } },
          { fromEmail: { contains: "meetfrankmiller" } },
          { fromEmail: { contains: "connectwithbdefrank" } },
        ],
      },
    });
    return NextResponse.json({
      ok: true,
      message: `Removed ${deleted.count} Hostinger mailboxes from customer.`,
      deletedCount: deleted.count,
    });
  }

  // Mode 3: Delete specific account IDs
  if (targetAccountIds.length > 0) {
    const deleted = await prisma.smtpAccount.deleteMany({
      where: {
        userId,
        id: { in: targetAccountIds },
      },
    });
    return NextResponse.json({
      ok: true,
      message: `Removed ${deleted.count} mailbox${deleted.count === 1 ? "" : "es"} from customer.`,
      deletedCount: deleted.count,
    });
  }

  return NextResponse.json(
    { error: "Specify accountId, accountIds, provider, or all=true to remove mailboxes" },
    { status: 400 },
  );
}
