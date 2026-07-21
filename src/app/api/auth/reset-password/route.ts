import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Validate reset token (GET) or set new password (POST). */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Reset link expired or invalid" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "").trim();
    const password = String(body.password ?? "");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const row = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Reset link expired or invalid" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: row.userId, usedAt: null, id: { not: row.id } },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Password updated. You can log in." });
  } catch {
    return NextResponse.json({ error: "Could not reset password" }, { status: 500 });
  }
}
