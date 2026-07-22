import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { linkMarketingVisitorToUser } from "@/lib/marketing-session";
import { sendWelcomeEmail } from "@/lib/email";
import {
  applyReferralOnSignup,
  ensureReferralCode,
} from "@/lib/referrals";

/**
 * Step 2: after email verification link — create account with password and log in.
 */
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    const tokenStr = String(token ?? "").trim();
    const passwordStr = String(password ?? "");

    if (!tokenStr) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 },
      );
    }
    if (passwordStr.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const pending = await prisma.emailVerification.findUnique({
      where: { token: tokenStr },
    });
    if (!pending || pending.expiresAt < new Date()) {
      return NextResponse.json(
        {
          error:
            "Verification link expired or invalid. Please sign up again.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: pending.email },
    });
    if (existing) {
      await prisma.emailVerification.delete({ where: { id: pending.id } });
      return NextResponse.json(
        { error: "Email already registered. Please log in." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email: pending.email,
        phone: pending.phone,
        name: pending.name,
        passwordHash: await hashPassword(passwordStr),
        emailVerifiedAt: new Date(),
        creditsRemaining: 20,
      },
    });

    await ensureReferralCode(user.id);

    try {
      await applyReferralOnSignup({
        newUserId: user.id,
        referralCode: pending.referralCode,
      });
    } catch (err) {
      console.error("[referral] apply failed", err);
    }

    await prisma.emailVerification.delete({ where: { id: pending.id } });

    const session = await createSessionToken(user.id);
    await setSessionCookie(session);
    try {
      await linkMarketingVisitorToUser(user.id, user.email);
    } catch {
      /* non-blocking */
    }

    void sendWelcomeEmail({
      userId: user.id,
      to: user.email,
      name: user.name,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: "/auth/splash",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not complete registration" },
      { status: 500 },
    );
  }
}
