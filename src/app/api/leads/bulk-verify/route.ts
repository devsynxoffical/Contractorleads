import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  verifyEmailBatch,
  buildColdEmailStrategy,
  type EmailVerificationResult,
  type EmailCategoryStatus,
} from "@/lib/email-verifier";
import {
  ensureEmailVerificationColumns,
  isVerificationFresh,
} from "@/lib/email-verifier-db";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 300;

/**
 * GET /api/leads/bulk-verify
 * Section 10 Monitoring Dashboard: Returns % verified, % safe, % catchall, % role, % invalid over time.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureEmailVerificationColumns();

  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { search: { userId: user.id } },
        { savedBy: { some: { userId: user.id } } },
      ],
    },
    select: {
      id: true,
      email: true,
      decisionMakerEmail: true,
      emailStatus: true,
      emailVerifiedAt: true,
      emailBounceRisk: true,
      isRoleAccount: true,
      emailScore: true,
    },
    take: 5000,
  });

  const withEmail = leads.filter((l) =>
    Boolean((l.decisionMakerEmail || l.email)?.includes("@")),
  );

  let safe = 0;
  let catchall = 0;
  let role = 0;
  let invalid = 0;
  let unknown = 0;
  let staleCount = 0;

  for (const l of withEmail) {
    const st = (l.emailStatus || "unknown").toLowerCase();
    if (st === "safe") safe++;
    else if (st === "catchall") catchall++;
    else if (st === "role") role++;
    else if (st === "invalid") invalid++;
    else unknown++;

    if (
      l.emailVerifiedAt &&
      !isVerificationFresh(l.emailVerifiedAt, l.emailStatus)
    ) {
      staleCount++;
    }
  }

  const totalWithEmail = withEmail.length;
  const verifiedCount = safe + catchall + role + invalid;

  return NextResponse.json({
    ok: true,
    stats: {
      totalLeads: leads.length,
      totalWithEmail,
      verifiedCount,
      safe,
      catchall,
      role,
      invalid,
      unknown,
      staleCount,
      pctVerified:
        totalWithEmail > 0 ? Math.round((verifiedCount / totalWithEmail) * 100) : 0,
      pctSafe:
        verifiedCount > 0 ? Math.round((safe / verifiedCount) * 100) : 0,
      pctCatchall:
        verifiedCount > 0 ? Math.round((catchall / verifiedCount) * 100) : 0,
      pctRole:
        verifiedCount > 0 ? Math.round((role / verifiedCount) * 100) : 0,
      pctInvalid:
        verifiedCount > 0 ? Math.round((invalid / verifiedCount) * 100) : 0,
    },
  });
}

/**
 * POST /api/leads/bulk-verify
 * Section 07 & 10: Bulk email verification endpoint with 30-day cache & PostgreSQL persistence.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 bulk verification jobs per hour per user
  const rl = rateLimit(`bulk-verify:${user.id}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: `Bulk verification rate limit reached. Try again in ${rl.retryAfterSeconds}s.`,
      },
      { status: 429 },
    );
  }

  await ensureEmailVerificationColumns();

  const body = (await request.json().catch(() => ({}))) as {
    leadIds?: string[];
    emails?: string[];
    force?: boolean;
    skipSmtp?: boolean;
  };

  const force = Boolean(body.force);
  const skipSmtp = Boolean(body.skipSmtp);

  // Mode 1: Raw emails array (e.g. from datasheet or bulk verifier tool)
  if (Array.isArray(body.emails) && body.emails.length > 0 && !body.leadIds?.length) {
    const cleanEmails = body.emails
      .map((e) => String(e || "").trim())
      .filter((e) => e.includes("@"))
      .slice(0, 2500);

    const summary = await verifyEmailBatch(cleanEmails, {
      skipSmtp,
      concurrency: 10,
    });

    return NextResponse.json({
      ok: true,
      ...summary,
    });
  }

  // Mode 2: Verify Lead records by leadIds
  const leadIds = Array.isArray(body.leadIds)
    ? body.leadIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
    : [];

  if (leadIds.length === 0) {
    return NextResponse.json(
      { error: "Provide leadIds or emails to verify" },
      { status: 400 },
    );
  }

  const leads = await prisma.lead.findMany({
    where: {
      id: { in: leadIds.slice(0, 2500) },
    },
    select: {
      id: true,
      businessName: true,
      email: true,
      decisionMakerEmail: true,
      emailStatus: true,
      emailSubStatus: true,
      emailBounceRisk: true,
      isRoleAccount: true,
      emailVerifySource: true,
      emailScore: true,
      emailVerifiedAt: true,
    },
  });

  // Partition into cached (< 30 days) vs needs fresh verification
  const toVerifyLeads: typeof leads = [];
  const leadResults: Array<{
    leadId: string;
    businessName: string;
    email: string | null;
    cached: boolean;
    emailStatus: EmailCategoryStatus;
    emailSubStatus: string | null;
    emailBounceRisk: string | null;
    isRoleAccount: boolean;
    emailVerifySource: string | null;
    emailScore: number | null;
    score: number;
    emailVerifiedAt: string | null;
    strategy: ReturnType<typeof buildColdEmailStrategy>;
  }> = [];

  for (const lead of leads) {
    const targetEmail = (lead.decisionMakerEmail || lead.email || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      leadResults.push({
        leadId: lead.id,
        businessName: lead.businessName,
        email: null,
        cached: false,
        emailStatus: "unknown",
        emailSubStatus: "no_email",
        emailBounceRisk: null,
        isRoleAccount: false,
        emailVerifySource: null,
        emailScore: null,
        score: 0,
        emailVerifiedAt: null,
        strategy: buildColdEmailStrategy("unknown"),
      });
      continue;
    }

    if (!force && isVerificationFresh(lead.emailVerifiedAt, lead.emailStatus)) {
      const cat = (lead.emailStatus || "unknown") as EmailCategoryStatus;
      const prefix = targetEmail.split("@")[0] || "";
      const decScore = lead.emailScore ?? 0.85;
      leadResults.push({
        leadId: lead.id,
        businessName: lead.businessName,
        email: targetEmail,
        cached: true,
        emailStatus: cat,
        emailSubStatus: lead.emailSubStatus ?? "cached",
        emailBounceRisk: lead.emailBounceRisk ?? "low",
        isRoleAccount: Boolean(lead.isRoleAccount),
        emailVerifySource: lead.emailVerifySource ?? "cache",
        emailScore: decScore,
        score: Math.round(decScore * 100),
        emailVerifiedAt:
          lead.emailVerifiedAt instanceof Date
            ? lead.emailVerifiedAt.toISOString()
            : String(lead.emailVerifiedAt),
        strategy: buildColdEmailStrategy(cat, prefix),
      });
    } else {
      toVerifyLeads.push(lead);
    }
  }

  // Verify unverified or stale emails
  const emailsToVerify = toVerifyLeads.map((l) =>
    (l.decisionMakerEmail || l.email || "").trim().toLowerCase(),
  );

  const batchSummary =
    emailsToVerify.length > 0
      ? await verifyEmailBatch(emailsToVerify, {
          skipSmtp,
          concurrency: 12,
        })
      : null;

  const verifyMap = new Map<string, EmailVerificationResult>();
  if (batchSummary) {
    for (const r of batchSummary.results) {
      verifyMap.set(r.normalizedEmail.toLowerCase(), r);
      verifyMap.set(r.email.toLowerCase(), r);
    }
  }

  // Persist results to PostgreSQL in parallel chunks
  const dbUpdates: Array<Promise<unknown>> = [];
  for (const lead of toVerifyLeads) {
    const targetEmail = (lead.decisionMakerEmail || lead.email || "").trim().toLowerCase();
    const res = verifyMap.get(targetEmail);
    if (!res) continue;

    const dmVerifyStatus =
      res.emailStatus === "safe"
        ? "verified"
        : res.emailStatus === "invalid"
          ? "invalid"
          : "risky";

    dbUpdates.push(
      prisma.lead
        .update({
          where: { id: lead.id },
          data: {
            emailStatus: res.emailStatus,
            emailVerifiedAt: new Date(res.emailVerifiedAt),
            emailBounceRisk: res.emailBounceRisk,
            isRoleAccount: res.isRoleAccount,
            emailVerifySource: res.emailVerifySource,
            emailScore: res.emailScore,
            emailSubStatus: res.emailSubStatus,
            verificationStatus: res.emailStatus === "invalid" ? "invalid" : "verified",
            decisionMakerEmailVerification: dmVerifyStatus,
          },
        })
        .catch(() => null),
    );

    leadResults.push({
      leadId: lead.id,
      businessName: lead.businessName,
      email: targetEmail,
      cached: false,
      emailStatus: res.emailStatus,
      emailSubStatus: res.emailSubStatus,
      emailBounceRisk: res.emailBounceRisk,
      isRoleAccount: res.isRoleAccount,
      emailVerifySource: res.emailVerifySource,
      emailScore: res.emailScore,
      score: res.score,
      emailVerifiedAt: res.emailVerifiedAt,
      strategy: res.strategy,
    });
  }

  if (dbUpdates.length > 0) {
    await Promise.all(dbUpdates);
  }

  // Compute summary counts across all requested leads
  let safeCount = 0;
  let catchallCount = 0;
  let roleCount = 0;
  let invalidCount = 0;
  let unknownCount = 0;
  let cachedCount = 0;

  const safeLeadIds: string[] = [];
  const catchallLeadIds: string[] = [];
  const roleLeadIds: string[] = [];
  const invalidLeadIds: string[] = [];

  for (const item of leadResults) {
    if (item.cached) cachedCount++;
    if (item.emailStatus === "safe") {
      safeCount++;
      safeLeadIds.push(item.leadId);
    } else if (item.emailStatus === "catchall") {
      catchallCount++;
      catchallLeadIds.push(item.leadId);
    } else if (item.emailStatus === "role") {
      roleCount++;
      roleLeadIds.push(item.leadId);
    } else if (item.emailStatus === "invalid") {
      invalidCount++;
      invalidLeadIds.push(item.leadId);
    } else {
      unknownCount++;
    }
  }

  return NextResponse.json({
    ok: true,
    totalChecked: leadResults.length,
    cachedCount,
    safeCount,
    catchallCount,
    roleCount,
    invalidCount,
    unknownCount,
    validCount: safeCount + catchallCount + roleCount,
    safeLeadIds,
    catchallLeadIds,
    roleLeadIds,
    invalidLeadIds,
    results: leadResults,
  });
}

