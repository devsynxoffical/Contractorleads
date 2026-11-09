import { prisma } from "@/lib/prisma";
import { FREE_EMAIL_PROVIDERS, verifyEmailAddress } from "@/lib/email-verifier";
import type { EmailStatus, FoundEmail, NormalizedInput } from "./types";

/**
 * Acceptance policy for candidate emails (blueprint p.5):
 * - The address must belong to the company (same registrable domain), except a free-mail
 *   address the business itself publishes on its website.
 * - Role addresses (info@, office@ ...) stay separate from direct owner contacts.
 * - Valid = accept. Catch-all / unknown = keep for review and keep looking. Invalid = reject.
 * - A provider's own documented "verified" status is reused; otherwise the platform
 *   verifier runs, cached per workspace for 7 days so the same address is not paid twice.
 */

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/;

const ROLE_LOCAL_PARTS = new Set([
  "info", "office", "contact", "contactus", "sales", "service", "services", "support", "admin",
  "hello", "team", "help", "billing", "accounts", "accounting", "estimates", "estimate", "quotes",
  "quote", "jobs", "careers", "hr", "marketing", "booking", "bookings", "schedule", "scheduling",
  "dispatch", "customerservice", "mail", "email", "enquiries", "inquiries", "inquiry", "webmaster",
  "noreply", "no-reply", "reception", "frontdesk", "orders", "projects", "warranty",
]);

export const VERIFY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type EmailDecision = {
  decision: "accept" | "review" | "reject";
  status: EmailStatus;
  verifiedBy: string | null;
  reason: string;
  value: string;
};

function sameCompanyDomain(emailDomain: string, companyDomain: string): boolean {
  return (
    emailDomain === companyDomain ||
    emailDomain.endsWith(`.${companyDomain}`) ||
    companyDomain.endsWith(`.${emailDomain}`)
  );
}

export function isRoleAddress(email: string): boolean {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  return ROLE_LOCAL_PARTS.has(local.replace(/[0-9]+$/, ""));
}

/** Platform verifier with a per-workspace 7-day cache. */
async function verifyCached(userId: string, email: string): Promise<{ status: EmailStatus; source: string }> {
  const cacheKey = `verify:${email}`;
  const hit = await prisma.enrichmentCache
    .findUnique({ where: { userId_cacheKey: { userId, cacheKey } } })
    .catch(() => null);
  if (hit && hit.expiresAt > new Date() && hit.resultJson) {
    try {
      return JSON.parse(hit.resultJson) as { status: EmailStatus; source: string };
    } catch {
      /* fall through and re-verify */
    }
  }
  const r = await verifyEmailAddress(email);
  const status: EmailStatus =
    r.emailStatus === "safe"
      ? "valid"
      : r.emailStatus === "catchall"
        ? "catch_all"
        : r.emailStatus === "role"
          ? "role"
          : r.emailStatus === "invalid"
            ? "invalid"
            : "unknown";
  const value = { status, source: r.emailVerifySource || "platform_verifier" };
  await prisma.enrichmentCache
    .upsert({
      where: { userId_cacheKey: { userId, cacheKey } },
      update: { resultJson: JSON.stringify(value), expiresAt: new Date(Date.now() + VERIFY_TTL_MS), kind: "positive" },
      create: {
        userId,
        cacheKey,
        provider: "verifier",
        target: "verify",
        kind: "positive",
        resultJson: JSON.stringify(value),
        expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
      },
    })
    .catch(() => null);
  return value;
}

export async function evaluateEmail(
  candidate: FoundEmail,
  input: NormalizedInput,
  opts: { userId: string; fromBusinessWebsite: boolean; verify?: typeof verifyCached },
): Promise<EmailDecision> {
  const value = candidate.value.trim().toLowerCase();
  const reject = (reason: string, status: EmailStatus = "invalid"): EmailDecision => ({
    decision: "reject",
    status,
    verifiedBy: null,
    reason,
    value,
  });

  if (!EMAIL_RE.test(value) || value.includes("*")) return reject("not a usable email address");
  const emailDomain = value.split("@")[1];

  // Identity: the address must belong to this company.
  if (FREE_EMAIL_PROVIDERS.has(emailDomain)) {
    if (!opts.fromBusinessWebsite) return reject("personal free-mail address from a finder, not a work email");
  } else if (input.domain && !sameCompanyDomain(emailDomain, input.domain)) {
    return reject(`address is at ${emailDomain}, not the company domain ${input.domain}`);
  }

  if (isRoleAddress(value)) {
    return { decision: "reject", status: "role", verifiedBy: null, reason: "role address, kept separate from owner contacts", value };
  }

  // Verification: reuse a definitive provider status, otherwise verify (cached).
  if (candidate.providerVerified && !candidate.catchAll) {
    return { decision: "accept", status: "valid", verifiedBy: `provider:${candidate.providerStatus ?? "verified"}`, reason: "verified by provider", value };
  }
  const v = await (opts.verify ?? verifyCached)(opts.userId, value);
  const status: EmailStatus = candidate.catchAll && v.status === "valid" ? "catch_all" : v.status;
  if (status === "valid") return { decision: "accept", status, verifiedBy: v.source, reason: "verified", value };
  if (status === "catch_all" || status === "unknown") {
    return { decision: "review", status, verifiedBy: v.source, reason: `${status === "catch_all" ? "catch-all domain" : "could not confirm"}; kept for review`, value };
  }
  if (status === "role") return { decision: "reject", status, verifiedBy: v.source, reason: "role address", value };
  return { decision: "reject", status: "invalid", verifiedBy: v.source, reason: "verifier says invalid", value };
}

/**
 * Phone acceptance: 10-15 digits. Converted to E.164 only where that is unambiguous
 * (US/Canada numbers, or numbers already written with a leading +); otherwise the
 * original formatting is kept rather than guessing a country code.
 */
export function normalizePhone(raw: string | null | undefined, country = "US"): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  if (trimmed.startsWith("+")) return `+${digits}`;
  const nanp = country === "US" || country === "CA";
  if (nanp && digits.length === 10) return `+1${digits}`;
  if (nanp && digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return trimmed;
}
