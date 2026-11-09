import type { LandingPage } from "@/lib/landing-pages";

/**
 * "[Trade] email list" pages (/email-lists and /email-lists/[trade]).
 *
 * Competitors (Prospeo, Orbital, ByteScraper, BizKonnect) rank for "hvac email list",
 * "roofing contractor email list" and similar with list-selling pages. These pages answer
 * the same search honestly: Contractor Leads does not sell a static list, it builds a
 * fresh, verified one from live Google data for the trade and area you choose.
 *
 * Each trade page carries trade-specific segments, buyers, licensing context, timing,
 * state links and FAQs, so the pages are not one template with the trade name swapped.
 * No record counts or accuracy rates are claimed: the size of a list depends on the
 * area searched, and we do not publish numbers we cannot back up.
 */

type TradeListInput = {
  slug: string;
  /** "Roofing" */
  name: string;
  /** "roofing contractor" (singular, lower case) */
  noun: string;
  /** "roofing companies" */
  plural: string;
  /** Short owner word: "roofers", "HVAC owners" */
  people: string;
  titleTag: string;
  metaDescription: string;
  secondaryKeywords: string[];
  quickAnswerExtra: string;
  segments: string[][];
  buyers: string[];
  license: string;
  timing: string;
  contactHabits: string;
  states: Array<[string, string]>;
  faqs: Array<{ q: string; a: string }>;
};

const PARENT = { name: "Contractor email lists", path: "/email-lists" };

function buyVsBuild(t: TradeListInput) {
  return {
    heading: `Buying a ${t.noun} email list vs building one`,
    body: `Most "${t.name.toLowerCase()} email list" results sell a spreadsheet compiled weeks or months earlier. Contractor Leads works the other way: you choose the area, it pulls the ${t.plural} listed on Google today, finds the owner and checks every address before you export. Our [buy vs build guide](/blog/buy-vs-build-contractor-email-list) covers the trade-offs in detail.`,
    table: {
      headers: ["", "Bought list", "Built in Contractor Leads"],
      rows: [
        ["Freshness", "A snapshot from when it was compiled", "Pulled from live Google data when you search"],
        ["Coverage", "Fixed regions chosen by the seller", "Any city, county, state or radius you pick"],
        ["Owner names", "Often missing or out of date", "Found from the website and public sources where they can be verified"],
        ["Email checks", "Rarely re-checked before delivery", "Every email labelled safe, catch-all, role-based or invalid"],
        ["Marketing context", "Contact fields only", "Rating, reviews, website and ad signals, AI gap scores"],
        ["Cost model", "Per list or per record, paid up front", "1 credit per lead, 10 free leads to start"],
      ],
    },
  };
}

function fields(t: TradeListInput) {
  return {
    heading: `What each ${t.noun} record includes`,
    body: `Every row is a real business, not a guessed address. Fields that cannot be confirmed are left blank instead of filled with a pattern guess.`,
    table: {
      headers: ["Field", "Why it matters"],
      rows: [
        ["Business name, address, phone, website", "From the company's Google listing"],
        ["Owner or decision-maker name", "So you write to a person, not info@"],
        ["Email with verification status", "Send only to addresses likely to arrive"],
        ["Google rating and review count", "Size up the business before you call"],
        ["AI website, SEO, PPC and marketing scores", "Find the gap to open with"],
        ["Meta ad status", "Know whether they already advertise"],
      ],
    },
  };
}

function howTo(t: TradeListInput) {
  return {
    heading: `How to build a ${t.noun} email list in five steps`,
    body: `The whole process runs inside Contractor Leads and takes minutes for a city-sized list.`,
    bullets: [
      `Pick ${t.name} as the trade and choose a market: a city, a county, a radius or a whole state (see the [${t.name.toLowerCase()} leads hub](/industries/${t.slug}))`,
      `Filter by rating, review count and AI scores to keep the ${t.plural} that fit your offer`,
      "Run owner enrichment to add decision-maker names and emails where they can be verified",
      "Export only emails marked safe, or keep catch-all addresses in a separate, slower campaign",
      "Send from a warmed-up mailbox in small daily batches, with a clear opt-out in every email",
    ],
  };
}

function compliance(t: TradeListInput) {
  return {
    heading: `Emailing ${t.people} legally`,
    body: `In the US, cold email to businesses is allowed under the CAN-SPAM Act when you identify yourself honestly, use an accurate subject line, include a physical postal address and honour opt-outs within 10 business days. The rules apply to every email you send, so build them into the template rather than the list. Our [CAN-SPAM guide for contractor outreach](/blog/can-spam-cold-email-contractors) has a checklist. Outside the US, Canada (CASL), the UK and the EU have stricter rules.`,
    callout: {
      title: "Keep bounces low",
      text: "Send to safe emails first. Bounce rates above a few percent hurt the reputation of the mailbox you send from, which pushes later emails toward spam.",
    },
  };
}

function tradePage(t: TradeListInput): LandingPage {
  const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  const stateLinks = t.states.map(([slug, name]) => `[${t.plural} in ${name}](/industries/${t.slug}/${slug})`);
  return {
    slug: `email-lists/${t.slug}`,
    kind: "product",
    serviceType: `${cap(t.noun)} email list`,
    primaryKeyword: `${t.noun} email list`,
    secondaryKeywords: t.secondaryKeywords,
    titleTag: t.titleTag,
    metaDescription: t.metaDescription,
    breadcrumb: `${t.name} email list`,
    parent: PARENT,
    eyebrow: `${t.name} email list`,
    h1: `${cap(t.noun)} email list, built fresh and verified`,
    heroDescription: `Build a ${t.noun} email list for any area from live Google data, with owner names and every email checked before you send.`,
    quickAnswer: {
      q: `How do I get a ${t.noun} email list?`,
      a: `Choose ${t.name} and an area in Contractor Leads. It pulls the ${t.plural} listed on Google there, finds owner names and emails from their websites and public sources, and labels every address safe, catch-all, role-based or invalid. ${t.quickAnswerExtra}`,
    },
    intro: `A ${t.noun} email list is only as good as the day it was made. Contractor Leads builds yours when you need it: the ${t.plural} on Google in the area you choose, the owner behind each one where it can be confirmed, and an email checked before it reaches your campaign. You start with 10 free leads and pay 1 credit per lead after that.`,
    sections: [
      buyVsBuild(t),
      fields(t),
      {
        heading: `${t.name} segments worth separating`,
        body: `${t.name} is not one market. Splitting your list by segment lets you write a first line that fits the business.`,
        table: { headers: ["Segment", "What to know before you email"], rows: t.segments },
      },
      {
        heading: `Who uses a ${t.noun} email list`,
        body: `Teams that sell to ${t.plural} use these lists for outbound email, calling and direct mail.`,
        bullets: t.buyers,
      },
      howTo(t),
      {
        heading: `Licensing, timing and how ${t.people} read email`,
        body: `${t.license} ${t.timing} ${t.contactHabits}`,
      },
      {
        heading: `${cap(t.plural)} by state`,
        body: `Start with a state page to see the market, then search any city in it: ${stateLinks.join(", ")}.`,
      },
      compliance(t),
    ],
    faqs: [
      {
        q: `Can I buy a ${t.noun} email list from Contractor Leads?`,
        a: `We do not sell a pre-made list. You build your own from live Google data for the area you choose, which keeps it current and limited to the ${t.plural} you actually want. Your first 10 leads are free, then each lead costs 1 credit, and you can export to CSV or Excel at any time.`,
      },
      {
        q: `How accurate are the ${t.noun} emails?`,
        a: `Every email is checked and labelled safe, catch-all, role-based or invalid before you export, and owner names are only added when they can be matched to the business. You decide which statuses to send to; most teams send to safe emails first and keep catch-all addresses for a slower follow-up campaign.`,
      },
      ...t.faqs,
      {
        q: `Can I email ${t.people} without their permission?`,
        a: `In the US, CAN-SPAM allows business cold email without prior consent if you use honest sender details and subject lines, include a postal address and process opt-outs within 10 business days. Canada, the UK and the EU have stricter consent rules. Take legal advice for your market before a large campaign.`,
      },
    ],
    related: [
      { href: "/email-lists", label: "All contractor email lists" },
      { href: `/industries/${t.slug}`, label: `${cap(t.noun)} leads` },
      { href: "/contractor-email-finder", label: "Contractor email finder" },
      { href: "/blog/buy-vs-build-contractor-email-list", label: "Buy vs build an email list" },
      { href: "/blog/can-spam-cold-email-contractors", label: "CAN-SPAM for contractor outreach" },
      { href: "/pricing", label: "Pricing and free leads" },
    ],
    cta: { href: "/register", label: `Build a ${t.name.toLowerCase()} list free` },
    ctaBand: {
      title: `Build your ${t.noun} email list today`,
      description: `Pick an area, add owner names and verified emails, and export. Your first 10 leads are free, no card needed.`,
    },
  };
}

const TRADES: TradeListInput[] = [
  {
    slug: "roofing",
    name: "Roofing",
    noun: "roofing contractor",
    plural: "roofing companies",
    people: "roofers",
    titleTag: "Roofing Contractor Email List: Fresh and Verified",
    metaDescription: "Build a roofing contractor email list for any city or state from live Google data, with owner names and every email verified. Start with 10 free leads.",
    secondaryKeywords: ["roofing company email list", "roofers email list", "list of roofing companies", "roofing contractors list"],
    quickAnswerExtra: "Export the safe emails to CSV or Excel and send from a warmed-up mailbox.",
    segments: [
      ["Residential replacement", "Owner-run, high-ticket jobs; they care about lead flow and reviews"],
      ["Storm and insurance restoration", "Demand spikes after hail and wind; timing beats everything"],
      ["Commercial and flat roofing", "Longer sales cycles; bids, property managers and maintenance contracts"],
      ["Metal roofing specialists", "Smaller niche with premium pricing and a strong story to market"],
      ["Repair-only and gutters", "Smaller tickets; often family businesses with little marketing"],
    ],
    buyers: [
      "Marketing agencies selling SEO, Local Services Ads and storm landing pages",
      "Roofing material distributors and manufacturers' reps",
      "Aerial measurement, estimating and CRM software companies",
      "Financing providers and insurance-claims software",
      "Recruiters and staffing firms hiring crews and project managers",
    ],
    license: "Roofing licensing varies a lot by state: some states license roofers directly (Florida and Arizona do, and California uses a specialty roofing classification), while others, such as Texas, have no statewide roofing license and leave it to cities. Where a state license exists, the license record is a good way to confirm the owner's name.",
    timing: "Roofers are easiest to reach before storm season and in the quieter winter months; after a big storm they are on roofs all day and inbox replies drop.",
    contactHabits: "Many owner-run roofers use a Gmail or Outlook address listed on their website or Google profile, which is why a domain-only email finder often misses them.",
    states: [["texas", "Texas"], ["florida", "Florida"], ["georgia", "Georgia"], ["north-carolina", "North Carolina"], ["colorado", "Colorado"], ["oklahoma", "Oklahoma"]],
    faqs: [
      {
        q: "How many roofing companies can I find in one search?",
        a: "It depends on the area. A single city returns the roofers listed on Google there, and a state search covers many more. Because you pay per lead, you can start with a small area, check the quality and then widen the search. Results can be filtered by rating, reviews and AI scores before you spend credits on enrichment.",
      },
      {
        q: "Can I target storm-hit areas with a roofing email list?",
        a: "Yes. Search the counties or cities affected by a storm and build a list for just that area. Restoration roofers there are busy, so short, specific emails and a follow-up a week or two later usually work better than a long pitch on day one.",
      },
    ],
  },
  {
    slug: "hvac",
    name: "HVAC",
    noun: "HVAC contractor",
    plural: "HVAC companies",
    people: "HVAC owners",
    titleTag: "HVAC Contractor Email List: Owner Emails, Verified",
    metaDescription: "Build an HVAC contractor email list from live Google data: heating and AC companies with owner names and verified emails, for any area. 10 free leads.",
    secondaryKeywords: ["hvac email list", "hvac company email list", "hvac contractors list", "list of hvac companies"],
    quickAnswerExtra: "Filter by reviews and AI scores to reach the owner-run shops most likely to buy.",
    segments: [
      ["Residential service and replacement", "The core market: repair calls, system replacements and maintenance plans"],
      ["Commercial and mechanical", "Rooftop units, service agreements with facilities; more managers between you and the owner"],
      ["New construction HVAC", "Work through builders and GCs; volume depends on local building activity"],
      ["Heat pump and ductless specialists", "Growing niche tied to electrification and rebate programmes"],
      ["Refrigeration", "Restaurants and grocery clients; emergency-driven service"],
    ],
    buyers: [
      "Marketing agencies selling Google Ads, Local Services Ads and maintenance-plan campaigns",
      "HVAC equipment distributors and manufacturers' reps",
      "Field service management, dispatch and call-tracking software",
      "Consumer financing and warranty providers",
      "Trade schools and recruiters hiring technicians",
    ],
    license: "Most states license HVAC contractors (Texas through TDLR, California with a warm-air heating and AC classification, Florida with Class A and B air-conditioning licenses), and technicians who handle refrigerant need federal EPA Section 608 certification. State license lookups often show the license holder, which helps confirm the owner.",
    timing: "HVAC owners plan before each peak: late winter and spring ahead of cooling season, and late summer ahead of heating season. During heat waves and cold snaps they rarely answer outreach.",
    contactHabits: "Established shops often route email through an office manager, so the owner's direct address is worth the extra enrichment step.",
    states: [["texas", "Texas"], ["florida", "Florida"], ["arizona", "Arizona"], ["california", "California"], ["georgia", "Georgia"], ["north-carolina", "North Carolina"]],
    faqs: [
      {
        q: "Should I separate residential and commercial HVAC companies?",
        a: "Yes. Residential shops respond to messages about calls, reviews and maintenance plans, while commercial mechanical contractors care about bids, service agreements and technician capacity. Build two lists and write a different first line for each, using reviews and website signals to tell them apart.",
      },
      {
        q: "When is the best time to email HVAC contractors?",
        a: "Before the busy seasons: roughly February to April before cooling season and August to September before heating season. Avoid the first days of a heat wave or cold snap, when owners and technicians are fully booked and unlikely to read sales email.",
      },
    ],
  },
  {
    slug: "plumbing",
    name: "Plumbing",
    noun: "plumbing contractor",
    plural: "plumbing companies",
    people: "plumbers",
    titleTag: "Plumbing Contractor Email List: Fresh and Verified",
    metaDescription: "Build a plumbing contractor email list for any area from live Google data, with owner names and verified emails ready to export. Start with 10 free leads.",
    secondaryKeywords: ["plumber email list", "plumbing company email list", "list of plumbing companies", "plumbers list"],
    quickAnswerExtra: "Separate emergency service shops from drain and new-construction specialists before you write.",
    segments: [
      ["Service and repair", "Emergency calls and urgent jobs; speed-to-answer and reviews matter most"],
      ["Drain, sewer and hydro-jetting", "Equipment-heavy, high-margin work with strong search demand"],
      ["Water heaters and repiping", "Replacement jobs with clear pricing; good for ad campaigns"],
      ["New construction plumbing", "Work through builders; relationships matter more than search"],
      ["Commercial plumbing", "Facilities, restaurants and property managers; contracts and compliance"],
    ],
    buyers: [
      "Marketing agencies selling emergency-plumber SEO, Google Ads and Local Services Ads",
      "Plumbing supply houses and manufacturers' reps",
      "Camera inspection, jetting and equipment dealers",
      "Field service, booking and answering-service software",
      "Home warranty companies recruiting service partners",
    ],
    license: "Plumbing is licensed in nearly every state, usually with apprentice, journeyman and master levels, and some states license at the city or county level instead. The master or contractor license holder is usually the owner or a key decision-maker.",
    timing: "Plumbing demand is steadier than most trades, with spikes in winter freezes. Mid-week mornings tend to be the best time to reach owners, outside the first hours of the dispatch day.",
    contactHabits: "Small plumbing companies often list one shared inbox, so an owner name in the greeting makes a noticeable difference to reply rates.",
    states: [["california", "California"], ["texas", "Texas"], ["florida", "Florida"], ["new-york", "New York"], ["pennsylvania", "Pennsylvania"], ["illinois", "Illinois"]],
    faqs: [
      {
        q: "Which plumbing companies respond best to outreach?",
        a: "Owner-run service plumbers with good reviews but a dated website or no ads usually respond best: they have enough work to afford help and feel the cost of missed calls. Large franchise locations often have corporate marketing and are harder to sell to directly.",
      },
      {
        q: "Can I find plumbers in a specific county or radius?",
        a: "Yes. Search any city, county or radius around an address, which suits supply houses, agencies and software resellers that only serve a local area. You can combine several searches into one list, remove duplicates and then export the plumbers with safe emails to CSV or Excel.",
      },
    ],
  },
  {
    slug: "electrical",
    name: "Electrical",
    noun: "electrical contractor",
    plural: "electrical contractors",
    people: "electricians",
    titleTag: "Electrical Contractor Email List: Verified Owners",
    metaDescription: "Build an electrical contractor email list from live Google data: electricians with owner names and verified emails for any city or state. 10 free leads.",
    secondaryKeywords: ["electrician email list", "electrical contractors list", "list of electrical contractors", "electrical company email list"],
    quickAnswerExtra: "Split residential service electricians from commercial contractors for sharper messaging.",
    segments: [
      ["Residential service", "Repairs, panel upgrades and troubleshooting; driven by search and reviews"],
      ["EV charger and panel installs", "Growing demand; good fit for manufacturers and installer networks"],
      ["Generators and backup power", "Seasonal and storm-driven; often paired with dealer programmes"],
      ["Commercial and industrial", "Bids and contracts through GCs; longer sales cycles"],
      ["Low-voltage and solar electrical", "Specialists in data, security or solar interconnection"],
    ],
    buyers: [
      "Marketing agencies selling local SEO and Google Ads to electricians",
      "Electrical supply houses and distributors",
      "EV charger, generator and battery manufacturers building installer networks",
      "Estimating, field service and invoicing software",
      "Recruiters and apprenticeship programmes",
    ],
    license: "Electrical work is licensed in almost every state, often at journeyman and master levels plus a separate contractor license, with some states delegating to cities. The master electrician or license qualifier is often the owner in smaller firms.",
    timing: "Electricians are busy year-round; storm seasons add generator work, and spring and early summer bring more remodel and EV-charger installs.",
    contactHabits: "Commercial electrical contractors are used to receiving bid invitations by email, so a clear subject line that says what you offer gets read more than a vague one.",
    states: [["california", "California"], ["texas", "Texas"], ["florida", "Florida"], ["new-york", "New York"], ["ohio", "Ohio"], ["washington", "Washington"]],
    faqs: [
      {
        q: "Can I find electricians who install EV chargers or generators?",
        a: "Yes. Search for electrical contractors in your area, then use their websites and AI scores to spot those that mention EV chargers, generators or solar. Many teams build one broad list and then segment it by the services each company lists.",
      },
      {
        q: "Do electrical contractors use personal email addresses?",
        a: "Smaller shops often do, with a Gmail or Outlook address on their website or Google profile. Contractor Leads finds and verifies those as well as company-domain addresses, and labels each one, so you can decide which to include. Domain-only email finders tend to miss these electricians entirely.",
      },
    ],
  },
  {
    slug: "solar",
    name: "Solar",
    noun: "solar installer",
    plural: "solar companies",
    people: "solar installers",
    titleTag: "Solar Installer Email List: Fresh, Verified Contacts",
    metaDescription: "Build a solar installer email list from live Google data, with owner names and verified emails for any state or city. Start with 10 free leads.",
    secondaryKeywords: ["solar company email list", "solar contractors list", "list of solar companies", "solar installer contact list"],
    quickAnswerExtra: "Solar companies change quickly, so a list built on the day you send stays far more accurate.",
    segments: [
      ["Residential installers", "Rooftop systems sold to homeowners; cost per lead is their main worry"],
      ["Commercial solar", "Business and municipal projects; longer cycles and larger contracts"],
      ["Battery and storage specialists", "Growing segment tied to backup power and rate changes"],
      ["Sales organisations and dealers", "Sell under another company's install crews; marketing-heavy"],
      ["Solar roofers", "Roofing companies that also install solar; a bridge between two markets"],
    ],
    buyers: [
      "Marketing agencies and lead-generation companies serving solar",
      "Panel, inverter and battery distributors",
      "Solar financing, loan and lease providers",
      "Design, permitting and proposal software",
      "Recruiters hiring sales reps and installers",
    ],
    license: "Solar installers usually need an electrical license or a solar specialty license, depending on the state (California has a dedicated solar classification), and many hold the voluntary NABCEP certification.",
    timing: "Solar demand follows incentives and utility rates as much as seasons, so installer turnover is high; companies open, merge and close often, which makes old lists go stale quickly.",
    contactHabits: "Solar companies are used to vendor outreach, so a specific, measurable offer stands out more than a general introduction.",
    states: [["california", "California"], ["texas", "Texas"], ["florida", "Florida"], ["arizona", "Arizona"], ["north-carolina", "North Carolina"], ["new-jersey", "New Jersey"]],
    faqs: [
      {
        q: "Why do solar company lists go out of date so fast?",
        a: "The solar market changes with incentives, interest rates and utility rules, so installers open, rebrand, merge and close more often than in most trades. A list built from live Google data on the day you send avoids emailing companies that no longer exist.",
      },
      {
        q: "Can I separate residential and commercial solar companies?",
        a: "Yes, by searching and then filtering on what each company's website and reviews describe. Residential installers care about homeowner lead costs and closing rates, while commercial solar firms focus on project pipelines, financing and permitting, so they need different emails and often different offers.",
      },
    ],
  },
  {
    slug: "general-contractors",
    name: "General contractor",
    noun: "general contractor",
    plural: "general contractors",
    people: "general contractors",
    titleTag: "General Contractor Email List: Verified Owner Emails",
    metaDescription: "Build a general contractor email list from live Google data: GCs with owner names and verified emails for any city or state. Start with 10 free leads.",
    secondaryKeywords: ["general contractors email list", "construction company email list", "list of general contractors", "gc email list"],
    quickAnswerExtra: "Separate residential builders from commercial GCs, since they buy very different services.",
    segments: [
      ["Residential builders and custom homes", "Owner-led firms; reputation, portfolio and referrals drive work"],
      ["Commercial general contractors", "Bid-driven, with estimators and project managers between you and the owner"],
      ["Design-build firms", "Sell design and construction together; strong fit for content and branding"],
      ["ADU and additions specialists", "Growing niche in states that encourage accessory dwellings"],
      ["Tenant improvement", "Office and retail fit-outs for landlords and businesses"],
    ],
    buyers: [
      "Subcontractors looking for GCs to bid for",
      "Building material suppliers and equipment rental companies",
      "Estimating, takeoff and project management software",
      "Insurance, bonding and lending providers",
      "Marketing agencies and recruiters serving construction",
    ],
    license: "General contractor licensing varies more than any other trade: some states license GCs statewide (California, Florida, Arizona and North Carolina, for example), while others, including Texas, leave it to cities or counties. Where a license exists, the record often names the qualifier.",
    timing: "GCs plan and bid in winter and early spring for the building season, so that is when vendor and subcontractor outreach tends to land best.",
    contactHabits: "Commercial GCs often publish a bids or estimating inbox; for vendor sales, the owner or a principal is usually the better contact.",
    states: [["california", "California"], ["texas", "Texas"], ["florida", "Florida"], ["new-york", "New York"], ["washington", "Washington"], ["colorado", "Colorado"]],
    faqs: [
      {
        q: "Can subcontractors use this to find general contractors to work with?",
        a: "Yes. Subcontractors build lists of GCs in their service area to introduce their crews and get on bid lists. Filter for commercial or residential builders based on their websites, and send short introductions with your trade, licences, insurance and service area.",
      },
      {
        q: "Is a general contractor list different from a construction company list?",
        a: "Largely the same searchers, but general contractors manage whole projects and hire trades, while construction company searches can include specialists such as concrete or framing firms. Contractor Leads also has separate searches for concrete, remodeling and other trades, so you can build each list on its own or combine them.",
      },
    ],
  },
  {
    slug: "remodeling",
    name: "Remodeling",
    noun: "remodeling contractor",
    plural: "remodeling companies",
    people: "remodelers",
    titleTag: "Remodeling Contractor Email List: Fresh and Verified",
    metaDescription: "Build a remodeling contractor email list from live Google data: kitchen, bath and whole-home remodelers with verified owner emails. 10 free leads.",
    secondaryKeywords: ["remodeler email list", "home improvement contractor email list", "list of remodeling companies", "kitchen remodeler email list"],
    quickAnswerExtra: "Segment kitchen and bath specialists from whole-home and design-build firms before you write.",
    segments: [
      ["Kitchen and bath", "The biggest segment; showroom-led or owner-led, strong on visuals"],
      ["Basement finishing", "Regional (more common where basements are standard); seasonal demand"],
      ["Whole-home renovation", "Large projects with long sales cycles and careful buyers"],
      ["Design-build remodelers", "Sell the design process; good fit for content, video and branding"],
      ["Aging-in-place and accessibility", "Specialised niche with referral partners in healthcare"],
    ],
    buyers: [
      "Marketing agencies selling SEO, Houzz and Google Ads management",
      "Cabinet, countertop, flooring and fixture suppliers",
      "Design, estimating and project management software",
      "Home improvement financing companies",
      "Photographers and video producers for project portfolios",
    ],
    license: "Several states require a home improvement contractor registration or license for remodeling work (Maryland, Connecticut, Massachusetts and New Jersey among them), while others license remodelers as general contractors or leave it to local rules.",
    timing: "Remodelers book projects months ahead, so autumn and winter planning conversations work well; spring is their busiest selling season.",
    contactHabits: "Many remodelers are design-led small firms where the owner reads every email, which rewards a personal, visual pitch such as a short audit of their project gallery.",
    states: [["california", "California"], ["texas", "Texas"], ["florida", "Florida"], ["new-york", "New York"], ["illinois", "Illinois"], ["massachusetts", "Massachusetts"]],
    faqs: [
      {
        q: "How do I find kitchen and bath remodelers specifically?",
        a: "Search remodeling contractors in your area, then look at each company's website and reviews to tag kitchen and bath specialists. Building one list and segmenting it this way catches firms that list several services under a general remodeling name, which a keyword-only search would miss.",
      },
      {
        q: "What do remodelers usually buy from vendors?",
        a: "Most often marketing that shows their work (websites, project galleries, Houzz and Google profiles), financing they can offer homeowners, and materials or software that shorten the time from design to signed contract. Offers tied to bigger average jobs or fewer lost quotes get the most attention.",
      },
    ],
  },
];

const HUB: LandingPage = {
  slug: "email-lists",
  kind: "product",
  serviceType: "Contractor email list builder",
  primaryKeyword: "contractor email list",
  secondaryKeywords: ["contractors email list", "construction contractor email list", "home service contractor email list", "contractor mailing list"],
  titleTag: "Contractor Email Lists: Build Verified Lists by Trade",
  metaDescription: "Build contractor email lists by trade and area from live Google data, with owner names and every email verified before export. Start with 10 free leads.",
  breadcrumb: "Contractor email lists",
  eyebrow: "Contractor email lists",
  h1: "Contractor email lists, built fresh for any trade and area",
  heroDescription: "Roofing, HVAC, plumbing, electrical, solar, general contractors, remodeling and 11 more trades, with owner names and verified emails.",
  quickAnswer: {
    q: "Where can I get a contractor email list?",
    a: "You can buy a pre-made list or build one from live data. Contractor Leads builds it: choose a trade and an area, and it pulls the contractors listed on Google there, finds owner names and emails, and labels every address safe, catch-all, role-based or invalid before you export to CSV or Excel.",
  },
  intro: "A contractor email list goes stale fast: businesses change owners, close or switch email providers. Contractor Leads builds your list on the day you need it, for the trade and area you choose, with owner names where they can be confirmed and every email checked before it reaches your campaign. It is the same data behind our [contractor email finder](/contractor-email-finder).",
  sections: [
    {
      heading: "Choose a trade",
      body: "Each trade page covers that market's segments, who sells to it, licensing and timing, plus state-by-state links.",
      bullets: [
        "[Roofing contractor email list](/email-lists/roofing): residential, storm restoration and commercial roofers",
        "[HVAC contractor email list](/email-lists/hvac): heating, cooling and refrigeration companies",
        "[Plumbing contractor email list](/email-lists/plumbing): service, drain and new-construction plumbers",
        "[Electrical contractor email list](/email-lists/electrical): residential and commercial electricians",
        "[Solar installer email list](/email-lists/solar): residential, commercial and storage installers",
        "[General contractor email list](/email-lists/general-contractors): builders, design-build and commercial GCs",
        "[Remodeling contractor email list](/email-lists/remodeling): kitchen, bath and whole-home remodelers",
      ],
    },
    {
      heading: "Why build instead of buy",
      body: "A bought list is a snapshot; a built list reflects the market the day you send. That matters most for bounce rates, which decide whether your next emails reach the inbox.",
      table: {
        headers: ["", "Bought list", "Built in Contractor Leads"],
        rows: [
          ["Freshness", "Compiled before you bought it", "Pulled from live Google data when you search"],
          ["Area", "Seller's regions", "Any city, county, state or radius"],
          ["Owner names", "Often missing", "Added where they can be verified"],
          ["Email checks", "Rarely re-checked", "Safe, catch-all, role or invalid on every email"],
          ["Price", "Per list, up front", "1 credit per lead; 10 free to start"],
        ],
      },
    },
    {
      heading: "What every contractor list includes",
      body: "Business name, address, phone and website from Google; the owner or decision-maker where it can be matched; the email with its verification status; rating and review count; AI scores for website, SEO, PPC and marketing; and whether the company runs Meta ads. Fields that cannot be confirmed stay blank.",
    },
    {
      heading: "Other trades",
      body: "Beyond the seven trades above, you can build lists for landscaping, painting, concrete, flooring, fencing, garage doors, windows and doors, pest control, cleaning services, pool services and home improvement companies. Browse them all on the [industries page](/industries).",
    },
    {
      heading: "Send it safely",
      body: "Export only safe emails for your first campaign, send from a warmed-up mailbox in small daily batches, and include a postal address and an opt-out in every email. Read the [CAN-SPAM guide for contractor outreach](/blog/can-spam-cold-email-contractors) and the [email warmup guide](/blog/email-warmup-for-cold-email) before your first send.",
      callout: {
        title: "Start small",
        text: "Build a list for one city first, check the quality, then widen the area. You only pay for the leads you keep.",
      },
    },
  ],
  faqs: [
    {
      q: "Do you sell contractor email lists?",
      a: "No pre-made lists. You build your own list from live Google data for the trade and area you choose, which keeps it current. Your first 10 leads are free, then each lead costs 1 credit, with paid plans from $19.99 a month for 500 credits.",
    },
    {
      q: "Which trades can I build email lists for?",
      a: "Eighteen home-service trades, including roofing, HVAC, plumbing, electrical, solar, general contractors, remodeling, landscaping, painting, concrete, flooring, fencing, garage doors, windows and doors, pest control, cleaning and pool services, across the US, Canada, the UK, Australia and New Zealand. Seven of them have their own email list page with segments and state links.",
    },
    {
      q: "How are the emails verified?",
      a: "Each email is checked and labelled safe, catch-all, role-based or invalid. Safe addresses are the ones to send to first; catch-all domains accept any address, so they cannot be fully confirmed; role-based addresses such as info@ reach a shared inbox rather than the owner.",
    },
    {
      q: "Can I upload my own contractor list to add emails?",
      a: "Yes. The bulk email finder accepts a CSV or Excel file of businesses and adds owner names and verified emails where they can be found, so you can enrich a list you already have instead of starting from a search.",
    },
    {
      q: "Is it legal to send cold email to contractors?",
      a: "In the US, CAN-SPAM allows business cold email when you use honest sender details and subject lines, include a postal address and honour opt-outs within 10 business days. Canada, the UK and the EU have stricter rules. Take legal advice for large campaigns.",
    },
  ],
  related: [
    { href: "/contractor-email-finder", label: "Contractor email finder" },
    { href: "/google-maps-scraper", label: "Google Maps scraper" },
    { href: "/industries", label: "All contractor industries" },
    { href: "/blog/buy-vs-build-contractor-email-list", label: "Buy vs build an email list" },
    { href: "/blog/contractor-license-lookup-owner-name", label: "Find owners with license lookups" },
    { href: "/pricing", label: "Pricing and free leads" },
  ],
  cta: { href: "/register", label: "Build a contractor list free" },
  ctaBand: {
    title: "Build a contractor email list for any trade",
    description: "Pick a trade and an area, add owners and verified emails, and export. Your first 10 leads are free.",
  },
};

export const EMAIL_LIST_TRADES = TRADES.map((t) => ({ slug: t.slug, name: t.name }));

export const EMAIL_LIST_PAGES: LandingPage[] = [HUB, ...TRADES.map(tradePage)];
