import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/email-brand";

/**
 * Request a password reset email. Always returns ok to avoid email enumeration.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.isActive !== false) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });
      const resetUrl = `${appBaseUrl()}/reset-password?token=${token}`;
      void sendPasswordResetEmail({
        userId: user.id,
        to: user.email,
        resetUrl,
        name: user.name,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, we sent a password reset link.",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not process password reset" },
      { status: 500 },
    );
  }
}
