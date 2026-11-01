import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { findAccessibleLead } from "@/lib/lead-ownership";
import {
  verifyEmailAddress,
  buildColdEmailStrategy,
  type EmailCategoryStatus,
  type EmailBounceRisk,
} from "@/lib/email-verifier";
import {
  ensureEmailVerificationColumns,
  isVerificationFresh,
  saveLeadEmailVerification,
} from "@/lib/email-verifier-db";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

/**
 * POST /api/leads/[id]/verify-email
 * Section 07 & 10: Single lead email verification with 30-day cache & rate limiting.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 300 single verifications per hour per user
  const rl = rateLimit(`verify-email:${user.id}`, {
    limit: 300,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Rate limit reached. Please wait ${rl.retryAfterSeconds}s before verifying more emails.`,
      },
      { status: 429 },
    );
  }

  await ensureEmailVerificationColumns();

  const { id } = await params;
  const lead = await findAccessibleLead(user, id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    force?: boolean;
    skipSmtp?: boolean;
  };
  const force = Boolean(body.force);
  const targetEmail = (lead.decisionMakerEmail || lead.email || "").trim();

  if (!targetEmail || !targetEmail.includes("@")) {
    return NextResponse.json(
      { error: "This lead does not have an email address to verify." },
      { status: 400 },
    );
  }

  // Section 08 & 10: 30-day cache check — don't re-verify if verified < 30 days ago unless force=true
  if (!force && isVerificationFresh(lead.emailVerifiedAt, lead.emailStatus)) {
    const cachedCat = (lead.emailStatus || "unknown") as EmailCategoryStatus;
    const prefix = targetEmail.split("@")[0] || "";
    const cachedScore =
      typeof lead.emailScore === "number" ? Math.round(lead.emailScore * 100) : 85;
    return NextResponse.json({
      ok: true,
      cached: true,
      lead,
      verification: {
        email: targetEmail,
        normalizedEmail: targetEmail.toLowerCase(),
        emailStatus: cachedCat,
        emailSubStatus: lead.emailSubStatus ?? "cached",
        emailBounceRisk: (lead.emailBounceRisk ?? "low") as EmailBounceRisk,
        isRoleAccount: Boolean(lead.isRoleAccount),
        emailVerifySource: lead.emailVerifySource ?? "cache",
        emailScore: lead.emailScore ?? 0.85,
        emailVerifiedAt:
          lead.emailVerifiedAt instanceof Date
            ? lead.emailVerifiedAt.toISOString()
            : String(lead.emailVerifiedAt),
        score: cachedScore,
        verdict: `Cached verification (< 30 days old): ${cachedCat.toUpperCase()}`,
        strategy: buildColdEmailStrategy(cachedCat, prefix),
      },
    });
  }

  const result = await verifyEmailAddress(targetEmail, {
    skipSmtp: Boolean(body.skipSmtp),
  });

  const updatedLead = await saveLeadEmailVerification(lead.id, result);

  return NextResponse.json({
    ok: true,
    cached: false,
    lead: updatedLead,
    verification: result,
  });
}

