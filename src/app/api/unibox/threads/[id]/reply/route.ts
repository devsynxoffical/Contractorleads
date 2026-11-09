import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requireMessagingAddon } from "@/lib/messaging-addon-server";
import { prisma } from "@/lib/prisma";
import { replyToLeadEmail } from "@/lib/lead-email";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Reply from the Unibox. Answers the latest inbound message of the thread, from the
 * mailbox that received it (or a chosen one), threaded with In-Reply-To / References.
 */
export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const locked = await requireMessagingAddon(user);
  if (locked) return locked;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { body?: unknown; smtpAccountId?: unknown; mailbox_id?: unknown };
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Write a reply first" }, { status: 400 });

  const thread = await prisma.inboxThread.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  const latest = await prisma.leadEmail.findFirst({
    where: { userId: user.id, threadId: thread.id, direction: "inbound" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!latest) return NextResponse.json({ error: "No reply to answer in this thread" }, { status: 400 });

  try {
    const mailbox = typeof body.smtpAccountId === "string" ? body.smtpAccountId : typeof body.mailbox_id === "string" ? body.mailbox_id : null;
    const result = await replyToLeadEmail({ userId: user.id, emailId: latest.id, body: text, smtpAccountId: mailbox });
    const now = new Date();
    if (result.email?.id) {
      await prisma.leadEmail.update({ where: { id: result.email.id }, data: { threadId: thread.id } });
    }
    await prisma.inboxThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: now, messageCount: { increment: 1 }, unread: false },
    });
    return NextResponse.json({ message_id: result.email?.id ?? null, sent: true, timestamp: now.toISOString() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Reply failed" }, { status: 400 });
  }
}
