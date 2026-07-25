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

/** Stripe price id for the $30/mo Messaging add-on (bulk email + SMS). */
export async function messagingAddonPriceId(): Promise<string | null> {
  const cfg = await getStripeBillingSecrets();
  return cfg.priceMessaging?.trim() || null;
}

export async function isMessagingAddonConfigured() {
  const cfg = await getStripeBillingSecrets();
  return Boolean(cfg.secretKey && cfg.priceMessaging?.trim());
}

export async function getStripeWebhookSecret() {
  const { webhookSecret } = await getStripeBillingSecrets();
  return webhookSecret || null;
}

function isLocalUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Origins we are willing to send a paying customer back to. */
function allowedOrigins(): string[] {
  const configured = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    SITE_URL,
  ];

  const origins: string[] = [];
  for (const entry of configured) {
    const trimmed = entry?.trim().replace(/\/$/, "");
    if (!trimmed) continue;
    if (process.env.NODE_ENV === "production" && isLocalUrl(trimmed)) continue;
    try {
      origins.push(new URL(trimmed).origin);
    } catch {
      /* ignore malformed config */
    }
  }
  return origins;
}

function configuredBaseUrl(): string {
  const [first] = allowedOrigins();
  if (first) return first;
  if (process.env.NODE_ENV === "production") return SITE_URL;
  return "http://localhost:3000";
}

/**
 * Public site URL for Stripe redirects (success / cancel / portal).
 *
 * The request host is only honoured when it matches a configured origin.
 * `X-Forwarded-Host` is attacker-controlled unless the edge rewrites it, and
 * trusting it blindly would let someone craft a Checkout session that returns
 * the payer to their own domain.
 */
export function appBaseUrl(request?: Request) {
  if (!request) return configuredBaseUrl();

  const allowed = allowedOrigins();
  if (!allowed.length) return configuredBaseUrl();

  const candidates: string[] = [];

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    candidates.push(`${proto}://${forwardedHost}`);
  }

  const originHeader = request.headers.get("origin")?.trim();
  if (originHeader) candidates.push(originHeader);
  candidates.push(request.url);

  for (const candidate of candidates) {
    try {
      const { origin } = new URL(candidate);
      if (allowed.includes(origin)) return origin;
    } catch {
      /* ignore unparseable candidate */
    }
  }

  return configuredBaseUrl();
}
