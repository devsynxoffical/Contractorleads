import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Contextual internal links for blog copy.
 *
 * 1. Explicit links written as [label](/path) in post text.
 * 2. Automatic links: the first mention of a key topic in a post links to the guide or
 *    page that covers it. Each target is linked at most once per post, never to the post
 *    itself, and the total is capped so articles do not read as link-stuffed.
 */

type AutoLink = { pattern: RegExp; href: string };

const AUTO_LINKS: AutoLink[] = [
  { pattern: /\bLocal Services Ads\b|\bLSAs?\b/, href: "/blog/local-service-ads" },
  { pattern: /\bGoogle Business Profiles?\b/, href: "/blog/google-business-profile-optimization-for-contractors" },
  { pattern: /\bcold emails?\b/i, href: "/blog/cold-email-for-agencies" },
  { pattern: /\bcold[- ]call(ing|s)?\b/i, href: "/blog/cold-calling-contractors-script" },
  { pattern: /\bsubject lines?\b/i, href: "/blog/cold-email-subject-lines-for-contractors" },
  { pattern: /\bowner(?:'s)? names?\b/i, href: "/blog/how-to-find-business-owner-name" },
  { pattern: /\bcost per (lead|booked job)\b/i, href: "/blog/how-much-do-contractor-leads-cost" },
  { pattern: /\bpay[- ]per[- ]lead\b/i, href: "/blog/pay-per-lead-for-contractors" },
  { pattern: /\b(Meta|Facebook) ads\b/i, href: "/blog/facebook-ads-for-contractors" },
  { pattern: /\bGoogle Maps\b/, href: "/blog/google-maps-lead-generation" },
  { pattern: /\b(no|without a|missing) website\b/i, href: "/blog/how-to-find-businesses-without-websites" },
  { pattern: /\blocal SEO\b/i, href: "/blog/how-to-sell-seo-to-contractors" },
  { pattern: /\bApollo\b/, href: "/blog/apollo-vs-google-maps-scraper" },
  { pattern: /\broofers\b|\broofing contractors\b|\broofing compan(y|ies)\b/i, href: "/industries/roofing" },
  { pattern: /\bHVAC (contractors|companies)\b/i, href: "/industries/hvac" },
  { pattern: /\bplumbers\b|\bplumbing compan(y|ies)\b/i, href: "/industries/plumbing" },
  { pattern: /\belectricians\b|\belectrical contractors\b/i, href: "/industries/electrical" },
  { pattern: /\bsolar installers\b|\bsolar compan(y|ies)\b/i, href: "/industries/solar" },
  { pattern: /\blandscapers\b|\blandscaping compan(y|ies)\b/i, href: "/industries/landscaping" },
  { pattern: /\bpainters\b|\bpainting compan(y|ies)\b/i, href: "/industries/painting" },
  { pattern: /\bwarm(ed)?[- ]?up\b|\bwarming up\b|\bdeliverability\b/i, href: "/blog/email-warmup-for-cold-email" },
  { pattern: /\bgeneral contractors?\b|\bGCs\b/i, href: "/blog/general-contractor-leads" },
  { pattern: /\bremodelers\b|\bremodeling (contractors|compan(y|ies))\b/i, href: "/blog/remodeling-contractor-leads" },
  { pattern: /\bpest control (compan(y|ies)|operators?)\b|\bexterminators\b/i, href: "/blog/pest-control-leads" },
  { pattern: /\bconcrete (contractors?|compan(y|ies))\b/i, href: "/blog/concrete-contractor-leads" },
  { pattern: /\bcleaning (compan(y|ies)|business(es)?)\b|\bcleaners\b/i, href: "/blog/cleaning-business-leads" },
  { pattern: /\bGoogle Maps (scrapers?|data extractors?)\b/i, href: "/blog/best-google-maps-scrapers" },
  { pattern: /\bfollow[- ]ups?\b|\bfollowing up\b/i, href: "/blog/cold-email-follow-up" },
  { pattern: /\bflooring (contractors|compan(y|ies)|installers|showrooms)\b/i, href: "/blog/flooring-contractor-leads" },
  { pattern: /\bfenc(e|ing) (contractors?|compan(y|ies)|installers?)\b/i, href: "/blog/fencing-contractor-leads" },
  { pattern: /\bpool (service|cleaning) (compan(y|ies)|business(es)?)\b|\bpool (builders|companies)\b/i, href: "/blog/pool-service-leads" },
  { pattern: /\bgarage door (compan(y|ies)|contractors?|installers?)\b/i, href: "/blog/garage-door-leads" },
  { pattern: /\bCAN-SPAM\b/, href: "/blog/can-spam-cold-email-contractors" },
  { pattern: /\b(SPF|DKIM|DMARC)\b/, href: "/tools/email-deliverability-checker" },
  { pattern: /\blicen[cs]e (lookups?|records?|boards?)\b/i, href: "/blog/contractor-license-lookup-owner-name" },
  { pattern: /\b(bought|purchased|pre-made) (email |contact )?lists?\b/i, href: "/blog/buy-vs-build-contractor-email-list" },
  { pattern: /\bcontractors? (email|mailing|contact) lists?\b/i, href: "/email-lists" },
  { pattern: /\bverified (emails?|email address(es)?)\b/i, href: "/contractor-email-finder" },
  { pattern: /\b10 free leads\b/i, href: "/pricing" },
  { pattern: /\bcost per job( won)?\b|\bbreak-even close rate\b|\breturn on (ad|marketing) spend\b/i, href: "/tools/contractor-lead-cost-calculator" },
  { pattern: /\bstate by state\b|\bby state\b/i, href: "/locations" },
];

const MAX_AUTO_LINKS = 8;

/** Per-post state, created once per page render. */
export type LinkBudget = { used: Set<string>; auto: number; selfHref: string };

export function createLinkBudget(selfHref: string, allText: string[] = []): LinkBudget {
  // Targets the author linked explicitly anywhere in the post are never auto-linked again.
  const used = new Set([selfHref]);
  for (const t of allText) for (const m of t.matchAll(/\[[^\]]+\]\((\/[^)\s]*)\)/g)) used.add(m[1]);
  return { used, auto: 0, selfHref };
}

const linkClass = "font-semibold text-fuchsia-700 underline decoration-fuchsia-200 underline-offset-2 hover:decoration-fuchsia-500";

function autoLink(text: string, budget: LinkBudget, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let k = 0;
  while (rest && budget.auto < MAX_AUTO_LINKS) {
    // Earliest match among link targets not used yet in this post.
    let best: { index: number; length: number; href: string } | null = null;
    for (const a of AUTO_LINKS) {
      if (budget.used.has(a.href)) continue;
      const m = a.pattern.exec(rest);
      if (
        m &&
        (best === null ||
          m.index < best.index ||
          (m.index === best.index && m[0].length > best.length)) // longer phrase wins a tie
      )
        best = { index: m.index, length: m[0].length, href: a.href };
    }
    if (!best) break;
    if (best.index > 0) out.push(rest.slice(0, best.index));
    const label = rest.slice(best.index, best.index + best.length);
    out.push(
      <Link key={`${keyBase}-a${k++}`} href={best.href} className={linkClass}>
        {label}
      </Link>,
    );
    budget.used.add(best.href);
    budget.auto++;
    rest = rest.slice(best.index + best.length);
  }
  if (rest) out.push(rest);
  return out;
}

/** Render post text with explicit [label](/path) links and automatic topic links. */
export function LinkedText({ text, budget, id }: { text: string; budget: LinkBudget; id: string }) {
  const nodes: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(...autoLink(text.slice(last, m.index), budget, `${id}-${k++}`));
    const [, label, href] = m;
    budget.used.add(href); // explicit link counts: do not auto-link the same target again
    nodes.push(
      href === budget.selfHref ? (
        label
      ) : (
        <Link key={`${id}-e${k++}`} href={href} className={linkClass}>
          {label}
        </Link>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(...autoLink(text.slice(last), budget, `${id}-${k++}`));
  return <>{nodes}</>;
}

/** Plain text with [label](/path) markup removed (for meta, JSON-LD, word counts). */
export function stripLinkMarkup(text: string): string {
  return text.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, "$1");
}
