import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";
import { SITE_URL } from "@/lib/email-brand";
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

function isLocalUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * Public site URL for Stripe redirects (success / cancel / portal).
 * Never returns localhost in production — that caused Checkout to send
 * users to localhost:3000 after paying on contractorleads.us.
 */
export function appBaseUrl(request?: Request) {
  // Prefer the host the user actually hit (works behind Railway / proxies)
  if (request) {
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    const forwardedProto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      "https";
    if (forwardedHost && !isLocalUrl(forwardedHost)) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
    }
    try {
      const origin = new URL(request.url).origin;
      if (origin && !isLocalUrl(origin)) {
        return origin.replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
  }

  const fromEnv = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    ""
  )
    .trim()
    .replace(/\/$/, "");

  if (fromEnv) {
    if (process.env.NODE_ENV === "production" && isLocalUrl(fromEnv)) {
      return SITE_URL;
    }
    return fromEnv;
  }

  if (process.env.NODE_ENV === "production") {
    return SITE_URL;
  }
  return "http://localhost:3000";
}
