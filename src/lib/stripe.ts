import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";
import { getStripeBillingSecrets } from "@/lib/stripe-config";

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

export function resetStripeClient() {
  stripeClient = null;
  stripeClientKey = null;
}

export async function getStripe(): Promise<Stripe> {
  const { secretKey } = await getStripeBillingSecrets();
  if (!secretKey) {
    throw new Error("Stripe secret key is not configured");
  }
  if (!stripeClient || stripeClientKey !== secretKey) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-08-27.basil",
      typescript: true,
    });
    stripeClientKey = secretKey;
  }
  return stripeClient;
}

export async function isStripeConfigured() {
  const cfg = await getStripeBillingSecrets();
  return Boolean(
    cfg.secretKey && cfg.priceStarter && cfg.priceGrowth && cfg.priceAgency,
  );
}

/** Self-serve paid plans available via Checkout. */
export const STRIPE_CHECKOUT_PLANS = ["starter", "growth", "agency"] as const;
export type StripeCheckoutPlan = (typeof STRIPE_CHECKOUT_PLANS)[number];

export function isStripeCheckoutPlan(
  plan: string,
): plan is StripeCheckoutPlan {
  return (STRIPE_CHECKOUT_PLANS as readonly string[]).includes(plan);
}

/** Monthly credit allotment = marketing leads × 1.33 */
export const PLAN_MONTHLY_CREDITS: Record<StripeCheckoutPlan, number> = {
  starter: 1330,
  growth: 9975,
  agency: 26600,
};

export async function priceIdForPlan(
  plan: StripeCheckoutPlan,
): Promise<string | null> {
  const cfg = await getStripeBillingSecrets();
  const map: Record<StripeCheckoutPlan, string> = {
    starter: cfg.priceStarter,
    growth: cfg.priceGrowth,
    agency: cfg.priceAgency,
  };
  const id = map[plan]?.trim();
  return id || null;
}

export async function planFromPriceId(
  priceId: string | null | undefined,
): Promise<PlanId | null> {
  if (!priceId) return null;
  const cfg = await getStripeBillingSecrets();
  const entries: Array<[StripeCheckoutPlan, string]> = [
    ["starter", cfg.priceStarter],
    ["growth", cfg.priceGrowth],
    ["agency", cfg.priceAgency],
  ];
  for (const [plan, id] of entries) {
    if (id.trim() && id.trim() === priceId) return plan;
  }
  return null;
}

export async function getStripeWebhookSecret() {
  const { webhookSecret } = await getStripeBillingSecrets();
  return webhookSecret || null;
}

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
