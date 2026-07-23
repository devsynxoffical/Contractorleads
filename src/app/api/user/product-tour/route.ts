import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const completed = body.completed !== false;
  const reset = body.reset === true;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      productTourCompleted: reset ? false : completed,
    },
    select: { productTourCompleted: true },
  });

  return NextResponse.json({
    ok: true,
    productTourCompleted: updated.productTourCompleted,
  });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { productTourCompleted: true, plan: true, subscriptionStatus: true },
  });

  return NextResponse.json({
    productTourCompleted: row?.productTourCompleted ?? false,
    plan: row?.plan,
    subscriptionStatus: row?.subscriptionStatus,
  });
}
