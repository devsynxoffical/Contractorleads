import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import {
  getMarketingPlansLive,
  formatPlanPrice,
  formatPricePerLead,
  pricePerLead,
} from "@/components/marketing/marketing-plans-data";
import {
  normalizePlan,
  planLabel,
  featuresForPlan,
  PLAN_IDS,
  monthlyCreditsForPlan,
  type PlanId,
} from "@/lib/plans";
import { formatCredits } from "@/lib/utils";
import { CREDIT_COSTS } from "@/lib/constants";
import {
  getStripe,
  isMessagingAddonConfigured,
  isStripeConfigured,
} from "@/lib/stripe";
import {
  fulfillCheckoutSession,
  fulfillMessagingAddonSession,
  notifyCheckoutAbandoned,
} from "@/lib/billing-stripe";
import {
  hasMessagingAddon,
  MESSAGING_ADDON_PRICE_USD,
} from "@/lib/messaging-addon";
import { BillingCheckoutButton } from "@/components/billing/billing-checkout-button";
import { BillingCouponField } from "@/components/billing/billing-coupon-field";
import { MessagingAddonCard } from "@/components/billing/messaging-addon-card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HiOutlineCheck, HiOutlineLockClosed } from "react-icons/hi2";

function planRank(plan: string) {
  const idx = (PLAN_IDS as readonly string[]).indexOf(plan);
  return idx < 0 ? 0 : idx;
}

function changePlanLabel(current: PlanId, target: PlanId, name: string) {
  const diff = planRank(target) - planRank(current);
  if (diff > 0) return `Upgrade to ${name}`;
  if (diff < 0) return `Switch to ${name}`;
  return `Subscribe to ${name}`;
}

const FEATURE_ROWS: Array<{
  label: string;
  key: "api" | "sso" | "teams" | "crm" | "map" | "reports";
}> = [
  { label: "API / MCP", key: "api" },
  { label: "Lead map", key: "map" },
  { label: "CRM webhooks", key: "crm" },
  { label: "SSO", key: "sso" },
  { label: "Users & teams", key: "teams" },
  { label: "Client reports", key: "reports" },
];

type CheckoutOutcome = "active" | "pending" | "received";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    checkout?: string;
    session_id?: string;
    addon?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const stripeReady = await isStripeConfigured();

  // Messaging add-on returned from Checkout — activate then clean the URL.
  if (params.addon === "active" && params.session_id) {
    try {
      await fulfillMessagingAddonSession({
        sessionId: params.session_id,
        userId: user.id,
      });
    } catch (err) {
      console.error("messaging addon fulfill", err);
    }
    redirect("/billing?addon=done");
  }

  // Stripe hands the session id back on the return URL. Fulfil it, then
  // redirect to a clean URL so the id does not linger in history or referrers.
  if (params.checkout === "success" && params.session_id && stripeReady) {
    let outcome: CheckoutOutcome = "received";
    try {
      const result = await fulfillCheckoutSession({
        sessionId: params.session_id,
        userId: user.id,
      });
      if (result.ok && result.plan) {
        outcome = "active";
      } else if (result.reason === "not_paid") {
        outcome = "pending";
      }
    } catch (err) {
      console.error("billing success fulfill", err);
    }
    redirect(`/billing?checkout=${outcome}`);
  }

  if (params.checkout === "canceled" && params.session_id && stripeReady) {
    try {
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.retrieve(params.session_id);
      if (
        session &&
        session.status !== "complete" &&
        session.payment_status !== "paid"
      ) {
        const sessionUserId =
          session.metadata?.userId || session.client_reference_id || null;
        if (sessionUserId === user.id) {
          await notifyCheckoutAbandoned({
            userId: user.id,
            sessionId: session.id,
            plan: session.metadata?.plan ?? null,
            reason: "canceled",
          });
        }
      }
    } catch (err) {
      console.error("billing cancel abandoned email", err);
    }
    redirect("/billing?checkout=canceled");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
      creditsRemaining: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      role: true,
      messagingAddonStatus: true,
      messagingAddonManual: true,
    },
  });
  const addonActive = dbUser ? hasMessagingAddon(dbUser) : false;
  const addonComped = Boolean(dbUser?.messagingAddonManual);
  const addonAvailable = await isMessagingAddonConfigured();
  const current = normalizePlan(dbUser?.plan ?? user.plan);
  const features = featuresForPlan(current);
  const creditsRemaining = dbUser?.creditsRemaining ?? user.creditsRemaining;
  const hasStripeCustomer = Boolean(dbUser?.stripeCustomerId);
  const status = (dbUser?.subscriptionStatus || user.subscriptionStatus || "")
    .replace(/_/g, " ")
    .toLowerCase();
  const includedCount = FEATURE_ROWS.filter((f) => features[f.key]).length;

  const monthlyCredits = monthlyCreditsForPlan(current);
  const plans = await getMarketingPlansLive();
  const checkoutMessage =
    params.checkout === "active"
      ? `You're now on ${planLabel(current)}${
          monthlyCredits != null
            ? ` with ${monthlyCredits.toLocaleString()} monthly credits (${CREDIT_COSTS.lead} credit per lead)`
            : ""
        }.`
      : params.checkout === "pending"
        ? "Payment is still processing. Refresh in a few seconds if your plan has not updated."
        : params.checkout === "received"
          ? "Payment received. If your plan has not updated yet, refresh in a few seconds."
          : null;

  return (
    <div className="page-pad mx-auto max-w-6xl">
      <PageHeader
        title="Plans & Billing"
        description="Your subscription, credits, and plan features — upgrade anytime."
      />

      {checkoutMessage ? (
        <p className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-800 dark:text-emerald-200">
          {checkoutMessage}
        </p>
      ) : null}
      {params.checkout === "canceled" ? (
        <p className="mb-5 rounded-xl border border-border bg-[var(--surface)] px-4 py-3 text-[13px] text-ink-muted">
          Checkout canceled — no charge was made.
        </p>
      ) : null}
      {params.addon === "done" ? (
        <p className="mb-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-800 dark:text-emerald-200">
          Messaging add-on active — bulk email and SMS are now unlocked.
        </p>
      ) : null}
      {params.addon === "canceled" ? (
        <p className="mb-5 rounded-xl border border-border bg-[var(--surface)] px-4 py-3 text-[13px] text-ink-muted">
          Add-on checkout canceled — no charge was made.
        </p>
      ) : null}
      {!stripeReady ? (
        <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-900 dark:text-amber-100">
          Billing is not fully configured. Ask an admin to add Stripe keys under
          System &amp; API Keys.
        </p>
      ) : null}

      {/* Current plan summary */}
      <section className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Current plan
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {planLabel(current)}
              </h2>
              {status ? (
                <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-brand-700">
                  {status}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-[14px] text-ink-muted">
              <span className="font-semibold tabular-nums text-ink">
                {formatCredits(creditsRemaining)}
              </span>{" "}
              credits remaining
              {monthlyCredits != null ? (
                <>
                  <span className="text-ink-faint"> · </span>
                  {monthlyCredits.toLocaleString()} / mo allotment
                </>
              ) : null}
              <span className="text-ink-faint"> · </span>
              {CREDIT_COSTS.lead} credit per lead
              <span className="text-ink-faint"> · </span>
              {includedCount} of {FEATURE_ROWS.length} premium features unlocked
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {hasStripeCustomer ? (
              <BillingCheckoutButton
                planId={current}
                label="Manage billing"
                manage
                className="mt-0 min-w-[9.5rem]"
              />
            ) : null}
            {features.teams ? (
              <Link
                href="/team"
                className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-ink hover:border-brand-200"
              >
                Team seats
              </Link>
            ) : (
              <p className="text-[12px] text-ink-faint">
                Team seats unlock on Agency
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FEATURE_ROWS.map((row) => {
            const on = features[row.key];
            return (
              <span
                key={row.key}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  on
                    ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "bg-[var(--input-bg)] text-ink-faint"
                }`}
              >
                {on ? (
                  <HiOutlineCheck className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <HiOutlineLockClosed className="h-3.5 w-3.5" aria-hidden />
                )}
                {row.label}
              </span>
            );
          })}
        </div>
      </section>

      {/* Messaging add-on */}
      <div className="mt-6">
        <MessagingAddonCard
          active={addonActive}
          comped={addonComped}
          available={addonAvailable}
          status={dbUser?.messagingAddonStatus ?? "inactive"}
          priceUsd={MESSAGING_ADDON_PRICE_USD}
        />
      </div>

      <div className="mt-6">
        <BillingCouponField />
      </div>

      {/* Plan picker */}
      <div className="mt-8">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-ink">Change plan</h3>
          <p className="mt-1 text-[13px] text-ink-muted">
            Compare tiers — each plan shows monthly credits at {CREDIT_COSTS.lead}{" "}
            credit per lead.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const active = plan.id === current;
            const perLead = pricePerLead(plan.priceMonthly, plan.leadsIncluded);
            const isEnterprise = plan.custom || plan.id === "enterprise";
            const planFeatures = featuresForPlan(plan.id);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] ${
                  active
                    ? "border-brand-400 ring-2 ring-brand-500/20"
                    : plan.popular
                      ? "border-brand-200/80"
                      : "border-border"
                }`}
              >
                <div className="mb-3 flex min-h-[1.25rem] items-center gap-2">
                  {active ? (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
                      Current
                    </span>
                  ) : null}
                  {plan.popular && !active ? (
                    <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                      Popular
                    </span>
                  ) : null}
                </div>

                <p className="text-[15px] font-semibold text-ink">{plan.name}</p>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-[28px] font-semibold tracking-tight text-ink">
                    {plan.priceMonthly == null
                      ? "Custom"
                      : `$${formatPlanPrice(plan.priceMonthly)}`}
                  </span>
                  {plan.priceMonthly != null ? (
                    <span className="text-[13px] text-ink-faint">/mo</span>
                  ) : null}
                </p>
                <p className="mt-1 text-[12px] text-ink-muted">
                  {plan.creditsLabel}
                </p>
                {perLead != null ? (
                  <p className="mt-0.5 text-[12px] tabular-nums text-ink-faint">
                    {formatPricePerLead(perLead)} per lead
                  </p>
                ) : (
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    Tailored for large teams
                  </p>
                )}

                <ul className="mt-5 flex-1 space-y-2 border-t border-border/80 pt-4">
                  {FEATURE_ROWS.map((row) => {
                    const on = planFeatures[row.key];
                    return (
                      <li
                        key={row.key}
                        className={`flex items-center gap-2 text-[12px] ${
                          on ? "text-ink" : "text-ink-faint"
                        }`}
                      >
                        {on ? (
                          <HiOutlineCheck
                            className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                            aria-hidden
                          />
                        ) : (
                          <span
                            className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                            aria-hidden
                          />
                        )}
                        {row.label}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-5">
                  {isEnterprise ? (
                    <a
                      href="mailto:hello@contractorleads.us"
                      className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-[var(--input-bg)] px-3 text-xs font-semibold text-ink hover:border-brand-200"
                    >
                      Talk to sales
                    </a>
                  ) : active ? (
                    <div className="flex h-9 w-full items-center justify-center rounded-lg border border-border/60 bg-[var(--input-bg)] text-xs font-semibold text-ink-muted">
                      Your current plan
                    </div>
                  ) : (
                    <BillingCheckoutButton
                      planId={plan.id}
                      label={
                        stripeReady
                          ? changePlanLabel(
                              current,
                              plan.id as PlanId,
                              plan.name,
                            )
                          : "Unavailable"
                      }
                      popular={plan.popular}
                      disabled={!stripeReady}
                      className="mt-0"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
