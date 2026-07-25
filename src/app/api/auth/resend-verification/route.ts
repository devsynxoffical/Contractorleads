import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { appBaseUrl } from "@/lib/email-brand";
import { guardAuthRoute } from "@/lib/rate-limit";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/token-hash";

/**
 * Resend a signup verification email for a pending (not-yet-completed) signup.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { blocked } = guardAuthRoute(request, "resend-verification", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      identifier: email,
    });
    if (blocked) return blocked;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({
        ok: true,
        message:
          "If that email still needs verification, we sent a new link. Otherwise sign in or use Forgot password.",
      });
    }

    const pending = await prisma.emailVerification.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!pending) {
      return NextResponse.json({
        ok: true,
        message:
          "If that email still needs verification, we sent a new link. Otherwise start signup again from Register.",
      });
    }

    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerification.update({
      where: { id: pending.id },
      data: { token: hashOpaqueToken(token), expiresAt },
    });

    const verifyUrl = `${appBaseUrl()}/verify-email?token=${token}`;
    const sent = await sendVerificationEmail({
      to: pending.email,
      verifyUrl,
      name: pending.name,
    });
    if (!sent.ok) {
      console.error("[resend-verification] email failed", sent.error);
      return NextResponse.json(
        {
          error:
            "We could not send the verification email right now. Please try again in a few minutes.",
        },
        { status: 502 },
      );
    }

    const mocked = "mocked" in sent ? Boolean(sent.mocked) : false;
    const exposeVerifyUrl = mocked && process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      message: "A new verification link is on its way to your inbox.",
      ...(exposeVerifyUrl ? { verifyUrl } : {}),
    });
  } catch (err) {
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: "Could not resend verification email" },
      { status: 500 },
    );
  }
}
