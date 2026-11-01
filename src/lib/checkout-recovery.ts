import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import {
  preferencesUrlForUser,
  sendEmail,
  unsubscribeUrlForUser,
} from "@/lib/email";
import { appBaseUrl } from "@/lib/email-brand";
import type { EmailTemplateKey } from "@/lib/email-template-defaults";
import { getEmailTemplate } from "@/lib/email-template-store";
import { renderManagedTemplate } from "@/lib/email-templates";
import {
  MESSAGING_ADDON_NAME,
  MESSAGING_ADDON_PRICE_USD,
  hasMessagingAddon,
} from "@/lib/messaging-addon";
import {
  ADMIN_PLANS,
  PLAN_IDS,
  PLAN_MONTHLY_CREDITS,
  STARTER_FREE_LEADS,
  normalizePlan,
  planLabel,
  type PlanId,
} from "@/lib/plans";

/**
 * Abandoned-checkout recovery for Contractor Leads' own customers.
 *
 * Lifecycle of a CheckoutAttempt row:
 *   started   — order created (Razorpay/Stripe), nothing paid yet
 *   abandoned — user closed the payment modal
 *   paid      — plan / add-on activated (or detected as covered on re-check)
 *   stopped   — sequence exhausted (3 steps) or user opted out of marketing
 *
 * Steps go out 1h, 24h and 72h after `startedAt`.
 */

export type CheckoutProvider = "razorpay" | "stripe";
export type CheckoutKind = "plan" | "addon";
export type CheckoutPeriod = "monthly" | "annual";
export type CheckoutAttemptStatus = "started" | "abandoned" | "paid" | "stopped";

/** Delay from `startedAt` for each step (index 0 = step 1). */
export const CHECKOUT_RECOVERY_STEP_DELAYS_MS: readonly number[] = [
  60 * 60 * 1000, // 1h
  24 * 60 * 60 * 1000, // 24h
  72 * 60 * 60 * 1000, // 72h
];
export const CHECKOUT_RECOVERY_MAX_STEPS = CHECKOUT_RECOVERY_STEP_DELAYS_MS.length;

const OPEN_STATUSES: CheckoutAttemptStatus[] = ["started", "abandoned"];

export const CHECKOUT_RECOVERY_ADDON_PLAN = "messaging_addon";

export async function recordCheckoutStarted(input: {
  userId: string;
  provider: CheckoutProvider;
  orderId: string;
  plan: string;
  period?: CheckoutPeriod | null;
  kind: CheckoutKind;
  amountUsd?: number | null;
  coupon?: string | null;
}) {
  const now = new Date();
  const nextSendAt = new Date(now.getTime() + CHECKOUT_RECOVERY_STEP_DELAYS_MS[0]);
  const shared = {
    userId: input.userId,
    provider: input.provider,
    plan: input.plan,
    period: input.period ?? null,
    kind: input.kind,
    amountUsd: typeof input.amountUsd === "number" ? input.amountUsd : null,
    coupon: input.coupon?.trim() || null,
    status: "started" satisfies CheckoutAttemptStatus,
    nextSendAt,
    lastStepSent: 0,
    stepsSentJson: null,
    paidAt: null,
  };
  return prisma.checkoutAttempt.upsert({
    where: { orderId: input.orderId },
    create: { ...shared, orderId: input.orderId, startedAt: now },
    update: { ...shared, startedAt: now },
  });
}

/**
 * Called when a plan / add-on is activated. Closes every open attempt of the
 * user that the purchase covers (optionally narrowed by plan/kind).
 */
export async function markCheckoutAttemptsPaid(
  userId: string,
  filter: { plan?: string | null; kind?: CheckoutKind | null } = {},
) {
  const now = new Date();
  const result = await prisma.checkoutAttempt.updateMany({
    where: {
      userId,
      status: { in: OPEN_STATUSES },
      ...(filter.kind ? { kind: filter.kind } : {}),
      ...(filter.plan ? { plan: filter.plan } : {}),
    },
    data: {
      status: "paid" satisfies CheckoutAttemptStatus,
      paidAt: now,
      nextSendAt: null,
    },
  });
  return result.count;
}

/** User closed the payment modal without paying. Sequence timing is unchanged. */
export async function markCheckoutDismissed(orderId: string) {
  const result = await prisma.checkoutAttempt.updateMany({
    where: {
      orderId,
      status: "started" satisfies CheckoutAttemptStatus,
    },
    data: { status: "abandoned" satisfies CheckoutAttemptStatus },
  });
  return result.count;
}

type RecoveryUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  subscriptionStatus: string;
  messagingAddonStatus: string;
  messagingAddonManual: boolean;
  emailMarketingOptIn: boolean;
  isActive: boolean;
};

const PLAN_RANK: Record<PlanId, number> = {
  starter: 1,
  growth: 2,
  agency: 3,
  enterprise: 4,
};

function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

/** Does the user's current account already cover what they tried to buy? */
export function attemptIsCovered(
  attempt: { kind: string; plan: string },
  user: RecoveryUser,
): boolean {
  if (attempt.kind === "addon") {
    return hasMessagingAddon(user);
  }
  if (user.subscriptionStatus !== "active") return false;
  const current = normalizePlan(user.plan);
  const wanted = isPlanId(attempt.plan) ? attempt.plan : normalizePlan(attempt.plan);
  return PLAN_RANK[current] >= PLAN_RANK[wanted];
}

function formatInt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatUsd(n: number) {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Human copy for the plan or add-on being recovered. */
export function describeCheckoutAttempt(attempt: {
  kind: string;
  plan: string;
  period: string | null;
  amountUsd: number | null;
}) {
  if (attempt.kind === "addon") {
    return {
      planName: MESSAGING_ADDON_NAME,
      credits: null as number | null,
      priceLabel: `${formatUsd(attempt.amountUsd ?? MESSAGING_ADDON_PRICE_USD)}/mo`,
      planSummary:
        "It unlocks bulk email and SMS outreach to the leads you already have.",
    };
  }
  const plan = normalizePlan(attempt.plan);
  const credits =
    plan === "enterprise"
      ? null
      : PLAN_MONTHLY_CREDITS[plan as Exclude<PlanId, "enterprise">] ?? null;
  const listPrice = ADMIN_PLANS.find((p) => p.value === plan)?.priceMonthly ?? 0;
  const priceLabel =
    attempt.period === "annual"
      ? `${formatUsd(attempt.amountUsd ?? listPrice * 10)}/yr`
      : `${formatUsd(attempt.amountUsd ?? listPrice)}/mo`;
  return {
    planName: planLabel(plan),
    credits,
    priceLabel,
    planSummary: credits
      ? `It includes ${formatInt(credits)} credits a month (1 credit = 1 lead).`
      : "It includes a custom monthly credit allotment (1 credit = 1 lead).",
  };
}

export function checkoutRecoveryLink(attempt: { id: string; kind: string; plan: string }, step: number) {
  const plan = attempt.kind === "addon" ? CHECKOUT_RECOVERY_ADDON_PLAN : normalizePlan(attempt.plan);
  const params = new URLSearchParams({
    plan,
    utm_source: "recovery",
    utm_medium: "email",
    utm_campaign: `checkout_step${step}`,
    attempt: attempt.id,
  });
  return `${appBaseUrl()}/billing?${params.toString()}`;
}

function templateKeyForStep(step: number): EmailTemplateKey {
  if (step <= 1) return "checkout_recovery_1";
  if (step === 2) return "checkout_recovery_2";
  return "checkout_recovery_3";
}

export type CheckoutRecoveryResult =
  | { attemptId: string; outcome: "paid" }
  | { attemptId: string; outcome: "stopped"; reason: string }
  | { attemptId: string; outcome: "sent"; step: number; mocked: boolean }
  | { attemptId: string; outcome: "skipped"; reason: string }
  | { attemptId: string; outcome: "error"; error: string };

function parseSteps(json: string | null): number[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is number => typeof v === "number")
      : [];
  } catch {
    return [];
  }
}

/**
 * Sends the due recovery steps. Run from the checkout-recovery cron.
 */
export async function processDueCheckoutRecovery(
  limit = 50,
): Promise<CheckoutRecoveryResult[]> {
  const now = new Date();
  const due = await prisma.checkoutAttempt.findMany({
    where: {
      status: { in: OPEN_STATUSES },
      nextSendAt: { lte: now },
    },
    orderBy: { nextSendAt: "asc" },
    take: Math.max(1, Math.min(500, limit)),
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          plan: true,
          subscriptionStatus: true,
          messagingAddonStatus: true,
          messagingAddonManual: true,
          emailMarketingOptIn: true,
          isActive: true,
        },
      },
    },
  });

  const results: CheckoutRecoveryResult[] = [];

  for (const attempt of due) {
    const user: RecoveryUser = attempt.user;
    try {
      // 1. Already bought (webhook raced us, admin comped, upgraded elsewhere)?
      if (attemptIsCovered(attempt, user)) {
        await prisma.checkoutAttempt.update({
          where: { id: attempt.id },
          data: { status: "paid", paidAt: now, nextSendAt: null },
        });
        results.push({ attemptId: attempt.id, outcome: "paid" });
        continue;
      }

      const step = attempt.lastStepSent + 1;

      // 2. Nothing left to send, or deactivated account.
      if (step > CHECKOUT_RECOVERY_MAX_STEPS || !user.isActive || !user.email) {
        await prisma.checkoutAttempt.update({
          where: { id: attempt.id },
          data: { status: "stopped", nextSendAt: null },
        });
        results.push({
          attemptId: attempt.id,
          outcome: "stopped",
          reason: !user.isActive ? "user_inactive" : step > CHECKOUT_RECOVERY_MAX_STEPS ? "exhausted" : "no_email",
        });
        continue;
      }

      // 3. Marketing opt-out: step 1 is transactional (you started a checkout),
      //    steps 2-3 are marketing → never send them.
      if (user.emailMarketingOptIn === false && step > 1) {
        await prisma.checkoutAttempt.update({
          where: { id: attempt.id },
          data: { status: "stopped", nextSendAt: null },
        });
        results.push({ attemptId: attempt.id, outcome: "stopped", reason: "marketing_opt_out" });
        continue;
      }

      const template = await getEmailTemplate(templateKeyForStep(step));
      const isLastStep =
        step >= CHECKOUT_RECOVERY_MAX_STEPS || user.emailMarketingOptIn === false;
      const nextSendAt = isLastStep
        ? null
        : new Date(
            Math.max(
              attempt.startedAt.getTime() + CHECKOUT_RECOVERY_STEP_DELAYS_MS[step],
              now.getTime() + 60 * 60 * 1000,
            ),
          );

      if (!template.enabled) {
        // Admin disabled this step: advance the sequence without sending.
        await prisma.checkoutAttempt.update({
          where: { id: attempt.id },
          data: {
            lastStepSent: step,
            nextSendAt,
            status: isLastStep ? "stopped" : attempt.status,
          },
        });
        results.push({ attemptId: attempt.id, outcome: "skipped", reason: "template_disabled" });
        continue;
      }

      const copy = describeCheckoutAttempt(attempt);
      const ctaUrl = checkoutRecoveryLink(attempt, step);
      const unsubscribeUrl = unsubscribeUrlForUser(user.id);
      const preferencesUrl = preferencesUrlForUser(user.id);
      const rendered = renderManagedTemplate({
        template,
        vars: {
          name: user.name?.trim() || "there",
          planName: copy.planName,
          planSummary: copy.planSummary,
          credits: copy.credits === null ? "" : formatInt(copy.credits),
          priceLabel: copy.priceLabel,
          freeLeads: STARTER_FREE_LEADS,
        },
        ctaUrl,
        links: { unsubscribeUrl, preferencesUrl },
      });

      const sent = await sendEmail({
        to: user.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        unsubscribeUrl,
        tags: ["checkout-recovery", `step-${step}`],
      });

      if (!sent.ok) {
        results.push({
          attemptId: attempt.id,
          outcome: "error",
          error: sent.error || "send failed",
        });
        continue;
      }

      const steps = parseSteps(attempt.stepsSentJson);
      steps.push(step);
      await prisma.checkoutAttempt.update({
        where: { id: attempt.id },
        data: {
          lastStepSent: step,
          nextSendAt,
          stepsSentJson: JSON.stringify(steps),
          status: isLastStep ? "stopped" : attempt.status,
        },
      });

      await logActivity(
        user.id,
        "checkout_recovery_email",
        `Checkout recovery email ${step}/${CHECKOUT_RECOVERY_MAX_STEPS} sent for ${copy.planName}`,
        {
          attemptId: attempt.id,
          step,
          plan: attempt.plan,
          kind: attempt.kind,
          orderId: attempt.orderId,
        },
      );

      results.push({
        attemptId: attempt.id,
        outcome: "sent",
        step,
        mocked: sent.mocked ?? false,
      });
    } catch (err) {
      console.error("[checkout-recovery] attempt failed", attempt.id, err);
      results.push({
        attemptId: attempt.id,
        outcome: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
