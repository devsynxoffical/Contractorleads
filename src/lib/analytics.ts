/** Google Analytics 4 measurement ID for www.contractorleads.us (stream "CL"). */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-0GD48CBLXK";

type Gtag = (command: "event", name: string, params?: Record<string, unknown>) => void;

/**
 * Send a GA4 event (e.g. "sign_up", "generate_lead"). No-op on the server, before gtag
 * has loaded, or when it is blocked; analytics must never break the page.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag;
    gtag?.("event", name, params);
  } catch {
    // ignore
  }
}
