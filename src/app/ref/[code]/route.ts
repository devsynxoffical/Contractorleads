import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/email-brand";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  findReferrerByCode,
} from "@/lib/referrals";

/**
 * /ref/[code] — set attribution cookie and send visitor to register.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = String(code ?? "").trim();
  const appUrl = appBaseUrl();

  const referrer = normalized ? await findReferrerByCode(normalized) : null;
  const registerUrl = new URL(`${appUrl}/register`);
  if (referrer?.referralCode) {
    registerUrl.searchParams.set("ref", referrer.referralCode);
  }

  const res = NextResponse.redirect(registerUrl.toString());
  if (referrer?.referralCode) {
    res.cookies.set(REFERRAL_COOKIE, referrer.referralCode, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: "/",
    });
  }

  return res;
}
