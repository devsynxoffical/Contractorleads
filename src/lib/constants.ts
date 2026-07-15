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
