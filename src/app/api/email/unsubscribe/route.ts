import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailActionToken } from "@/lib/email";

/** One-click / link unsubscribe for product notification emails. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const verified = verifyEmailActionToken(token, "unsub");
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: verified.userId },
    data: { emailMarketingOptIn: false },
  });
  return NextResponse.json({
    ok: true,
    message: "You have been unsubscribed from product notification emails.",
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const verified = verifyEmailActionToken(token, "unsub");
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: verified.userId },
    data: { emailMarketingOptIn: false },
  });
  return NextResponse.json({ ok: true });
}
