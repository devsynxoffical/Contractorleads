import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adjustCredits, logActivity } from "@/lib/credits";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const admin = await requirePermission("customers");
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

  try {
    const creditsRemaining = await adjustCredits(
      id,
      amount,
      reason,
      `admin:${admin.id}`,
    );

    await logActivity(
      admin.id,
      "admin_credits",
      `Adjusted credits for ${user.email} by ${amount}`,
      { targetUserId: id, amount, reason, creditsRemaining },
    );

    return NextResponse.json({ creditsRemaining });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Credit update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
