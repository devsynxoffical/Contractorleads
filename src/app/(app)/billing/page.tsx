import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, LOGO_GRADIENT } from "@/components/layout/page-header";
import {
  MARKETING_PLANS,
  formatPlanPrice,
  formatPricePerLead,
  pricePerLead,
} from "@/components/marketing/marketing-plans-data";
import { normalizePlan, planLabel, featuresForPlan } from "@/lib/plans";
import { formatCredits } from "@/lib/utils";
import Link from "next/link";

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const current = normalizePlan(user.plan);
  const features = featuresForPlan(user.plan);

  return (
    <div className="page-pad">
      <PageHeader
        title="Billing and plan usage"
        description="Your current plan, credit balance, and what unlocks as you move Starter → Growth → Agency → Enterprise."
      />

      <Card className="max-w-2xl border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-ink">
                {planLabel(user.plan)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatCredits(user.creditsRemaining)} credits remaining
              </p>
            </div>
            <Badge variant="brand">
              {user.subscriptionStatus || "active"}
            </Badge>
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
          {!features.teams ? (
            <p className="text-[13px] text-ink-muted">
              Need seats for your agency?{" "}
              <Link href="/team" className="font-semibold text-brand-600 hover:underline">
                Users &amp; teams
              </Link>{" "}
              unlocks on Agency.
            </p>
          ) : (
            <Link href="/team" className="text-[13px] font-semibold text-brand-600 hover:underline">
              Manage users &amp; teams →
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MARKETING_PLANS.map((plan) => {
          const active = plan.id === current;
          const perLead = pricePerLead(plan.priceMonthly, plan.leadsIncluded);
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
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 w-full"
                  disabled
                  style={
                    plan.popular
                      ? { background: LOGO_GRADIENT, color: "white", border: 0 }
                      : undefined
                  }
                >
                  Stripe — coming soon
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
