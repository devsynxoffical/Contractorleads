import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGlobalSuperAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Warmup emails a mailbox sent to, and received from, the other pool mailboxes.
 *
 * GET /api/email-accounts/warmup-messages?mailbox=a@b.com&direction=all|sent|received&limit=50
 *
 * Only mailboxes the user owns (assigned system mailbox or own SMTP account) are readable;
 * super admins can read any mailbox.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mailbox = (searchParams.get("mailbox") || "").toLowerCase().trim();
  const direction = searchParams.get("direction") || "all";
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 50));

  if (!mailbox || !mailbox.includes("@")) {
    return NextResponse.json({ error: "mailbox is required" }, { status: 400 });
  }

  if (!isGlobalSuperAdmin(user)) {
    const [system, own] = await Promise.all([
      prisma.systemSmtpAccount.findFirst({
        where: { fromEmail: { equals: mailbox, mode: "insensitive" }, assignedUserId: user.id },
        select: { id: true },
      }),
      prisma.smtpAccount.findFirst({
        where: { fromEmail: { equals: mailbox, mode: "insensitive" }, userId: user.id },
        select: { id: true },
      }),
    ]);
    if (!system && !own) {
      return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
    }
  }

  const sentWhere = { fromEmail: { equals: mailbox, mode: "insensitive" as const } };
  const receivedWhere = { toEmail: { equals: mailbox, mode: "insensitive" as const } };
  const where =
    direction === "sent"
      ? sentWhere
      : direction === "received"
        ? receivedWhere
        : { OR: [sentWhere, receivedWhere] };

  const [messages, sentCount, receivedCount, repliedCount, spamCount] = await Promise.all([
    prisma.warmupMessage.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: limit,
    }),
    prisma.warmupMessage.count({ where: sentWhere }),
    prisma.warmupMessage.count({ where: receivedWhere }),
    prisma.warmupMessage.count({ where: { ...sentWhere, replied: true } }),
    prisma.warmupMessage.count({ where: { ...sentWhere, landed: "spam" } }),
  ]);

  return NextResponse.json({
    mailbox,
    counts: { sent: sentCount, received: receivedCount, replied: repliedCount, spam: spamCount },
    messages: messages.map((m) => ({
      id: m.id,
      direction: m.fromEmail.toLowerCase() === mailbox ? "sent" : "received",
      fromEmail: m.fromEmail,
      toEmail: m.toEmail,
      subject: m.subject,
      body: m.body,
      landed: m.landed,
      rescued: m.rescued,
      replied: m.replied,
      sentAt: m.sentAt.toISOString(),
    })),
  });
}
