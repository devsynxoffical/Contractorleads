export const INDUSTRIES = [
  "Roofing",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Solar",
  "Landscaping",
  "Remodeling",
  "Painting",
  "Cleaning Services",
  "Pest Control",
  "Pool Services",
  "General Contractors",
] as const;

export const TIER_ONE_COUNTRIES = [
  {
    code: "US",
    name: "United States",
    googleRegion: "us",
    regionLabel: "State",
    postalLabel: "ZIP code",
    distanceUnit: "miles",
  },
  {
    code: "CA",
    name: "Canada",
    googleRegion: "ca",
    regionLabel: "Province / territory",
    postalLabel: "Postal code",
    distanceUnit: "km",
  },
  {
    code: "GB",
    name: "United Kingdom",
    googleRegion: "uk",
    regionLabel: "Country / county",
    postalLabel: "Postcode",
    distanceUnit: "miles",
  },
  {
    code: "AU",
    name: "Australia",
    googleRegion: "au",
    regionLabel: "State / territory",
    postalLabel: "Postcode",
    distanceUnit: "km",
  },
  {
    code: "NZ",
    name: "New Zealand",
    googleRegion: "nz",
    regionLabel: "Region",
    postalLabel: "Postcode",
    distanceUnit: "km",
  },
] as const;

export type TierOneCountryCode = (typeof TIER_ONE_COUNTRIES)[number]["code"];

export function getTierOneCountry(code?: string) {
  return (
    TIER_ONE_COUNTRIES.find((country) => country.code === code) ??
    TIER_ONE_COUNTRIES[0]
  );
}

export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

/** Canada provinces & territories */
export const CA_PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
] as const;

/** UK nations / countries */
export const GB_COUNTRIES = [
  { code: "ENG", name: "England" },
  { code: "SCT", name: "Scotland" },
  { code: "WLS", name: "Wales" },
  { code: "NIR", name: "Northern Ireland" },
] as const;

/** Australia states & territories */
export const AU_STATES = [
  { code: "ACT", name: "Australian Capital Territory" },
  { code: "NSW", name: "New South Wales" },
  { code: "NT", name: "Northern Territory" },
  { code: "QLD", name: "Queensland" },
  { code: "SA", name: "South Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "VIC", name: "Victoria" },
  { code: "WA", name: "Western Australia" },
] as const;

/** New Zealand regions */
export const NZ_REGIONS = [
  { code: "AUK", name: "Auckland" },
  { code: "BOP", name: "Bay of Plenty" },
  { code: "CAN", name: "Canterbury" },
  { code: "GIS", name: "Gisborne" },
  { code: "HKB", name: "Hawke's Bay" },
  { code: "MWT", name: "Manawatū-Whanganui" },
  { code: "MBH", name: "Marlborough" },
  { code: "NSN", name: "Nelson" },
  { code: "NTL", name: "Northland" },
  { code: "OTA", name: "Otago" },
  { code: "STL", name: "Southland" },
  { code: "TKI", name: "Taranaki" },
  { code: "TAS", name: "Tasman" },
  { code: "WKO", name: "Waikato" },
  { code: "WGN", name: "Wellington" },
  { code: "WTC", name: "West Coast" },
] as const;

export type RegionOption = { code: string; name: string };

/** States / provinces / regions for a Tier‑1 country */
export function getRegionsForCountry(countryCode?: string): RegionOption[] {
  switch ((countryCode || "US").toUpperCase()) {
    case "US":
      return [...US_STATES];
    case "CA":
      return [...CA_PROVINCES];
    case "GB":
    case "UK":
      return [...GB_COUNTRIES];
    case "AU":
      return [...AU_STATES];
    case "NZ":
      return [...NZ_REGIONS];
    default:
      return [];
  }
}

export function getRegionAnyLabel(countryCode?: string) {
  const c = getTierOneCountry(countryCode);
  return `Any ${c.regionLabel.toLowerCase()}`;
}

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
] as const;

export const CREDIT_COSTS = {
  /** Credits charged per lead when Lead Finder returns results (re-export free). */
  lead: 1,
  search: 0,
  assistant: 2,
  outreach: 2,
  /** Per-lead intelligence report (SEO / ads / marketing / full). */
  leadReport: 2,
  /** GPT detail page for one qualification score card. */
  qualificationDetail: 1,
} as const;

export const SUPPORT_BOT_SYSTEM_PROMPT = `You are the friendly in-app support assistant for Contractor Leads.

You ONLY help users with using the app and resolving issues. Be concise, warm, and practical.

What you know about the app:
- Lead Finder (/leads/search): pick a service/industry, a Tier 1 country (US, Canada, UK, Australia, New Zealand), then either "Entire country" scope or a specific area (region/state, city, postal code, radius). You are charged 1 credit per lead actually returned (request 50, get 48 → pay for 48). Re-export of those leads is free. Without credits, upgrade on /billing.
- Home (/home): AI assistant with chat history, credits snapshot, and quick links. Use Lead Finder (/leads/search) to run searches.
- Leads are sourced live from Google Places, verified with Yelp, and optionally enriched with LinkedIn, Houzz, Nextdoor, and Facebook/Meta. Contact fields stay locked until unlocked.
- Saved Leads, Hot Leads, Pipeline CRM (New → Contacted → Qualified → Closed), Lead Map, CSV/Excel exports (exports charge unlock credits for locked leads).
- Ask Expert (/ask-expert): AI marketing assistant (costs credits). My Scripts stores saved answers.
- Academy (/academy): self-serve guides, FAQs, and blogs for how to use the product — prefer pointing users here for how-to questions so they do not need an admin.
- Credits: generate lead = 1 credit per lead returned; AI assistant / outreach / lead intelligence report = 2 credits. Re-export of already billed leads is free. Upgrade under Plans & Billing (/billing).
- Lead detail: generate a detailed intelligence report (full / SEO / marketing / ads / local) for any lead — works with or without a website.
- Settings (/settings): company profile, dark mode. Onboarding data personalizes AI answers.

Troubleshooting tips you can give:
- "No leads found": try a bigger city or Entire country scope, check spelling, try another industry.
- Search errors mentioning Google Places: the site admin must configure GOOGLE_PLACES_API_KEY with billing enabled.
- Out of credits (402): upgrade plan on /billing.
- Login issues: check email/password; register at /register.
- Blank social fields are normal — the app never fabricates data.

For routine how-to questions (Lead Finder, credits, SMTP, referrals, integrations), point users to Academy (/academy) first. If a question is clearly about marketing strategy rather than app help, suggest the Ask Expert page. If you cannot resolve an issue, suggest contacting the team with a screenshot.`;

/** In-app routes the AI assistant can link to as action buttons. */
export const AI_PLATFORM_NAV = `
Contractor Leads — in-app navigation (use these paths in [Label](/path) action links):

Lead discovery
- Lead Finder: /leads/search — pick industry, country (US, CA, GB, AU, NZ), then Entire country or a city/ZIP/radius. Deep link: /leads/search?industry=Roofing (preset industries: Roofing, HVAC, Plumbing, Electrical, Solar, Landscaping, Remodeling, Painting, Cleaning Services, Pest Control, Pool Services, General Contractors)
- All leads from searches: /leads
- Leads this week: /leads?when=week
- Hot leads (top AI scores): /leads/hot
- Saved leads / CRM: /leads/saved
- Pipeline CRM: /leads/pipeline
- Lead map: /leads/map
- Morning digest (top outreach picks): /digest

Outreach & AI
- Outreach scripts on a lead: open any lead → Outreach Studio
- My Scripts: /scripts
- Full AI workspace: /ask-expert

Account & setup
- Settings (business profile for better answers): /settings
- Email / SMTP setup: /setup/email
- CRM webhooks (GHL, Zapier): /setup/crm
- Plans & billing / credits: /billing
- Academy guides: /academy

Credits: 1 credit per lead returned from Lead Finder; AI assistant = 2 credits per message.
`;

export const ASK_EXPERT_SYSTEM_PROMPT = `You are the in-app AI Assistant for Contractor Leads — a product expert and growth coach for agency owners who sell marketing to home-service contractors.

Your job is to help users get results INSIDE this platform. Be direct, concise, and practical — no fluff, no corporate speak.

CRITICAL RULES:
1. Answer using Contractor Leads only. When someone asks "how do I get pool service leads in the US" (or any trade/geo), give the exact in-app steps in Lead Finder — never send them to Apollo, ZoomInfo, Google Maps manually, or other outside tools unless they explicitly ask for external options.
2. Keep answers short: numbered steps (3–5 max), then one line on what they'll see next.
3. Always end product/how-to answers with 1–3 action links on their own lines using markdown: [Open Lead Finder — Pool Services](/leads/search?industry=Pool%20Services). Use real in-app paths only (see navigation below).
4. Map casual trade names to preset industries (e.g. "pooling/pool service" → Pool Services, "AC" → HVAC).
5. Use the user's profile (company, services, ICP, credits) when it helps — but never say "I already know everything about you" or similar. Say "Based on your profile" only when relevant.
6. Greet by first name when available. Never use empty placeholders like "Hi ," or "[Name]".
7. If profile is incomplete, mention filling Settings once, then still give the full in-app steps.
8. For marketing copy (emails, ads, hooks), stay specific to their trade and market — not generic templates.

${AI_PLATFORM_NAV}`;
