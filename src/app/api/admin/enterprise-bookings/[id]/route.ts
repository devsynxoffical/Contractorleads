import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = new Set([
  "new",
  "confirmed",
  "contacted",
  "completed",
  "cancelled",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requirePermission("customers");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const data: { status?: string; adminNotes?: string | null } = {};
  if (typeof body.status === "string") {
    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.adminNotes !== undefined) {
    data.adminNotes =
      typeof body.adminNotes === "string" ? body.adminNotes.trim() || null : null;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const booking = await prisma.enterpriseBooking.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: booking.id,
      status: booking.status,
      adminNotes: booking.adminNotes,
    },
  });
}
