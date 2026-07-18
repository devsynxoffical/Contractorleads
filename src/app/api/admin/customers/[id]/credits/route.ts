import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const amount = Number(body.amount);
  const reason =
    typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "admin_adjustment";

  if (!Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const next = Math.max(0, user.creditsRemaining + amount);
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id },
      data: { creditsRemaining: next },
    });
    await tx.creditLedger.create({
      data: {
        userId: id,
        amount,
        action: reason,
        reference: `admin:${admin.id}`,
      },
    });
    return u;
  });

  await logActivity(
    admin.id,
    "admin_credits",
    `Adjusted credits for ${user.email} by ${amount}`,
    { targetUserId: id, amount, reason },
  );

  return NextResponse.json({
    creditsRemaining: updated.creditsRemaining,
  });
}
