import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const chat = await prisma.aiConversation.findFirst({
    where: { id, userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!chat) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    chat: {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: chat.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        text: m.content,
        createdAt: m.createdAt,
      })),
    },
  });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const title =
    typeof body.title === "string" ? body.title.trim().slice(0, 80) : "";

  if (!title) {
    return Response.json({ error: "Title required" }, { status: 400 });
  }

  const existing = await prisma.aiConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const chat = await prisma.aiConversation.update({
    where: { id },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  });

  return Response.json({ chat });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.aiConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.aiConversation.delete({ where: { id } });
  return Response.json({ ok: true });
}
