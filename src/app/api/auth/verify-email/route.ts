import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Validate token before showing set-password form. */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const pending = await prisma.emailVerification.findUnique({
    where: { token },
  });
  if (!pending || pending.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Verification link expired or invalid" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    email: pending.email,
    name: pending.name,
  });
}
