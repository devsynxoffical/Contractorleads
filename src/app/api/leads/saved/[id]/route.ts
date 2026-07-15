import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const saved = await prisma.savedLead.findFirst({
    where: { id, userId: user.id },
  });

  if (!saved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.savedLead.update({
    where: { id },
    data: {
      status: body.status ?? saved.status,
      favorite: body.favorite ?? saved.favorite,
    },
    include: { lead: true, notes: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json({ saved: updated });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Note content required" }, { status: 400 });
  }

  const saved = await prisma.savedLead.findFirst({
    where: { id, userId: user.id },
  });

  if (!saved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const note = await prisma.leadNote.create({
    data: { savedLeadId: id, content: content.trim() },
  });

  return NextResponse.json({ note });
}
