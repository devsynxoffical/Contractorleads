import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getThread } from "@/lib/unibox/queries";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Full conversation; opening it marks the thread read (pass ?peek=1 to keep it unread). */
export async function GET(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const peek = new URL(request.url).searchParams.get("peek") === "1";
  const data = await getThread(user.id, id, { markRead: !peek });
  if (!data) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  return NextResponse.json(data);
}

/** Update read / archive state or the follow-up date: { unread?, status?, followUpAt? } */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { unread?: unknown; status?: unknown; followUpAt?: unknown };
  const thread = await prisma.inboxThread.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  const data: { unread?: boolean; status?: string; followUpAt?: Date | null } = {};
  if (typeof body.unread === "boolean") data.unread = body.unread;
  if (body.status === "open" || body.status === "archived") data.status = body.status;
  if (body.followUpAt === null) data.followUpAt = null;
  else if (typeof body.followUpAt === "string" && !Number.isNaN(Date.parse(body.followUpAt))) data.followUpAt = new Date(body.followUpAt);
  if (!Object.keys(data).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  const updated = await prisma.inboxThread.update({ where: { id: thread.id }, data });
  return NextResponse.json({ ok: true, thread: { id: updated.id, unread: updated.unread, status: updated.status, followUpAt: updated.followUpAt } });
}
