import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markCheckoutDismissed } from "@/lib/checkout-recovery";

/**
 * The user closed the payment modal without paying. Marks their
 * CheckoutAttempt as "abandoned" so the recovery sequence has the context.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { orderId?: unknown };
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId || orderId.length > 128) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const attempt = await prisma.checkoutAttempt.findUnique({
    where: { orderId },
    select: { id: true, userId: true },
  });
  if (!attempt || attempt.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await markCheckoutDismissed(orderId);
  return NextResponse.json({ ok: true, updated });
}
