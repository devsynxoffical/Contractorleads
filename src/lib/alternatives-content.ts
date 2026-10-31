/**
 * Competitor comparison pages (/alternatives/[slug]).
 *
 * Keep every claim about a competitor general and verifiable from its public
 * site. Pricing is described by model (seats, usage, credits) rather than exact
 * figures, which change often; each page tells the reader to check the vendor.
 */

export type AlternativeRow = {
  point: string;
  them: string;
  us: string;
};

export type Alternative = {
  slug: string;
  name: string;
  /** Short category label, e.g. "Google Maps scraping service" */
  category: string;
  website: string;
  titleTag: string;
  metaDescription: string;
  h1: string;
  intro: string;
  keywords: string[];
  /** Where the competitor is genuinely the better fit */
  bestFor: string[];
  /** Where it falls short for agencies prospecting contractors */
  gaps: string[];
  rows: AlternativeRow[];
  pricingNote: string;
  switchSteps: string[];
  faqs: Array<{ q: string; a: string }>;
  relatedIndustries: string[];
  updatedDate?: string;
};

const SHARED_ROWS_TAIL: AlternativeRow[] = [
  {
    point: "AI marketing-gap scoring",
    them: "Not offered",
    us: "Website, SEO, PPC and marketing scores 0 to 100, Hot / Warm / Nurture tiers",
  },
  {
    point: "Meta ad status per business",
    them: "Not offered",
    us: "Checked against the Meta Ads Library on every lead",
  },
  {
    point: "Outreach generation",
    them: "Not offered or generic templates",
    us: "Cold email, SMS and call scripts written from that lead's audit",
  },
  {
    point: "Trades and markets",
    them: "Any category you can query",
    us: "18 home-service trades across the US, Canada, UK, Australia and New Zealand",
  },
  {
    point: "Free start",
    them: "Varies; see vendor",
    us: "10 scored leads free, no credit card; Starter from $19.99 a month for 500 credits",
  },
];

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "outscraper-alternative",
    name: "Outscraper",
    category: "Google Maps scraping service",
    website: "outscraper.com",
    titleTag: "Outscraper Alternative for Contractor Leads With Owner Data",
    metaDescription:
      "Looking for an Outscraper alternative for contractor leads? Compare Outscraper's Maps data export with Contractor Leads' live Google data, owner names, AI scores and outreach.",
    h1: "The Outscraper alternative for agencies that sell to contractors",
    intro:
      "Outscraper is a cloud scraping service that exports Google Maps, reviews and other public data into spreadsheets, priced by usage. It is a capable data tool. Contractor Leads solves a narrower problem: giving agencies and sales teams a ranked, enriched list of home-service contractors with the owner's name, a marketing-gap score, ad status and the first email already drafted.",
    keywords: [
      "outscraper alternative",
      "outscraper alternatives",
      "outscraper vs",
      "google maps scraper alternative",
      "outscraper for lead generation",
    ],
    bestFor: [
      "Bulk exports of Google Maps listings and reviews for any business category",
      "Data teams that want raw rows to process in their own pipeline",
      "One-off research projects where volume matters more than qualification",
    ],
    gaps: [
      "No owner or decision-maker name, so every row still needs a manual lookup",
      "No scoring: an alphabetical export does not tell a rep who to call first",
      "No ad intelligence or outreach, so the research and writing work stays with your team",
      "Scraping the Maps interface sits in a grey area with Google's terms; check them for your use",
    ],
    rows: [
      {
        point: "Data source",
        them: "Scrapes Google Maps and other public sources on request",
        us: "Live Google Places data at search time, cross-checked with Yelp and the business website",
      },
      {
        point: "Owner or decision-maker",
        them: "Not included",
        us: "Read from the business website, left blank when it cannot be verified",
      },
      {
        point: "Output",
        them: "CSV, Excel, JSON and API",
        us: "In-app pipeline, CSV and Excel export, webhooks to GoHighLevel, HubSpot, Zapier, Make and Slack",
      },
      ...SHARED_ROWS_TAIL,
    ],
    pricingNote:
      "Outscraper charges by usage with a free allowance and tiered per-record pricing; check outscraper.com for current rates. Contractor Leads charges one credit per lead returned, with 10 free leads and plans from $19.99 a month.",
    switchSteps: [
      "Export your last Outscraper run for one trade and city",
      "Run the same trade and city in Contractor Leads Lead Finder",
      "Count rows with an owner name, a score and ad status in each file",
      "Push the Hot tier to your CRM and start outreach from Outreach Studio",
    ],
    faqs: [
      {
        q: "Is Contractor Leads a Google Maps scraper like Outscraper?",
        a: "No. Contractor Leads queries live Google Places data inside its own platform and then enriches and scores each business. It is built for agencies prospecting contractors, not for exporting arbitrary categories at bulk.",
      },
      {
        q: "Can I export data from Contractor Leads like I do from Outscraper?",
        a: "Yes. Saved leads export to CSV or Excel on every plan, including the free leads, and Growth and above push leads to your CRM through webhooks.",
      },
      {
        q: "Which is cheaper?",
        a: "For a large raw export, a usage-priced scraper is often cheaper per row. For a list you intend to call, Contractor Leads is usually cheaper per usable lead because the owner lookup, audit and first draft are included.",
      },
    ],
    relatedIndustries: ["roofing", "hvac", "plumbing"],
  },
  {
    slug: "apify-google-maps-scraper-alternative",
    name: "Apify Google Maps Scraper",
    category: "Scraping platform with Google Maps actors",
    website: "apify.com",
    titleTag: "Apify Google Maps Scraper Alternative for Contractor Leads",
    metaDescription:
      "An Apify Google Maps Scraper alternative for agencies: skip actor setup and get live contractor data with owner names, AI scores and outreach scripts. 10 free leads.",
    h1: "The Apify Google Maps Scraper alternative with owner names and scores",
    intro:
      "Apify is a developer platform where you run 'actors', including several Google Maps scrapers, and pay for compute and results. It is flexible and powerful if you are comfortable configuring runs and handling output. Contractor Leads is the no-setup route for agencies: pick a trade and a city, and get scored contractor leads with owner names and a drafted first email.",
    keywords: [
      "apify google maps scraper alternative",
      "apify alternative",
      "apify google maps scraper",
      "google maps scraper api alternative",
      "apify lead generation",
    ],
    bestFor: [
      "Developers who want programmatic scraping with scheduling and an API",
      "Teams that scrape many different sources, not just business listings",
      "Projects that need custom fields or custom post-processing",
    ],
    gaps: [
      "Setup time: choosing an actor, configuring inputs and parsing results before the first lead",
      "No owner enrichment, scoring, ad intelligence or outreach in the raw output",
      "Costs scale with compute and result volume, which is hard to predict for a sales team",
      "Terms-of-service exposure sits with you as the operator of the actor",
    ],
    rows: [
      {
        point: "Setup",
        them: "Choose and configure an actor, manage runs and output",
        us: "Web app; first scored search in minutes",
      },
      {
        point: "Data source",
        them: "Headless-browser scraping of Google Maps",
        us: "Live Google Places data at search time plus Yelp and the business website",
      },
      {
        point: "Owner or decision-maker",
        them: "Not included by default",
        us: "Read from the business website, blank if unverified",
      },
      ...SHARED_ROWS_TAIL,
    ],
    pricingNote:
      "Apify prices by platform usage and per-actor rates with a free tier; see apify.com for the current model. Contractor Leads charges one credit per lead returned, with 10 free leads and plans from $19.99 a month.",
    switchSteps: [
      "Take the output of your last Google Maps actor run for one trade and metro",
      "Run the same search in Contractor Leads",
      "Compare owner names, scores and ad status per row",
      "Keep Apify for custom scraping jobs; use Contractor Leads for the calling list",
    ],
    faqs: [
      {
        q: "Does Contractor Leads have an API like Apify?",
        a: "Yes. API and MCP access are included on Growth and above, and webhooks push leads and status changes to your CRM. The difference is that each record is already enriched and scored.",
      },
      {
        q: "Can I use both?",
        a: "Many agencies do. Apify for broad or custom scraping, Contractor Leads for the day-to-day list of contractors a rep should call, both feeding the same CRM.",
      },
      {
        q: "Which is faster to a first call?",
        a: "Contractor Leads, because the owner name, the gap and the first email are on the lead card. With a scraper the research work begins after the export.",
      },
    ],
    relatedIndustries: ["roofing", "hvac", "general-contractors"],
  },
  {
    slug: "phantombuster-alternative",
    name: "PhantomBuster",
    category: "Social and web automation platform",
    website: "phantombuster.com",
    titleTag: "PhantomBuster Alternative for Contractor Lead Generation",
    metaDescription:
      "A PhantomBuster alternative for agencies prospecting contractors: live Google data, verified owner names, AI lead scores and outreach scripts instead of social automations.",
    h1: "The PhantomBuster alternative built for contractor prospecting",
    intro:
      "PhantomBuster runs automations called 'Phantoms' that extract and act on data from LinkedIn, Google Maps, Instagram and other platforms. It is strong for social-led prospecting of people with active profiles. Most contractors are owner-operators who live on Google Maps and their own website rather than LinkedIn, which is the gap Contractor Leads is built around.",
    keywords: [
      "phantombuster alternative",
      "phantombuster alternatives",
      "phantombuster vs",
      "linkedin automation alternative for local businesses",
      "phantombuster google maps",
    ],
    bestFor: [
      "LinkedIn-centric prospecting where targets have active profiles",
      "Social engagement automations such as follows, likes and connection requests",
      "Teams that chain multiple automations across platforms",
    ],
    gaps: [
      "Contractors are thin on LinkedIn, so social automations miss most of the market",
      "Google Maps extraction returns listing fields only, with no owner name or scoring",
      "Platform automation carries account risk on the networks it touches",
      "No audit-based outreach; messages are templates you write",
    ],
    rows: [
      {
        point: "Primary method",
        them: "Automations on LinkedIn, Maps and social platforms",
        us: "Live Google Places search enriched with the business website and Yelp",
      },
      {
        point: "Owner or decision-maker",
        them: "From LinkedIn when a profile exists",
        us: "From the business website; most contractors have no LinkedIn presence",
      },
      {
        point: "Account risk",
        them: "Automation on third-party networks can trigger restrictions",
        us: "No social automation; sending is from your own mailbox",
      },
      ...SHARED_ROWS_TAIL,
    ],
    pricingNote:
      "PhantomBuster sells monthly plans based on execution time and the number of automation slots; see phantombuster.com for current tiers. Contractor Leads charges one credit per lead returned, with 10 free leads and plans from $19.99 a month.",
    switchSteps: [
      "List the trades and cities you currently target with Phantoms",
      "Run each trade and city in Contractor Leads Lead Finder",
      "Note how many businesses return an owner name without a LinkedIn profile",
      "Move the contractor segment to Contractor Leads and keep PhantomBuster for corporate targets",
    ],
    faqs: [
      {
        q: "Does Contractor Leads automate LinkedIn?",
        a: "No. It finds and scores contractors from live Google data and helps you email, text or call them from your own accounts. Social presence is a filter and a signal, not an automation target.",
      },
      {
        q: "Can I still see which contractors have LinkedIn profiles?",
        a: "Yes. The social presence filter can require a verified LinkedIn profile and active social accounts, and those businesses rank first in results.",
      },
      {
        q: "Is PhantomBuster better for anything in home services?",
        a: "For reaching franchise executives, regional managers or suppliers with active LinkedIn profiles, yes. For owner-operated local contractors, a Google-data tool covers far more of the market.",
      },
    ],
    relatedIndustries: ["roofing", "remodeling", "solar"],
  },
  {
    slug: "zoominfo-alternative",
    name: "ZoomInfo",
    category: "Enterprise B2B contact database",
    website: "zoominfo.com",
    titleTag: "ZoomInfo Alternative for Local Contractor Leads",
    metaDescription:
      "Need a ZoomInfo alternative for small local contractors? Contractor Leads covers owner-run roofing, HVAC and plumbing companies ZoomInfo misses, from $19.99 a month.",
    h1: "The ZoomInfo alternative for agencies selling to local contractors",
    intro:
      "ZoomInfo is an enterprise go-to-market platform with deep company and contact data, intent signals and sales engagement, sold on annual contracts. It is excellent for selling into companies with departments. Owner-run contractors with two to twenty staff are largely outside its coverage and its price point, which is the segment Contractor Leads serves.",
    keywords: [
      "zoominfo alternative",
      "zoominfo alternatives for small business",
      "cheaper alternative to zoominfo",
      "zoominfo alternative for local businesses",
      "zoominfo vs",
    ],
    bestFor: [
      "Enterprise and mid-market B2B sales with named-account strategies",
      "Teams that need intent data, org charts and technographics",
      "Companies with budget for annual seat-based contracts",
    ],
    gaps: [
      "Thin coverage of small owner-operated contractors",
      "Annual seat pricing is out of reach for most agencies prospecting local trades",
      "No marketing-gap scoring, review signals or Meta ad status for a local business",
      "No outreach written from a specific contractor's digital footprint",
    ],
    rows: [
      {
        point: "Data model",
        them: "Companies, contacts, intent and technographics",
        us: "Local businesses with owner, reputation, marketing scores and ad status",
      },
      {
        point: "Coverage of owner-run contractors",
        them: "Limited",
        us: "Every business listed on Google in the trade and area you search",
      },
      {
        point: "Contract",
        them: "Annual, seat-based",
        us: "Monthly or annual, cancel anytime",
      },
      ...SHARED_ROWS_TAIL,
    ],
    pricingNote:
      "ZoomInfo pricing is quote-based on annual contracts; see zoominfo.com. Contractor Leads publishes its prices: 10 free leads, then $19.99, $49 or $99 a month, with Enterprise on request.",
    switchSteps: [
      "Identify which of your targets are local contractors rather than corporate accounts",
      "Run those trades and metros in Contractor Leads",
      "Compare owner-name coverage against your current database export",
      "Keep ZoomInfo for enterprise accounts if you have them; move local prospecting to Contractor Leads",
    ],
    faqs: [
      {
        q: "Is Contractor Leads a full ZoomInfo replacement?",
        a: "Only if your targets are home-service contractors. For enterprise B2B accounts with org charts and intent data, ZoomInfo or a similar database remains the right tool.",
      },
      {
        q: "Does Contractor Leads have intent data?",
        a: "Not in the enterprise sense. It has practical buying signals for a contractor: weak website, poor local rankings, no Local Services Ads, Meta ad activity and review velocity.",
      },
      {
        q: "Can I get a trial?",
        a: "Every new account gets 10 free scored leads with no credit card, and paid plans are monthly with no annual commitment.",
      },
    ],
    relatedIndustries: ["general-contractors", "hvac", "electrical"],
  },
  {
    slug: "lusha-alternative",
    name: "Lusha",
    category: "B2B contact enrichment tool",
    website: "lusha.com",
    titleTag: "Lusha Alternative for Contractor and Home-Service Leads",
    metaDescription:
      "A Lusha alternative for agencies that sell to contractors: find the business first from live Google data, then get owner names, marketing scores and outreach. 10 free leads.",
    h1: "The Lusha alternative that finds the contractor, not just the contact",
    intro:
      "Lusha is a contact enrichment tool: you find a person on LinkedIn or a company site and Lusha supplies the phone or email, sold in monthly credits. It is useful once you know who you are looking for. Contractor Leads starts a step earlier for home services, finding every contractor in a trade and area, scoring the marketing gap, and only then surfacing the owner.",
    keywords: [
      "lusha alternative",
      "lusha alternatives",
      "lusha vs",
      "contact enrichment alternative for local businesses",
      "lusha for small business leads",
    ],
    bestFor: [
      "Enriching known B2B contacts with direct dials and work emails",
      "Browser-extension workflows on LinkedIn",
      "Sales teams with a list already built",
    ],
    gaps: [
      "Does not build the list; you still need to find the contractors",
      "Relies on professional profiles that most contractors do not maintain",
      "No scoring, reputation signals or ad intelligence",
      "No outreach generation",
    ],
    rows: [
      {
        point: "Starting point",
        them: "A known person or company",
        us: "A trade and a market; Contractor Leads finds the businesses",
      },
      {
        point: "Owner or decision-maker",
        them: "Enriched from professional profiles",
        us: "Read from the business website; blank if unverified",
      },
      {
        point: "Business-level signals",
        them: "Company firmographics",
        us: "Rating, review velocity, website and SEO scores, ad status",
      },
      ...SHARED_ROWS_TAIL,
    ],
    pricingNote:
      "Lusha sells monthly credit bundles with a free tier; see lusha.com. Contractor Leads charges one credit per lead returned, with 10 free leads and plans from $19.99 a month.",
    switchSteps: [
      "Pick one trade and metro you enrich today",
      "Run it in Contractor Leads and note owner-name coverage",
      "Compare the first-touch quality using Outreach Studio drafts",
      "Use Lusha only where a contractor's owner is missing and has a professional profile",
    ],
    faqs: [
      {
        q: "Does Contractor Leads provide owner emails and phones?",
        a: "It provides the business phone from Google and the owner's name and contact details when they appear on the business website. Fields that cannot be verified are left blank.",
      },
      {
        q: "Can I combine Lusha and Contractor Leads?",
        a: "Yes. Build and score the list in Contractor Leads, then enrich any remaining gaps with Lusha where the owner has a professional profile.",
      },
      {
        q: "Which is better for cold calling contractors?",
        a: "Contractor Leads, because the call script is generated from the business's own audit and the owner's name is on the card.",
      },
    ],
    relatedIndustries: ["plumbing", "electrical", "painting"],
  },
  {
    slug: "d7-lead-finder-alternative",
    name: "D7 Lead Finder",
    category: "Local business lead finder",
    website: "d7leadfinder.com",
    titleTag: "D7 Lead Finder Alternative With AI Scoring and Owner Names",
    metaDescription:
      "Comparing D7 Lead Finder alternatives? Contractor Leads adds AI marketing-gap scores, verified owner names, Meta ad status and outreach scripts to local contractor data.",
    h1: "The D7 Lead Finder alternative for agencies that sell to contractors",
    intro:
      "D7 Lead Finder is a popular tool for agencies that want local business lists by keyword and city, with basic website and social checks. It is close in spirit to Contractor Leads. The difference is depth: Contractor Leads specialises in home-service trades, pulls live Google data, scores each business on four marketing dimensions, finds the owner from the business website, checks Meta ads and writes the outreach.",
    keywords: [
      "d7 lead finder alternative",
      "d7 lead finder alternatives",
      "d7 lead finder vs",
      "local business lead finder for agencies",
      "d7 lead finder review",
    ],
    bestFor: [
      "Quick keyword-plus-city lists across any local business category",
      "Agencies that only need surface-level website and social checks",
      "Low-cost daily search quotas",
    ],
    gaps: [
      "Generic across categories, so trade-specific signals and angles are missing",
      "Owner or decision-maker names are not the focus",
      "No AI scoring that ranks who to call first by marketing gap",
      "No audit-based outreach or Meta ad intelligence",
    ],
    rows: [
      {
        point: "Focus",
        them: "Any local business category",
        us: "18 home-service trades with trade-specific scoring and angles",
      },
      {
        point: "Owner or decision-maker",
        them: "Limited",
        us: "Read from the business website; blank if unverified",
      },
      {
        point: "Website analysis",
        them: "Basic presence and platform checks",
        us: "Website score 0 to 100 plus SEO and PPC opportunity scores",
      },
      ...SHARED_ROWS_TAIL,
    ],
    pricingNote:
      "D7 Lead Finder sells monthly plans with daily search limits; see d7leadfinder.com. Contractor Leads charges one credit per lead returned, with 10 free leads and plans from $19.99 a month.",
    switchSteps: [
      "Run the same trade and city in both tools",
      "Compare owner-name coverage and the depth of website analysis",
      "Sort Contractor Leads results by the score that matches your service",
      "Push the Hot tier to your CRM and send the first Outreach Studio email",
    ],
    faqs: [
      {
        q: "How is Contractor Leads different from D7 Lead Finder?",
        a: "Contractor Leads is specialised for home-service trades and goes deeper on each lead: four marketing scores, owner enrichment, Meta ad status and generated outreach. D7 is broader across categories with lighter checks.",
      },
      {
        q: "Does Contractor Leads cover non-contractor businesses?",
        a: "No. It covers 18 home-service trades such as roofing, HVAC, plumbing, electrical, solar and remodeling. For restaurants or dentists, a general local lead finder is the right tool.",
      },
      {
        q: "Is there a daily search limit?",
        a: "Limits are credit-based rather than daily. One credit equals one lead returned, with 500, 2,000 or 5,000 credits a month depending on plan.",
      },
    ],
    relatedIndustries: ["roofing", "hvac", "plumbing", "landscaping"],
  },
  {
    slug: "uplead-alternative",
    name: "UpLead",
    category: "B2B contact database",
    website: "uplead.com",
    titleTag: "UpLead Alternative for Local Contractor Leads",
    metaDescription:
      "An UpLead alternative for agencies prospecting roofers, HVAC and plumbers: live Google business data, owner names, AI lead scores and outreach scripts. Start with 10 free leads.",
    h1: "The UpLead alternative for agencies prospecting local contractors",
    intro:
      "UpLead is a B2B database with verified work emails, technographics and intent data, sold in monthly credits. It performs well for companies with employees online. Owner-run contractors rarely appear with the depth a database needs, so agencies selling to them are better served by a tool that starts from Google business data and the contractor's own website.",
    keywords: [
      "uplead alternative",
      "uplead alternatives",
      "uplead vs",
      "b2b database alternative for local contractors",
      "uplead for small business leads",
    ],
    bestFor: [
      "B2B prospecting into companies with verified work emails",
      "Technographic and intent-based targeting",
      "Teams that need real-time email verification at scale",
    ],
    gaps: [
      "Coverage of small local contractors is thin",
      "No reputation, website or ad signals for a local business",
      "No scoring tied to the services an agency sells",
      "No outreach written from a specific business's audit",
    ],
    rows: [
      {
        point: "Data model",
        them: "Company and contact records with verification",
        us: "Local businesses with owner, scores, reputation and ad status",
      },
      {
        point: "Coverage of owner-run contractors",
        them: "Limited",
        us: "Every business listed on Google in the trade and area you search",
      },
      {
        point: "Email verification",
        them: "Real-time verification on export",
        us: "Owner details shown only when verified on the business site; blank otherwise",
      },
      ...SHARED_ROWS_TAIL,
    ],
    pricingNote:
      "UpLead sells monthly credit plans with a trial; see uplead.com. Contractor Leads charges one credit per lead returned, with 10 free leads and plans from $19.99 a month.",
    switchSteps: [
      "Export your contractor segment from UpLead",
      "Run the same trades and metros in Contractor Leads",
      "Compare how many businesses return an owner name and a score",
      "Move contractor prospecting to Contractor Leads; keep UpLead for corporate B2B",
    ],
    faqs: [
      {
        q: "Does Contractor Leads verify emails like UpLead?",
        a: "It shows owner contact details only when they can be verified on the business website and leaves the field blank otherwise. A built-in email verifier is available for lists you upload.",
      },
      {
        q: "Who should keep UpLead?",
        a: "Agencies selling to companies with departments, where work emails and technographics matter. For local contractors, Contractor Leads covers more of the market.",
      },
      {
        q: "How quickly can I test it?",
        a: "Sign up, pick a trade and a city, and your first 10 scored leads are free with no credit card.",
      },
    ],
    relatedIndustries: ["hvac", "solar", "general-contractors"],
  },
];

export function getAlternative(slug: string) {
  return ALTERNATIVES.find((a) => a.slug === slug) ?? null;
}
