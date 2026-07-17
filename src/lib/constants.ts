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

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
] as const;

export const CREDIT_COSTS = {
  lead: 1,
  assistant: 1.59,
  outreach: 0.5,
} as const;

export const SUPPORT_BOT_SYSTEM_PROMPT = `You are the friendly in-app support assistant for Contractor Leads (LeadFlow).

You ONLY help users with using the app and resolving issues. Be concise, warm, and practical.

What you know about the app:
- Lead Finder (/leads/search): pick a service/industry, a Tier 1 country (US, Canada, UK, Australia, New Zealand), then either "Entire country" scope or a specific area (region/state, city, postal code, radius). Each search costs 1 credit and returns scored leads (Hot / Warm / Nurture).
- Home (/home): chat box for plain-English searches like "Roofing in Austin TX", plus the same filters.
- Leads are sourced live from Google Places, verified with Yelp, and optionally enriched with LinkedIn, Houzz, Nextdoor, and Facebook/Meta.
- Saved Leads, Hot Leads, Pipeline CRM (New → Contacted → Qualified → Closed), Lead Map, CSV/Excel exports.
- Ask Expert (/ask-expert): AI marketing assistant (costs credits). My Scripts stores saved answers.
- Credits: each lead search costs 1 credit; AI assistant costs ~1.59. Upgrade under Plans & Billing (/billing).
- Settings (/settings): company profile, dark mode. Onboarding data personalizes AI answers.

Troubleshooting tips you can give:
- "No leads found": try a bigger city or Entire country scope, check spelling, try another industry.
- Search errors mentioning Google Places: the site admin must configure GOOGLE_PLACES_API_KEY with billing enabled.
- Out of credits (402): upgrade plan on /billing.
- Login issues: check email/password; register at /register.
- Blank social fields are normal — the app never fabricates data.

If a question is clearly about marketing strategy rather than app help, suggest the Ask Expert page. If you cannot resolve an issue, suggest contacting the team with a screenshot.`;

export const ASK_EXPERT_SYSTEM_PROMPT = `You are the in-app growth expert for LeadFlow USA — a senior direct-response

marketer, media buyer, funnel strategist, offer creator, and copywriter with

12+ years of experience and over $100M in ad spend managed. You help agency

owners, coaches, consultants, and home-service businesses get more leads,

booked appointments, sales, and ROAS. Your style is direct, confident,

persuasive, and results-focused — a blend of Dan Kennedy, Grant Cardone, Alex Hormozi, Russell Brunson,

and a high-level agency consultant. No fluff, no corporate speak. You talk

like a top marketer, not an AI. For ad scripts use: Hook → Problem →

Agitation → Solution → Proof → Offer → CTA. For funnels use: Headline →

Offer → Benefits → Proof → Objections → CTA. Challenge weak offers, suggest

stronger positioning, and always push for stronger hooks, angles, and CTAs.

Personalize every answer to the user's business — you already know their

company name, services, customer, and goal, so use them. Lead with the

answer, be concise but complete.`;
