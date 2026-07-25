import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import {
  MARKETING_PLANS,
  formatPlanPrice,
  formatPricePerLead,
  pricePerLead,
} from "@/components/marketing/marketing-plans-data";
import {
  normalizePlan,
  planLabel,
  featuresForPlan,
  PLAN_IDS,
  type PlanId,
} from "@/lib/plans";
import { formatCredits } from "@/lib/utils";
import { getStripe, isStripeConfigured, PLAN_MONTHLY_CREDITS } from "@/lib/stripe";
import {
  fulfillCheckoutSession,
  notifyCheckoutAbandoned,
} from "@/lib/billing-stripe";
import { BillingCheckoutButton } from "@/components/billing/billing-checkout-button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const stripeReady = await isStripeConfigured();

  let fulfillMessage: string | null = null;

  // Paid Checkout return — sync plan/credits/features immediately (don't wait on webhooks).
  if (params.checkout === "success" && params.session_id && stripeReady) {
    try {
      const result = await fulfillCheckoutSession({
        sessionId: params.session_id,
        userId: user.id,
      });
      if (result.ok && result.plan) {
        const credits =
          PLAN_MONTHLY_CREDITS[
            result.plan as keyof typeof PLAN_MONTHLY_CREDITS
          ];
        fulfillMessage = `You're now on ${planLabel(result.plan)}${
          credits != null
            ? ` with ${credits.toLocaleString()} monthly credits`
            : ""
        }. Features for this plan are unlocked.`;
      } else if (result.reason === "not_paid") {
        fulfillMessage =
          "Payment is still processing. Refresh in a few seconds if your plan has not updated.";
      } else {
        fulfillMessage =
          "Payment received. If your plan has not updated yet, refresh in a few seconds.";
      }
    } catch (err) {
      console.error("billing success fulfill", err);
      fulfillMessage =
        "Payment received. If your plan has not updated yet, refresh in a few seconds.";
    }
  }

  // User clicked "back" / canceled on Stripe Checkout — send follow-up email.
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
          session.metadata?.userId ||
          session.client_reference_id ||
          null;
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
  }

  // Always re-read after possible fulfillment so UI shows the new plan.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      plan: true,
      creditsRemaining: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
    },
  });
  const current = normalizePlan(dbUser?.plan ?? user.plan);
  const features = featuresForPlan(current);
  const creditsRemaining = dbUser?.creditsRemaining ?? user.creditsRemaining;
  const hasStripeCustomer = Boolean(dbUser?.stripeCustomerId);
  const status = dbUser?.subscriptionStatus || user.subscriptionStatus || "—";

  return (
    <div className="page-pad">
      <PageHeader
        title="Billing and plan usage"
        description="Subscribe with Stripe, manage your subscription, and see which features unlock Starter → Growth → Agency → Enterprise."
      />

      {params.checkout === "success" ? (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-800 dark:text-emerald-200">
          {fulfillMessage ||
            "Plan updated. Your subscription and features are now synced."}
        </p>
      ) : null}
      {params.checkout === "canceled" ? (
        <p className="mb-4 rounded-xl border border-border bg-[var(--surface)] px-4 py-3 text-[13px] text-ink-muted">
          Checkout canceled — no charge was made. We emailed you a link to finish
          whenever you&apos;re ready.
        </p>
      ) : null}

      {!stripeReady ? (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-900 dark:text-amber-100">
          Stripe env vars are not fully configured on this server. Contact your
          admin to add Stripe keys under Admin → System & API Keys.
        </p>
      ) : null}

      <Card className="max-w-2xl border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-ink">
                {planLabel(current)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatCredits(creditsRemaining)} credits remaining
              </p>
            </div>
            <Badge variant="brand">{status}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { l: "API / MCP", on: features.api },
              { l: "SSO", on: features.sso },
              { l: "Users & teams", on: features.teams },
              { l: "CRM webhooks", on: features.crm },
              { l: "Lead map", on: features.map },
              { l: "Client reports", on: features.reports },
            ].map((row) => (
              <div
                key={row.l}
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-[13px]"
              >
                <span className="text-ink-muted">{row.l}</span>
                <span
                  className={
                    row.on
                      ? "font-semibold text-emerald-700"
                      : "font-medium text-ink-faint"
                  }
                >
                  {row.on ? "Included" : "Upgrade"}
                </span>
              </div>
            ))}
          </div>
          {hasStripeCustomer ? (
            <BillingCheckoutButton
              planId={current}
              label="Manage billing"
              manage
            />
          ) : null}
          {!features.teams ? (
            <p className="text-[13px] text-ink-muted">
              Need seats for your agency?{" "}
              <Link
                href="/team"
                className="font-semibold text-brand-600 hover:underline"
              >
                Users &amp; teams
              </Link>{" "}
              unlocks on Agency.
            </p>
          ) : (
            <Link
              href="/team"
              className="text-[13px] font-semibold text-brand-600 hover:underline"
            >
              Manage users &amp; teams →
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MARKETING_PLANS.map((plan) => {
          const active = plan.id === current;
          const perLead = pricePerLead(plan.priceMonthly, plan.leadsIncluded);
          const isEnterprise = plan.custom || plan.id === "enterprise";
          return (
            <Card
              key={plan.id}
              className={`border-border shadow-[var(--shadow-card)] ${
                plan.popular ? "ring-2 ring-brand-500/30" : ""
              } ${active ? "border-brand-400" : ""}`}
            >
              <CardContent className="py-5">
                {plan.popular ? (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                    Popular
                  </p>
                ) : null}
                {active ? (
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                    Current
                  </p>
                ) : null}
                <p className="font-semibold text-ink">{plan.name}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  {plan.priceMonthly == null
                    ? "Custom"
                    : `$${formatPlanPrice(plan.priceMonthly)}`}
                  {plan.priceMonthly != null ? (
                    <span className="text-sm font-medium text-ink-faint">
                      /mo
                    </span>
                  ) : null}
                </p>
                {perLead != null ? (
                  <p className="mt-1 text-[13px] font-semibold tabular-nums text-brand-600">
                    {formatPricePerLead(perLead)} / lead
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-ink-muted">{plan.creditsLabel}</p>
                <p className="mt-2 text-[12px] text-ink-faint">{plan.blurb}</p>
                <ul className="mt-3 space-y-1.5 text-[12px] text-ink-muted">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                {isEnterprise ? (
                  <a
                    href="mailto:hello@contractorleads.us"
                    className="mt-4 inline-flex h-8 w-full items-center justify-center rounded-lg border border-border bg-[var(--surface)] px-3 text-xs font-semibold text-ink shadow-[var(--shadow-soft)] hover:border-brand-200"
                  >
                    Talk to sales
                  </a>
                ) : active ? (
                  <BillingCheckoutButton
                    planId={plan.id}
                    label={hasStripeCustomer ? "Manage billing" : "Current plan"}
                    popular={plan.popular}
                    disabled={!hasStripeCustomer}
                    manage={hasStripeCustomer}
                  />
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
                        : "Stripe unavailable"
                    }
                    popular={plan.popular}
                    disabled={!stripeReady}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
