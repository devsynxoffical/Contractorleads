import { prisma } from "@/lib/prisma";
import type { EmailVerificationResult } from "@/lib/email-verifier";

let schemaEnsured = false;

/**
 * Ensures the Section 06 Email Verification columns and indexes exist on the "Lead" table.
 * Runs at most once per server process so unmigrated environments never throw P2022.
 */
export async function ensureEmailVerificationColumns(): Promise<void> {
  if (schemaEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Lead"
        ADD COLUMN IF NOT EXISTS "emailStatus"       VARCHAR(20) DEFAULT 'unknown',
        ADD COLUMN IF NOT EXISTS "emailVerifiedAt"   TIMESTAMP(3) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "emailBounceRisk"   VARCHAR(10) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "isRoleAccount"     BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "emailVerifySource" VARCHAR(50) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "emailScore"        DOUBLE PRECISION DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "emailSubStatus"    VARCHAR(50) DEFAULT NULL;
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Lead_emailStatus_idx" ON "Lead"("emailStatus");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Lead_emailVerifiedAt_idx" ON "Lead"("emailVerifiedAt");
    `);
    schemaEnsured = true;
  } catch {
    // Ignore if read-only replica or already exists
  }
}

/** 30-day cache window in milliseconds (Section 08 & 10) */
export const EMAIL_VERIFY_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isVerificationFresh(
  emailVerifiedAt: Date | string | null | undefined,
  emailStatus: string | null | undefined,
): boolean {
  if (!emailVerifiedAt || !emailStatus || emailStatus === "unknown") {
    return false;
  }
  const ts =
    typeof emailVerifiedAt === "string"
      ? new Date(emailVerifiedAt).getTime()
      : emailVerifiedAt.getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < EMAIL_VERIFY_CACHE_TTL_MS;
}

/**
 * Persist an EmailVerificationResult onto a Lead row in PostgreSQL.
 */
export async function saveLeadEmailVerification(
  leadId: string,
  result: EmailVerificationResult,
) {
  await ensureEmailVerificationColumns();

  const dmVerifyStatus =
    result.emailStatus === "safe"
      ? "verified"
      : result.emailStatus === "invalid"
        ? "invalid"
        : "risky";

  return prisma.lead.update({
    where: { id: leadId },
    data: {
      emailStatus: result.emailStatus,
      emailVerifiedAt: new Date(result.emailVerifiedAt),
      emailBounceRisk: result.emailBounceRisk,
      isRoleAccount: result.isRoleAccount,
      emailVerifySource: result.emailVerifySource,
      emailScore: result.emailScore,
      emailSubStatus: result.emailSubStatus,
      verificationStatus: result.emailStatus === "invalid" ? "invalid" : "verified",
      decisionMakerEmailVerification: dmVerifyStatus,
    },
  });
}

