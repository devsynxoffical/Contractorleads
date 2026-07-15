import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, LOGO_GRADIENT } from "@/components/layout/page-header";

const plans = [
  {
    name: "Free Trial",
    leads: "10 leads",
    price: "$0",
    blurb: "Try Lead Finder end-to-end",
  },
  {
    name: "Starter",
    leads: "500 / month",
    price: "$49",
    blurb: "Solo sellers & small teams",
  },
  {
    name: "Pro",
    leads: "2,000 / month",
    price: "$99",
    blurb: "Agencies running weekly searches",
    featured: true,
  },
  {
    name: "Agency",
    leads: "Unlimited",
    price: "Custom",
    blurb: "Workspaces + white-label reports",
  },
];

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-pad">
      <PageHeader
        title="Plans & Billing"
        description="Manage your subscription and credit balance."
      />

      <Card className="max-w-lg border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold capitalize text-ink">
                {user.plan}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {user.creditsRemaining} credits remaining
              </p>
            </div>
            <Badge variant="brand">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`border-border shadow-[var(--shadow-card)] ${
              plan.featured ? "ring-2 ring-brand-500/30" : ""
            }`}
          >
            <CardContent className="py-5">
              {plan.featured && (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                  Popular
                </p>
              )}
              <p className="font-semibold text-ink">{plan.name}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                {plan.price}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{plan.leads}</p>
              <p className="mt-2 text-[12px] text-ink-faint">{plan.blurb}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full"
                disabled
                style={
                  plan.featured
                    ? { background: LOGO_GRADIENT, color: "white", border: 0 }
                    : undefined
                }
              >
                Stripe — coming soon
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
