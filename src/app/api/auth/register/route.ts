import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { businessEmailError } from "@/lib/business-email";
import { sendEmail, verificationEmailHtml } from "@/lib/email";
import { captureMarketingEmail } from "@/lib/marketing-session";

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
    const { name, email, phone } = await request.json();
    const normalizedEmail = String(email ?? "")
      .trim()
      .toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    const displayName = name ? String(name).trim() : null;

    const emailErr = businessEmailError(normalizedEmail);
    if (emailErr) {
      return NextResponse.json({ error: emailErr }, { status: 400 });
    }

    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: "A valid phone number is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered. Please log in." },
        { status: 409 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail },
    });
    await prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        phone: normalizedPhone,
        name: displayName,
        token,
        expiresAt,
      },
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
      /\/$/,
      ""
    );
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    const sent = await sendEmail({
      to: normalizedEmail,
      subject: "Verify your Contractor Leads business email",
      html: verificationEmailHtml(verifyUrl, displayName),
      text: `Verify your email: ${verifyUrl}`,
    });

    if (!sent.ok) {
      return NextResponse.json(
        { error: sent.error || "Could not send verification email" },
        { status: 502 }
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

    return NextResponse.json({
      ok: true,
      message:
        "Check your business email for a verification link. After verifying, you will set your password.",
      mocked: sent.mocked ?? false,
      ...(sent.mocked ? { verifyUrl } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
