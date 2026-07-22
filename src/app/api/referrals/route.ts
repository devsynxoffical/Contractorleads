import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ensureReferralCode, getReferralStats } from "@/lib/referrals";
import { appBaseUrl } from "@/lib/email-brand";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getReferralStats(user.id);
  const base = appBaseUrl().replace(/\/$/, "");
  const shareUrl = `${base}/ref/${stats.code}`;

  return NextResponse.json({
    ...stats,
    shareUrl,
  });
}

/** Ensure code exists (idempotent). */
export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const code = await ensureReferralCode(user.id);
  return NextResponse.json({ code });
}
