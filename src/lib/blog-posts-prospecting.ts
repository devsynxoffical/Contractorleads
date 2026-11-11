import type { BlogPost } from "@/lib/blog-content";

const AUTHOR = {
  name: "Vaishali Kapoor",
  role: "Founder, Contractor Leads",
  bio: "Vaishali leads product and growth at Contractor Leads, helping marketing agencies prospect, score, and close high-ticket home-service contractors.",
  image: "/marketing/founder-portrait.jpg",
};

const PUBLISHED = "2026-11-02";

/**
 * Fourth wave (prospecting): finding businesses without websites, Google Maps
 * lead generation, getting agency clients, selling websites, landscaping and
 * painting playbooks. Body text may use [label](/path) for inline links.
 */
export const PROSPECTING_POSTS: BlogPost[] = [
  // 1. Businesses without websites
  {
    slug: "how-to-find-businesses-without-websites",
    type: "cluster",
    title: "How to Find Local Businesses Without a Website (and Sell Them One)",
    titleTag: "How to Find Businesses Without Websites: 2026 Agency Guide",
    metaDescription:
      "Find local businesses without a website step by step: Google Maps checks, directories and lead tools, then qualify them and pitch a site that closes.",
    primaryKeyword: "how to find businesses without websites",
    secondaryKeywords: [
      "businesses without websites",
      "find local businesses without a website",
      "leads for web design",
      "web design clients",
      "contractors without websites",
    ],
    searchVolume: "est. 1,000-2,000/mo",
    growth: "rising",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: "2026-11-11",
    readingMinutes: 12,
    author: AUTHOR,
    relatedIndustries: ["landscaping", "painting", "cleaning-services", "concrete", "fencing"],
    directAnswer:
      "The fastest way to find local businesses without a website is to search Google Maps for a trade and city and keep only listings with no website link, then confirm they are active (recent reviews, a working phone number). Doing this by hand works for a few dozen leads; for hundreds, use a lead tool that filters Google Maps listings by \"no website\" and adds owner names and contact details. Trades like landscaping, painting, cleaning, concrete and fencing have the highest share of businesses with no site.",
    summary:
      "Manual and automated ways to find businesses with no website, how to tell a real opportunity from a dead listing, and an outreach approach that turns the gap into a sale.",
    faqs: [
      {
        q: "What kinds of local businesses are most likely to have no website?",
        a: "Owner-operated service businesses that win work by referral: landscapers, painters, cleaners, concrete and fencing crews, handymen and small pest control companies. Many run entirely from a Google Business Profile and a phone number.",
      },
      {
        q: "Is a business without a website a good web design lead?",
        a: "Only if it is active and growing. Look for recent reviews, more than one service area, and a phone that is answered. A dormant listing with three reviews from 2019 is not a lead, however empty its website field is.",
      },
      {
        q: "How do I find businesses without websites at scale?",
        a: "Use a tool that pulls Google Maps listings for a trade and area and lets you filter on missing website. Contractor Leads scores every lead on website quality, so \"no site\" and \"broken site\" prospects surface at the top with owner names attached.",
      },
      {
        q: "Can you filter Google Maps for businesses without a website?",
        a: "No. Google Maps has no \"no website\" filter. You either open each listing and look for the Website button, or use a tool that pulls the listings for a trade and area and lets you keep only the ones with no website field.",
      },
      {
        q: "Are businesses without websites good leads for SEO and ads agencies too?",
        a: "Usually not as a first sale. A business with no site needs a website before SEO or ads can work, so lead with a simple site and offer SEO, reviews or Local Services Ads once it is live. Businesses with a weak site (slow, not mobile friendly, no service pages) are often the better SEO and ads prospects.",
      },
      {
        q: "What should I charge a small business for its first website?",
        a: "Small service businesses commonly pay $1,500 to $5,000 for a first site, or $100 to $300 a month on a website-as-a-service plan that includes hosting and edits. Monthly plans close faster because the upfront cost is low.",
      },
    ],
    sections: [
      {
        heading: "Method 1: Google Maps by hand",
        level: 2,
        body: "Search Google Maps for \"[trade] in [city]\", open each listing and check for a Website button. No button means no site is linked. Note the name, phone, review count and the date of the newest review. This is free and accurate, but slow: expect 30 to 50 checked listings an hour. It is the right way to test a niche before you invest in tooling.",
      },
      {
        heading: "Step by step: find them on Google Maps",
        level: 2,
        body: "This is the free method, and the one to use first in a new niche or city.",
        bullets: [
          "Search Google Maps for \"[trade] in [city]\", for example \"fence contractor in Columbus\". Use one trade and one city per search.",
          "Open each listing. If there is no Website button next to Directions and Call, no site is linked to the profile.",
          "Search the business name in Google before you count it (see the next section): the site may exist but not be linked.",
          "Record name, phone, city, review count, rating and the date of the newest review in a sheet.",
          "Move to the next town or ZIP code once a search stops showing new businesses; one search shows a limited number of results.",
        ],
      },
      {
        heading: "Check before you count it as \"no website\"",
        level: 2,
        body: "A missing Website button does not always mean there is no website. Rule these out first, or your pitch will open with a mistake.",
        bullets: [
          "The site exists but is not linked: search the business name and town in Google. Pitching a site to someone who has one loses the deal.",
          "The listing links to Facebook, Yelp or Instagram instead of a site: a real opportunity, and an easy pitch.",
          "The link is broken, parked or shows a \"coming soon\" page: count it as no website.",
          "The business has closed: no reviews in the last year and a phone that does not answer usually means it is not worth a call.",
        ],
      },
      {
        heading: "Method 2: Directories and local sources",
        level: 2,
        body: "Yelp, Nextdoor, Facebook Pages and local chamber of commerce lists all show businesses that never built a site. Facebook is especially useful: many trades use a Page as their only web presence, and an active Page with no website link is a strong signal of a business that would pay for one.",
      },
      {
        heading: "Method 3: A lead tool with a \"no website\" filter",
        level: 2,
        body: "For volume, pull listings automatically and filter. [Contractor Leads](/contractor-lead-generation-software) searches live Google data for 18 home-service trades, scores each business on website quality, and adds the owner name where it can be verified. A search for landscapers in a metro typically returns a mix of no-site, outdated-site and strong-site businesses; you work the first two groups. See also our [Google Maps scraper comparison](/google-maps-scraper) if you are weighing raw scrapers.",
        table: {
          headers: ["Method", "Leads per hour", "Cost", "Owner names", "Best for"],
          rows: [
            ["Google Maps by hand", "30-50", "Free", "No", "Testing a niche"],
            ["Directories / Facebook", "20-40", "Free", "Sometimes", "Hyper-local campaigns"],
            ["Raw scraper", "Hundreds", "Low", "No", "Teams with data skills"],
            ["Scored lead tool", "Hundreds", "Subscription", "Yes, verified", "Agencies selling at volume"],
          ],
        },
      },
      {
        heading: "Weak websites: the bigger market",
        level: 2,
        body: "Businesses with no site at all are a small share of any market, so the larger group to target is businesses whose site is not doing its job. They already believe in having a website, which makes the conversation easier.",
        table: {
          headers: ["Sign of a weak site", "How to check", "What to pitch"],
          rows: [
            ["Not mobile friendly", "Open it on your phone", "Mobile rebuild with click-to-call"],
            ["No HTTPS or security warnings", "Look for the padlock in the browser", "Hosting and SSL setup"],
            ["One page, no service pages", "Look for a page per service and town", "Service and service-area pages"],
            ["No phone number at the top", "Load the home page on a phone", "Header call button, call tracking"],
            ["Very slow to load", "Run it through Google PageSpeed Insights", "Speed fixes or a lighter rebuild"],
          ],
        },
      },
      {
        heading: "Which trades to start with",
        level: 2,
        body: "Owner-operated trades that win work by referral are the most likely to have no site or a weak one. Landscaping, painting, cleaning, concrete and fencing are good first niches for website offers. Roofing, HVAC, plumbing and electrical companies more often have a site but a weak one, which suits SEO and ads offers: see the [roofing](/industries/roofing), [HVAC](/industries/hvac) and [plumbing](/industries/plumbing) guides for what those owners buy, and [leads by state](/locations) to pick a market.",
      },
      {
        heading: "Get the owner's contact details",
        level: 2,
        body: "Google Maps gives you a phone number, not an email or the owner's name. For a few leads, check the business's Facebook Page and the state license lookup. For a list, the [contractor email finder](/contractor-email-finder) adds owner names and verified emails, and [contractor email lists](/email-lists) builds a ready-to-send file for one trade and area. Before you send, [check your sending domain](/tools/email-deliverability-checker) and [test your subject line](/tools/cold-email-subject-line-tester).",
      },
      {
        heading: "Qualify before you pitch",
        level: 2,
        body: "A missing website is a gap, not a guarantee. Keep a prospect when it shows signs of real demand and drop it when it does not.",
        bullets: [
          "At least 10 reviews, with one in the last 90 days",
          "A phone number that is answered or has a business voicemail",
          "A Google Business Profile with photos and service areas filled in",
          "Ideally, a competitor in the same town that does have a decent site",
        ],
      },
      {
        heading: "The pitch that works",
        level: 2,
        body: "Lead with what the missing site costs them, not with design. Show two competitors in their town that rank with a simple site, then offer a one-page site built around their best service and their reviews. Our [cold email guide for agencies](/blog/cold-email-for-agencies) has templates, and the [cold-calling script](/blog/cold-calling-contractors-script) works well for owner-operators who never check email. If you need the owner's name first, use the steps in [how to find a business owner's name](/blog/how-to-find-business-owner-name).",
        callout: {
          title: "Opening line that gets replies",
          text: "\"Hi [Name], I searched 'landscaping in [City]' and [Competitor] shows up with a website and 40 reviews. You have 60 reviews but no site, so Google sends the click to them. I can fix that in a week.\"",
        },
      },
      {
        heading: "Stay compliant when you email them",
        level: 2,
        body: "Cold email to businesses is allowed in the US under CAN-SPAM if you use an honest subject line and sender, include your postal address, and honour opt-out requests promptly. Our [CAN-SPAM checklist](/blog/can-spam-cold-email-contractors) covers the details. Other countries have stricter rules, so check before you email businesses outside the US.",
      },
    ],
    sources: [
      { label: "FTC: CAN-SPAM Act, a compliance guide for business", url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business" },
    ],
  },

  // 2. Google Maps lead generation
  {
    slug: "google-maps-lead-generation",
    type: "pillar",
    title: "Google Maps Lead Generation: How Agencies Turn Map Listings Into Clients",
    titleTag: "Google Maps Lead Generation for Agencies (2026 Guide)",
    metaDescription:
      "Google Maps lead generation for agencies: what data you can get, manual vs automated extraction, how to score listings and a compliant outreach workflow.",
    primaryKeyword: "google maps lead generation",
    secondaryKeywords: [
      "google maps leads",
      "lead generation from google maps",
      "extract leads from google maps",
      "google maps business leads",
      "local business leads",
    ],
    searchVolume: "est. 2,000-4,000/mo",
    growth: "rising",
    cluster: "tools",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 10,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "landscaping", "painting"],
    directAnswer:
      "Google Maps lead generation means building prospect lists from Google Maps business listings: name, category, address, phone, website, rating and review count. Agencies use it because every local service business that wants customers keeps a listing up to date. The workflow is: pick a trade and area, extract the listings, score them on marketing gaps (no website, few reviews, no ads), find the owner's contact, then reach out with a message that names the specific gap.",
    summary:
      "What Google Maps data is useful for prospecting, the three ways to collect it, how to score listings so you call the best ones first, and how to stay compliant.",
    faqs: [
      {
        q: "Is it legal to collect business data from Google Maps?",
        a: "Business listing information such as name, address and phone is published by the business to be found. Using it for B2B outreach is common practice, but follow anti-spam rules (CAN-SPAM in the US, PECR/GDPR in the UK and EU), honour opt-outs, and respect Google's terms by using official APIs or a provider that does.",
      },
      {
        q: "Does Google Maps give you email addresses?",
        a: "No. Listings show phone and website but not email. Emails come from the business website, enrichment providers, or verified lookups. Always verify an address before sending to protect your sender reputation.",
      },
      {
        q: "How many leads can you get from one Google Maps search?",
        a: "A single Maps search shows about 120 results at most. To build larger lists, split the area into smaller cities, ZIP codes or radius searches and combine the results without duplicates.",
      },
      {
        q: "What is the difference between a Google Maps scraper and a lead tool?",
        a: "A scraper returns raw listings. A lead tool adds the work an agency needs next: deduplication, scoring, owner names, verified emails and outreach. See our comparison of scraper alternatives for details.",
      },
    ],
    sections: [
      {
        heading: "What data a Maps listing gives you",
        level: 2,
        body: "Each listing carries business name, category, address, phone, website, opening hours, rating, review count and recent reviews. For prospecting, four fields do most of the work: website (missing or weak means a web or SEO opportunity), review count (low means a reputation opportunity), rating trend, and category (to make sure you only call the trades you serve).",
      },
      {
        heading: "Three ways to collect listings",
        level: 2,
        body: "Manual copying is accurate but limited to a few dozen listings an hour. Raw scrapers and API exports scale to thousands but give you unscored rows you still have to clean. Purpose-built lead tools such as [Contractor Leads](/contractor-lead-generation-software) pull live listings, remove duplicates and score each business so the list arrives sorted by opportunity. If you are comparing options, see [Outscraper alternatives](/alternatives/outscraper-alternative) and our [Google Maps scraper page](/google-maps-scraper).",
        table: {
          headers: ["Approach", "Scale", "Clean data", "Scoring", "Owner contact"],
          rows: [
            ["Manual", "Low", "Yes", "Your judgement", "No"],
            ["Raw scraper / API export", "High", "Needs cleanup", "No", "No"],
            ["Scored lead tool", "High", "Yes", "Yes", "Often"],
          ],
        },
      },
      {
        heading: "Score listings before you call",
        level: 2,
        body: "A list of 500 businesses is only useful if you know which 50 to call first. Score each listing on the gaps you can fix: no or slow website, weak local rankings, no Google or Meta ads, few or old reviews. The highest scores are businesses with demand (reviews, a staffed phone) and visible gaps. Our guides on [Google Business Profile optimization](/blog/google-business-profile-optimization-for-contractors) and [Local Services Ads](/blog/local-service-ads) explain the most common gaps you will pitch.",
      },
      {
        heading: "Get past the gatekeeper",
        level: 2,
        body: "Maps gives you the main line, which a receptionist or dispatcher often answers. Ask for the owner by name: it changes the call. The owner's name is usually on the website's About page, in review replies, or in state licensing records; see [how to find a business owner's name](/blog/how-to-find-business-owner-name).",
      },
      {
        heading: "A simple weekly workflow",
        level: 2,
        body: "Agencies that win steadily from Maps data keep it boring and consistent.",
        bullets: [
          "Monday: pull one trade in three nearby cities, about 300 listings",
          "Score and keep the top 60 by opportunity",
          "Find owner names and verify emails for those 60",
          "Tuesday to Thursday: email first, then call non-responders two days later",
          "Friday: log replies, book audits, and add new competitors you noticed",
        ],
      },
      {
        heading: "Stay compliant",
        level: 2,
        body: "Use a real sender identity and a physical address in every email, include a clear opt-out, and stop contacting anyone who asks. Verify emails before sending so bounces do not damage your domain. For calls, check national do-not-call rules for the numbers you dial; many business lines are exempt, but mobile numbers of sole traders may not be.",
      },
    ],
  },

  // 3. How to get clients for a marketing agency
  {
    slug: "how-to-get-clients-for-marketing-agency",
    type: "pillar",
    title: "How to Get Clients for Your Marketing Agency: 9 Channels That Work in 2026",
    titleTag: "How to Get Clients for a Marketing Agency: 9 Ways (2026)",
    metaDescription:
      "How to get clients for a marketing agency: nine proven channels, from niche outbound and referrals to partnerships, with costs and time to results.",
    primaryKeyword: "how to get clients for marketing agency",
    secondaryKeywords: [
      "how to get agency clients",
      "marketing agency client acquisition",
      "find clients for digital marketing agency",
      "agency lead generation",
      "get smma clients",
    ],
    searchVolume: "est. 3,000-6,000/mo",
    growth: "steady",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 11,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "remodeling"],
    directAnswer:
      "Marketing agencies get clients most reliably by picking one niche, building a list of businesses in that niche with visible marketing gaps, and reaching out with a specific, personalised observation, then supporting that outbound with referrals, partnerships and a few case studies. Outbound to a well-chosen niche produces clients in weeks; referrals and content compound over months. Home-service contractors are a strong niche because jobs are high-value and their marketing gaps are easy to see from outside.",
    summary:
      "A practical comparison of nine client acquisition channels for agencies, which to start with, and why niching down is the step most agencies skip.",
    faqs: [
      {
        q: "What is the fastest way to get the first agency client?",
        a: "Pick one niche and one service, build a list of 100 businesses with an obvious gap you can fix, and send short personalised emails plus follow-up calls. Offer a small, fast win such as a Google Business Profile cleanup to start the relationship.",
      },
      {
        q: "Should a new agency niche down?",
        a: "Yes. A niche lets you reuse case studies, templates and pricing, and makes outreach sound expert instead of generic. You can widen later; starting broad is the most common reason new agencies stall.",
      },
      {
        q: "How many cold emails does it take to win a client?",
        a: "It varies widely with list quality and offer. With a tight niche, real personalisation and verified emails, agencies commonly see a few positive replies per hundred emails and close a fraction of those. Track your own numbers from the first 200 sends.",
      },
      {
        q: "Are contractors a good niche for marketing agencies?",
        a: "For many agencies, yes: tickets are high (roofs, HVAC systems, remodels), demand is local and constant, and owners will pay for booked jobs. The trade-off is that owners are busy, so outreach must be short and specific.",
      },
    ],
    sections: [
      {
        heading: "Step 0: choose a niche you can prove results in",
        level: 2,
        body: "Every channel below works better with a niche. Choose an industry where jobs are valuable, demand is local, and gaps are visible from the outside. Home-service trades fit well; see our playbooks for [roofing](/blog/how-to-get-more-roofing-leads), [HVAC](/blog/hvac-marketing-agency) and [plumbing](/blog/plumbing-contractor-leads).",
      },
      {
        heading: "The 9 channels compared",
        level: 2,
        body: "Speed is how quickly a channel usually produces a first client; cost is cash, not time.",
        table: {
          headers: ["Channel", "Speed", "Cost", "Scales?", "Notes"],
          rows: [
            ["Niche cold email", "Weeks", "Low", "Yes", "Needs verified lists and real personalisation"],
            ["Cold calling", "Days to weeks", "Low", "With people", "Best for owner-operators"],
            ["Referrals", "Months", "Free", "Slowly", "Ask every happy client, every quarter"],
            ["Partnerships", "Months", "Low", "Yes", "Web designers, CRM vendors, suppliers"],
            ["Local networking", "Months", "Low", "No", "Trade associations, BNI, chambers"],
            ["Content and SEO", "6+ months", "Medium", "Yes", "Compounds, slow to start"],
            ["Paid ads", "Weeks", "High", "Yes", "Works once your offer is proven"],
            ["Marketplaces (Upwork etc.)", "Weeks", "Medium", "Limited", "Price pressure"],
            ["Free audits / tools", "Weeks", "Low", "Yes", "Pairs well with outbound"],
          ],
        },
      },
      {
        heading: "Outbound: the channel to start with",
        level: 2,
        body: "Outbound is the only channel you fully control from day one. Build a list of businesses in your niche, score them by the gap you sell, and write two or three lines that name that gap. [Contractor Leads](/contractor-lead-generation-software) does the list and scoring step for contractors; our [cold email guide](/blog/cold-email-for-agencies) and [subject line examples](/blog/cold-email-subject-lines-for-contractors) cover the writing.",
      },
      {
        heading: "Referrals and partnerships",
        level: 2,
        body: "Once you have three happy clients, referrals become your cheapest channel. Ask at the moment of a visible win, offer a referral credit, and make it easy with a one-line intro they can forward. Partnerships with web designers, CRM consultants and trade suppliers bring warm introductions; agree a simple revenue share. If you build software or tools, an [affiliate program](/affiliates) can do the same at scale.",
      },
      {
        heading: "Turn every win into proof",
        level: 2,
        body: "Write a short case study for every client result: starting point, what you changed, the outcome in leads or booked jobs, and a quote. Two or three niche case studies make every later channel convert better.",
        bullets: [
          "Lead with the number the owner cares about: booked jobs, not clicks",
          "Show before and after screenshots of rankings or the Google Business Profile",
          "Get permission to name the business; anonymous studies convert worse",
        ],
      },
      {
        heading: "Price so you can keep the client",
        level: 2,
        body: "Underpricing to win the first deal often loses the client later because results need budget. Anchor your price to the client's job value and the leads they need. Our breakdown of [what contractor leads cost](/blog/how-much-do-contractor-leads-cost) and [pay-per-lead models](/blog/pay-per-lead-for-contractors) helps you set expectations before the first call.",
      },
    ],
  },

  // 4. Selling websites to contractors
  {
    slug: "how-to-sell-websites-to-contractors",
    type: "cluster",
    title: "How to Sell Websites to Contractors: Pricing, Pitch and Proof",
    titleTag: "How to Sell Websites to Contractors: Pricing & Pitch (2026)",
    metaDescription:
      "How to sell websites to contractors: who to target, what to build, how to price it and a pitch script that ties the site to booked jobs.",
    primaryKeyword: "how to sell websites to contractors",
    secondaryKeywords: [
      "web design for contractors",
      "contractor website pricing",
      "sell web design to local businesses",
      "website for roofing company",
      "contractor web design clients",
    ],
    searchVolume: "est. 500-1,000/mo",
    growth: "rising",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["roofing", "plumbing", "hvac", "remodeling", "general-contractors"],
    directAnswer:
      "To sell websites to contractors, target businesses with real demand and a missing or weak site, show them the jobs they lose to competitors who rank, and sell a fast, simple site built to generate calls rather than a design project. Most contractors buy on outcomes: a site that loads fast on a phone, lists their services and service areas, shows reviews, and makes calling one tap. Price it as a one-time build ($1,500 to $6,000) or a monthly plan ($100 to $400) that includes hosting, edits and basic SEO.",
    summary:
      "Which contractors to target, what a contractor website must include, pricing models that close, and a pitch structure that sells the site as a lead source.",
    faqs: [
      {
        q: "How much should I charge a contractor for a website?",
        a: "Common ranges are $1,500 to $3,000 for a small trade business, $3,000 to $6,000 for a multi-service contractor with service-area pages, or $100 to $400 a month on a website-as-a-service plan. Monthly plans remove the upfront objection.",
      },
      {
        q: "What pages does a contractor website need?",
        a: "A home page with the main service and a click-to-call button, one page per core service, service-area pages for the main towns, a reviews or projects page, and a contact page with a short quote form.",
      },
      {
        q: "Do contractors still need a website if they have a Google Business Profile?",
        a: "Yes. The profile wins map clicks, but a website ranks for service and city searches, supports Local Services Ads and paid ads, and builds trust before a homeowner calls. Profiles also rank better when they link to a relevant site.",
      },
    ],
    sections: [
      {
        heading: "Who to target",
        level: 2,
        body: "The best prospects are busy enough to afford a site and losing enough to feel the gap: 20+ reviews, an active Google Business Profile, and either no website or one that is slow and not mobile-friendly. Our guide on [finding businesses without websites](/blog/how-to-find-businesses-without-websites) covers the list-building step, and the [Lead Finder](/contractor-lead-generation-software) scores every contractor on website quality.",
      },
      {
        heading: "What to build",
        level: 2,
        body: "Contractor sites win on speed and clarity, not animation.",
        bullets: [
          "Phone number and click-to-call at the top of every page",
          "One page per core service, written for the search people use (\"roof replacement in Dallas\")",
          "Service-area pages for the five to ten towns they serve",
          "Real project photos and reviews near every call to action",
          "A short quote form: name, phone, service, ZIP",
          "Loads in under three seconds on a phone",
        ],
      },
      {
        heading: "Pricing models",
        level: 2,
        body: "Offer two options and let the contractor choose.",
        table: {
          headers: ["Model", "Typical price", "Best for", "Watch out for"],
          rows: [
            ["One-time build", "$1,500 - $6,000", "Established contractors with cash flow", "Scope creep; agree page count"],
            ["Website as a service", "$100 - $400 / mo", "Small and new businesses", "Set a minimum term, e.g. 12 months"],
            ["Site + SEO retainer", "$500 - $2,000 / mo", "Contractors who want rankings", "Report on calls, not keywords"],
          ],
        },
      },
      {
        heading: "The pitch",
        level: 2,
        body: "Search their main service and town while you are on the call. Point out who ranks, how many reviews they have, and that the click goes to a competitor's site. Then describe the simple site you would build and how it links to their profile and any [Local Services Ads](/blog/local-service-ads). Close with a deadline-based offer such as live in 10 days. Pair this with our [roofing SEO guide](/blog/roofing-seo) if they ask how rankings follow.",
        callout: {
          title: "Three-line email",
          text: "\"Hi [Name] — searched 'water heater repair [City]': [Competitor] ranks with a basic site. You have more reviews but no site, so they get the call. I build simple contractor sites that go live in 10 days. Worth a 10-minute look?\"",
        },
      },
      {
        heading: "Upsells that keep the client",
        level: 2,
        body: "After launch, the natural next steps are Google Business Profile management, review requests, and local SEO. See [how to sell SEO to contractors](/blog/how-to-sell-seo-to-contractors) for packaging those into a monthly plan.",
      },
    ],
  },

  // 5. Landscaping leads
  {
    slug: "landscaping-leads",
    type: "cluster",
    title: "Landscaping Leads: How Agencies Find and Win Landscaping Clients",
    titleTag: "Landscaping Leads: Find & Win Landscaping Clients (2026)",
    metaDescription:
      "How agencies find and win landscaping leads: where landscaping and lawn care companies are, the gaps to look for, seasonality and what landscapers buy.",
    primaryKeyword: "landscaping leads",
    secondaryKeywords: [
      "landscaping clients",
      "lawn care leads",
      "landscaping marketing agency",
      "landscaping company leads",
      "how to get landscaping clients",
    ],
    searchVolume: "est. 1,000-2,500/mo",
    growth: "seasonal",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 7,
    author: AUTHOR,
    relatedIndustries: ["landscaping", "fencing", "pool-services", "concrete"],
    directAnswer:
      "Agencies find landscaping leads by targeting lawn care and landscape companies in suburban markets with strong Google reviews but weak websites, few photos and no paid ads. Landscapers are highly seasonal: they buy marketing in late winter and early spring to fill the season, and in autumn for snow, leaf and hardscape work. The services they buy most are a lead-generating website with service-area pages, Google Business Profile management, review generation and Local Services Ads.",
    summary:
      "Where to find landscaping companies worth pitching, the gaps that signal a sale, when to reach out, and what to offer.",
    faqs: [
      {
        q: "When is the best time to sell marketing to landscapers?",
        a: "Late January to April, when owners plan the season and want the schedule full, and again in September and October for autumn clean-ups, hardscaping and snow contracts. Mid-summer is their busiest field time and the hardest to reach them.",
      },
      {
        q: "What marketing services do landscaping companies buy?",
        a: "Most often a simple website with service and area pages, Google Business Profile and review management, Local Services Ads, and seasonal email or text campaigns to past customers. Larger firms add Google Ads for high-value design-build and hardscape projects.",
      },
      {
        q: "Are lawn care companies different from landscapers?",
        a: "Yes. Lawn care is recurring, lower-ticket work that rewards retention and route density; landscaping and hardscape are project-based and higher ticket. Pitch recurring-customer campaigns to lawn care and lead generation for projects to landscapers.",
      },
    ],
    sections: [
      {
        heading: "Where the best landscaping leads are",
        level: 2,
        body: "Suburbs with detached homes and larger lots, and growing metros in the South and West, have the most landscaping demand. Use the [landscaping lead finder](/industries/landscaping) to pull companies by city or state, and filter for strong reviews with a weak or missing site; many landscapers fall in this group. Our guide to [finding businesses without websites](/blog/how-to-find-businesses-without-websites) shows the qualification checklist.",
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Landscaping is visual, so gaps are easy to spot.",
        bullets: [
          "No website, or a site without project photos",
          "Google Business Profile with few photos or no recent posts",
          "Strong reviews but no review replies",
          "Competitors running Local Services Ads while they are not",
          "No separate pages for hardscaping, irrigation or lawn care",
        ],
      },
      {
        heading: "A seasonal outreach calendar",
        level: 2,
        body: "Time your outreach to when owners think about growth.",
        table: {
          headers: ["Months", "Owner mindset", "What to pitch"],
          rows: [
            ["Jan - Mar", "Planning the season", "Website refresh, LSAs, spring campaigns"],
            ["Apr - Jun", "Busy, booking fast", "Review generation, quick wins only"],
            ["Jul - Aug", "Peak field work", "Short check-ins; avoid long calls"],
            ["Sep - Nov", "Autumn and snow work", "Hardscape and snow lead gen, next-year planning"],
            ["Dec", "Slow, reflective", "Annual retainers and budgets"],
          ],
        },
      },
      {
        heading: "What to offer first",
        level: 2,
        body: "Start with a fast, visible win: a cleaned-up Google Business Profile with new photos and review replies (see our [GBP optimization guide](/blog/google-business-profile-optimization-for-contractors)), then a simple site and [Local Services Ads](/blog/local-service-ads). Report on booked estimates, which landscapers track closely.",
      },
    ],
  },

  // 6. Painting contractor leads
  {
    slug: "painting-contractor-leads",
    type: "cluster",
    title: "Painting Contractor Leads: How Agencies Find and Win Painting Companies",
    titleTag: "Painting Contractor Leads for Agencies (2026 Playbook)",
    metaDescription:
      "How agencies find residential and commercial painting contractors, the marketing gaps painters have, typical lead costs and the offers that close.",
    primaryKeyword: "painting contractor leads",
    secondaryKeywords: [
      "painting leads",
      "painting company leads",
      "marketing for painting contractors",
      "residential painting leads",
      "commercial painting leads",
    ],
    searchVolume: "est. 500-1,500/mo",
    growth: "steady",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 7,
    author: AUTHOR,
    relatedIndustries: ["painting", "remodeling", "home-improvement"],
    directAnswer:
      "To find painting contractor leads, pull painting companies by city from Google Maps or a lead tool, then prioritise owner-run firms with good reviews but no website, few before-and-after photos, and no ads. Painters compete heavily on trust and visuals, so they respond to offers built around project galleries, review generation, Local Services Ads and estimate-booking websites. Residential repaints and cabinet refinishing are the most marketing-hungry segments.",
    summary:
      "Where painting leads come from, the gaps that make a painter a good prospect, what leads cost them, and what to sell first.",
    faqs: [
      {
        q: "How much do painting leads cost a contractor?",
        a: "Residential painting leads typically cost $30 to $120 through Local Services Ads or search ads and less through Meta, depending on the market. Interior repaints are cheaper per lead; exterior and cabinet projects cost more but carry higher tickets.",
      },
      {
        q: "Which painting companies are the best agency clients?",
        a: "Owner-run residential painters with two to ten crews: big enough to afford a retainer, small enough that the owner decides quickly and feels every slow week.",
      },
      {
        q: "What should a painting contractor's website include?",
        a: "Before-and-after galleries by project type, service pages for interior, exterior and cabinets, service-area pages, reviews next to every call to action, and an online estimate request.",
      },
    ],
    sections: [
      {
        heading: "Find painting companies worth pitching",
        level: 2,
        body: "Start with the [painting lead finder](/industries/painting) for your target city or state, then sort by opportunity. Strong review counts with a missing or thin website are the best signal. Combine with [owner name lookup](/blog/how-to-find-business-owner-name) so your first message reaches the decision-maker.",
      },
      {
        heading: "Gaps painters commonly have",
        level: 2,
        body: "Painting is a trust purchase made from photos and reviews.",
        bullets: [
          "No before-and-after gallery, or stock photos instead of real jobs",
          "No separate pages for cabinets or exterior painting",
          "Few recent reviews, or none mentioning specific services",
          "No Local Services Ads despite competitors running them",
          "Slow follow-up on estimate requests",
        ],
      },
      {
        heading: "Lead cost benchmarks",
        level: 2,
        body: "Ranges vary by market and season; use them to set expectations, then track the painter's own numbers. Our [contractor lead cost guide](/blog/how-much-do-contractor-leads-cost) explains how to judge cost per booked job.",
        table: {
          headers: ["Channel", "Typical cost per lead", "Notes"],
          rows: [
            ["Local Services Ads", "$30 - $100", "Pay per valid call; strong intent"],
            ["Google Search Ads", "$40 - $120", "Best for exterior and cabinets"],
            ["Meta ads", "$15 - $70", "Works with seasonal offers"],
            ["Shared marketplaces", "$20 - $60", "Shared with several painters"],
          ],
        },
      },
      {
        heading: "Offers that close",
        level: 2,
        body: "Lead with a project gallery and review push, which painters see results from quickly, then add [Local Services Ads](/blog/lsa-ads-cost-setup) and a site built for estimate requests. A [three-line cold email](/blog/cold-email-for-agencies) that names a competitor's gallery usually beats a long pitch.",
      },
    ],
  },
];
