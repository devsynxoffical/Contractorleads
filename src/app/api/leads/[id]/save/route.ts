import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const saved = await prisma.savedLead.upsert({
    where: { userId_leadId: { userId: user.id, leadId: id } },
    create: { userId: user.id, leadId: id },
    update: {},
    include: { lead: true },
  });

  await logActivity(user.id, "save", `Saved ${saved.lead.businessName}`);

  return NextResponse.json({ saved });
}
