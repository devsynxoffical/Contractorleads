import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
  };

  const existing = await prisma.script.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  const data: { title?: string | null; content?: string } = {};
  if (typeof body.title === "string") {
    data.title = body.title.trim() || null;
  }
  if (typeof body.content === "string") {
    const content = body.content.trim();
    if (!content) {
      return NextResponse.json(
        { error: "Script content cannot be empty" },
        { status: 400 },
      );
    }
    data.content = content;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const script = await prisma.script.update({
    where: { id },
    data,
  });

  return NextResponse.json({ script });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.script.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
