import { ADMIN_PLANS, PLAN_MONTHLY_CREDITS, STARTER_FREE_LEADS } from "@/lib/plans";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";

/**
 * Site-wide FAQ, written in plain natural language so that search engines and
 * AI answer engines can quote each answer on its own. Every answer:
 *  - restates the subject in the first sentence (no "it" / "this" openers),
 *  - gives the concrete number or fact first,
 *  - stays under ~70 words.
 * Rendered on /faq with FAQPage JSON-LD and reused by other pages.
 */

export type FaqItem = { q: string; a: string };
export type FaqGroup = { id: string; title: string; items: FaqItem[] };

const starter = ADMIN_PLANS.find((p) => p.value === "starter")?.priceMonthly ?? 19.99;
const growth = ADMIN_PLANS.find((p) => p.value === "growth")?.priceMonthly ?? 49;
const agency = ADMIN_PLANS.find((p) => p.value === "agency")?.priceMonthly ?? 99;

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "product",
    title: "What Contractor Leads is",
    items: [
      {
        q: "What is Contractor Leads?",
        a: "Contractor Leads is prospecting software for marketing agencies, media buyers and sales teams that sell services to home-service contractors. Contractor Leads finds contractors from live Google data, scores each one on website, SEO, PPC and marketing gaps, adds the owner's name and Meta ad status, and writes the first outreach email.",
      },
      {
        q: "Who is Contractor Leads for?",
        a: "Contractor Leads is for businesses that sell to contractors: marketing agencies, PPC and SEO shops, web designers, software vendors and appointment-setting teams. Contractor Leads is not a marketplace for homeowners looking to hire a roofer or plumber, and it does not sell homeowner leads to contractors.",
      },
      {
        q: "Which trades does Contractor Leads cover?",
        a: `Contractor Leads covers ${INDUSTRIES.length} home-service trades: ${INDUSTRIES.join(", ")}. Users can also type a custom service, and can search two audience presets, Agency Owners and E-commerce Brands.`,
      },
      {
        q: "Which countries does Contractor Leads cover?",
        a: `Contractor Leads covers ${TIER_ONE_COUNTRIES.length} countries: ${TIER_ONE_COUNTRIES.map((c) => c.name).join(", ")}. A search can target one country, a region, a city, a postal code, a radius, or all five countries at once with the Any Country option.`,
      },
    ],
  },
  {
    id: "data",
    title: "Where the data comes from",
    items: [
      {
        q: "Where does Contractor Leads get its data?",
        a: "Contractor Leads pulls each business from Google Places at the moment a search runs, then cross-checks it with Yelp and the contractor's own website. Nothing comes from a resold lead list. If a field such as an owner name or email cannot be verified, Contractor Leads leaves that field blank instead of guessing.",
      },
      {
        q: "How does Contractor Leads find the owner's name?",
        a: "Contractor Leads reads the owner's name from the contractor's own website, such as the About or Team page, and cross-checks it before showing it. Owner names are never generated from email patterns or guessed, and a lead with no verifiable owner shows an empty owner field.",
      },
      {
        q: "What do the AI lead scores mean?",
        a: "Every lead gets four scores from 0 to 100: Website, SEO, PPC and overall Marketing opportunity. A low Website score means the site is slow or missing, a low SEO score means weak local rankings, and a low PPC score means little or no paid presence. Leads are grouped into Hot, Warm and Nurture tiers so agencies call the biggest gaps first.",
      },
      {
        q: "What is Meta Ads Intel?",
        a: "Meta Ads Intel checks the Facebook Ads Library for each lead and shows whether the contractor is currently running Facebook or Instagram ads. Agencies use it to pitch paid social to non-advertisers and creative or landing-page fixes to active advertisers. Users can also search the Ads Library by exact Facebook Page name.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing and credits",
    items: [
      {
        q: "Is Contractor Leads free to try?",
        a: `Yes. Every new Contractor Leads account gets ${STARTER_FREE_LEADS} free scored leads with no credit card. Paid plans start after the free leads are used.`,
      },
      {
        q: "How much does Contractor Leads cost?",
        a: `Contractor Leads has three self-serve plans: Starter at $${starter} a month for ${PLAN_MONTHLY_CREDITS.starter} credits, Growth at $${growth} a month for ${PLAN_MONTHLY_CREDITS.growth.toLocaleString()} credits, and Agency at $${agency} a month for ${PLAN_MONTHLY_CREDITS.agency.toLocaleString()} credits. Enterprise pricing is custom. Annual billing lowers the monthly price by up to 25 percent.`,
      },
      {
        q: "How do credits work in Contractor Leads?",
        a: "One credit equals one lead returned by a search. If a search asks for 50 leads and returns 48, the account is charged 48 credits. Re-exporting leads already found is free. The AI assistant and outreach generation use a small number of credits per request, listed on the pricing page.",
      },
      {
        q: "Can I cancel Contractor Leads at any time?",
        a: "Yes. Contractor Leads plans are month to month unless annual billing is chosen, and users can upgrade, downgrade or cancel from Plans and Billing inside the app. Exported leads and saved lists stay with the account.",
      },
    ],
  },
  {
    id: "outreach",
    title: "Email, SMS and outreach",
    items: [
      {
        q: "Does Contractor Leads send emails for me?",
        a: "Contractor Leads sends outreach from the user's own mailbox, such as Gmail, Outlook or any SMTP account, so replies land in the inbox the user already checks. Email and SMS sending require the Messaging add-on at $15.50 a month, which unlocks one-to-one email, bulk email, sequences, campaigns and Twilio SMS.",
      },
      {
        q: "Do replies thread correctly in Gmail?",
        a: "Yes. Contractor Leads sets the In-Reply-To and References headers and keeps the original subject on replies and follow-ups, so a sequence shows as one conversation in Gmail or Outlook rather than separate emails.",
      },
      {
        q: "Does Contractor Leads verify email addresses?",
        a: "Yes. The Email Verifier checks syntax, disposable domains, typos, MX records and mailbox acceptance, and marks each address as valid, risky or invalid. Catch-all domains are reported as risky rather than valid, and only addresses marked valid count as verified in segments.",
      },
      {
        q: "What does Outreach Studio generate?",
        a: "Outreach Studio writes a cold email, an SMS and a call script for a specific lead using that lead's own audit, so the first sentence names the real gap, such as a slow site or no Local Services Ads. Winners can be saved to the Scripts library and reused.",
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations and exports",
    items: [
      {
        q: "Does Contractor Leads integrate with GoHighLevel or HubSpot?",
        a: "Yes. On the Growth plan and above, Contractor Leads pushes saved leads and status changes to GoHighLevel, HubSpot, Zapier, Make, Slack or any custom webhook. CSV and Excel export are available on every plan, including the free leads.",
      },
      {
        q: "Does Contractor Leads have an API?",
        a: "Yes. API and MCP access are included on Growth and above, with rate limits that rise by plan. Agency and Enterprise also include team seats, client reports and SSO options.",
      },
    ],
  },
  {
    id: "affiliates",
    title: "Affiliate program",
    items: [
      {
        q: "Does Contractor Leads have an affiliate program?",
        a: "Yes. Contractor Leads affiliates earn a 30 percent recurring cash commission on every eligible sale and renewal made by customers who sign up through their referral link. Attribution uses a 30-day cookie, and the affiliate dashboard shows sign-ups, sales, revenue, commission and payouts.",
      },
      {
        q: "When do Contractor Leads affiliates get paid?",
        a: "Contractor Leads affiliates can request a payout once their payable commission balance reaches $500. Payouts are made by PayPal, bank transfer or another agreed method, and pending and completed payouts are listed in the affiliate dashboard.",
      },
    ],
  },
  {
    id: "company",
    title: "Company",
    items: [
      {
        q: "Who owns Contractor Leads?",
        a: "Contractor Leads is built and operated by Vaishali Media Productions LLC, registered at 30 N Gould St # 58138, Sheridan, Wyoming 82801, United States. The founder is Vaishali Kapoor. Contact is hello@contractorleads.us.",
      },
    ],
  },
];

export const ALL_FAQS: FaqItem[] = FAQ_GROUPS.flatMap((g) => g.items);
