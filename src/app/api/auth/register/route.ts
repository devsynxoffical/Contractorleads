import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { businessEmailError } from "@/lib/business-email";
import { sendVerificationEmail } from "@/lib/email";
import { captureMarketingEmail } from "@/lib/marketing-session";
import { appBaseUrl } from "@/lib/email-brand";
import { REFERRAL_COOKIE } from "@/lib/referrals";
import { guardAuthRoute } from "@/lib/rate-limit";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/token-hash";

function normalizePhone(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .replace(/[^\d+()\-\s]/g, "");
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Step 1: start signup — business email + phone, send verification link.
 * Password is set after the email is verified.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, referralCode: bodyRef } = body;
    const normalizedEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    const displayName = name ? String(name).trim() : null;

    const cookieStore = await cookies();
    const cookieRef = cookieStore.get(REFERRAL_COOKIE)?.value;
    const referralCode =
      String(bodyRef || cookieRef || "")
        .trim()
        .toLowerCase() || null;

    const emailErr = businessEmailError(normalizedEmail);
    if (emailErr) {
      return NextResponse.json({ error: emailErr }, { status: 400 });
    }

    const { blocked } = guardAuthRoute(request, "register", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
      identifier: normalizedEmail,
    });
    if (blocked) return blocked;

    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: "A valid phone number is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered. Please log in." },
        { status: 409 },
      );
    }

    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail },
    });
    await prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        phone: normalizedPhone,
        name: displayName,
        referralCode,
        token: hashOpaqueToken(token),
        expiresAt,
      },
    });

    const verifyUrl = `${appBaseUrl()}/verify-email?token=${token}`;

    const sent = await sendVerificationEmail({
      to: normalizedEmail,
      verifyUrl,
      name: displayName,
    });

    if (!sent.ok) {
      console.error("[register] verification email failed", sent.error);
      return NextResponse.json(
        {
          error:
            "We could not send the verification email. Check that transactional email is configured, then try again.",
        },
        { status: 502 },
      );
    }

    try {
      await captureMarketingEmail({
        email: normalizedEmail,
        emailOptIn: true,
        source: "register_start",
      });
    } catch {
      /* non-blocking */
    }

    const mocked = "mocked" in sent ? Boolean(sent.mocked) : false;
    // The verify link is a bearer credential — only surface it in local dev,
    // never in a production response body.
    const exposeVerifyUrl = mocked && process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      message:
        "Check your business email for a verification link. After verifying, you will set your password.",
      mocked,
      ...(exposeVerifyUrl ? { verifyUrl } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
