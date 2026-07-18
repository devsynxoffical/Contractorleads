import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";

export async function DELETE(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const leadIds: string[] = Array.isArray(body.leadIds)
    ? body.leadIds.filter((id: unknown) => typeof id === "string")
    : [];

  if (!leadIds.length) {
    return NextResponse.json({ error: "leadIds required" }, { status: 400 });
  }

  const result = await prisma.lead.deleteMany({
    where: { id: { in: leadIds } },
  });

  await logActivity(
    admin.id,
    "admin_bulk_delete_leads",
    `Bulk deleted ${result.count} leads`,
    { count: result.count },
  );

  return NextResponse.json({ deleted: result.count });
}
