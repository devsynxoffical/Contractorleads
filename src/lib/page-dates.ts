/**
 * Last real content change per page, used for sitemap <lastmod>.
 *
 * Search engines use lastmod to decide what to recrawl, so each page reports when its
 * own content last changed instead of one site-wide date. Update the date for a page
 * whenever its visible content changes (not for code-only changes).
 */
export const PAGE_UPDATED: Record<string, string> = {
  "/": "2026-11-05",
  "/features": "2026-11-03",
  "/pricing": "2026-11-05",
  "/contractor-lead-generation-software": "2026-11-05",
  "/google-maps-scraper": "2026-11-05",
  "/apollo-alternative": "2026-11-03",
  "/alternatives": "2026-11-03",
  "/industries": "2026-11-03",
  "/blog": "2026-11-05",
  "/help": "2026-11-03",
  "/faq": "2026-11-05",
  "/about": "2026-11-03",
  "/affiliates": "2026-11-03",
  "/enterprise/book": "2026-11-03",
  "/privacy": "2026-11-03",
  "/terms": "2026-11-03",
  // Commercial landing pages (week 2 of the SEO page plan)
  "/exclusive-contractor-leads": "2026-11-05",
  "/contractor-lead-tracking": "2026-11-05",
  "/contractor-lead-management": "2026-11-05",
  "/contractor-crm": "2026-11-05",
  "/sms-marketing-for-contractors": "2026-11-05",
  "/contractor-email-finder": "2026-11-05",
  "/homeowner-leads": "2026-11-05",
  "/commercial-contractor-leads": "2026-11-05",
  "/storm-damage-leads": "2026-11-05",
  "/new-construction-leads": "2026-11-05",
};

/** Trade hubs that received trade-specific content on this date. */
export const TRADE_HUB_UPDATED: Record<string, string> = {
  roofing: "2026-11-05",
  hvac: "2026-11-05",
  plumbing: "2026-11-05",
  electrical: "2026-11-05",
  solar: "2026-11-05",
  "general-contractors": "2026-11-05",
  remodeling: "2026-11-05",
};
/** Other trade hubs last changed when their titles were updated. */
export const TRADE_HUB_DEFAULT_UPDATED = "2026-11-03";

/** State pages were rebuilt on real state facts on this date. */
export const STATE_PAGES_UPDATED = "2026-11-05";

/** Comparison pages without their own updatedDate. */
export const ALTERNATIVES_DEFAULT_UPDATED = "2026-11-03";

export function pageUpdated(path: string, fallback = "2026-11-03"): string {
  return PAGE_UPDATED[path] ?? fallback;
}
