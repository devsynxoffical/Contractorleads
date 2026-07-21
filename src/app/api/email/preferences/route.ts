import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyEmailActionToken } from "@/lib/email";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (token) {
    const verified = verifyEmailActionToken(token, "prefs");
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: { email: true, emailMarketingOptIn: true },
    });
    return NextResponse.json({
      email: user?.email,
      emailMarketingOptIn: user?.emailMarketingOptIn ?? true,
      viaToken: true,
    });
  }

  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { email: true, emailMarketingOptIn: true },
  });
  return NextResponse.json({
    email: user?.email,
    emailMarketingOptIn: user?.emailMarketingOptIn ?? true,
    viaToken: false,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const optIn = Boolean(body.emailMarketingOptIn);
  const token = String(body.token ?? "").trim();

  let userId: string | null = null;
  if (token) {
    const verified = verifyEmailActionToken(token, "prefs");
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }
    userId = verified.userId;
  } else {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.id;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailMarketingOptIn: optIn },
  });
  return NextResponse.json({ ok: true, emailMarketingOptIn: optIn });
}
