import type { BlogPost } from "@/lib/blog-content";

const AUTHOR = {
  name: "Vaishali Kapoor",
  role: "Founder, Contractor Leads",
  bio: "Vaishali leads product and growth at Contractor Leads, helping marketing agencies prospect, score, and close high-ticket home-service contractors.",
  image: "/marketing/founder-portrait.jpg",
};

const PUBLISHED = "2026-10-29";

/**
 * Second wave of blog guides: trade playbooks, tooling comparisons and
 * sales-process posts. Merged into BLOG_POSTS in blog-content.ts.
 */
export const PLAYBOOK_POSTS: BlogPost[] = [
  // 1. How to get contractor leads (head term, serves both agencies and contractors)
  {
    slug: "how-to-get-contractor-leads",
    type: "cluster",
    title: "How to Get Contractor Leads: 11 Channels Ranked by Cost, Speed and Quality",
    titleTag: "How to Get Contractor Leads: 11 Channels Ranked",
    metaDescription:
      "How to get contractor leads in 2026: 11 channels ranked by cost per lead, time to first lead and quality, with what agencies should sell contractors for each.",
    primaryKeyword: "how to get contractor leads",
    secondaryKeywords: [
      "contractor leads",
      "how to get leads as a contractor",
      "best way to get contractor leads",
      "free contractor leads",
      "contractor lead generation",
      "exclusive contractor leads",
    ],
    searchVolume: "2,400/mo",
    growth: "+22%",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 12,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "general-contractors", "remodeling"],
    directAnswer:
      "Contractors get leads from eleven main channels: referrals, Google Business Profile, Local Services Ads, Google Search Ads, SEO, Facebook and Instagram ads, lead marketplaces such as Angi and Thumbtack, door knocking and yard signs, partnerships with realtors and suppliers, email and SMS to past customers, and reviews. Referrals and Google Business Profile are the cheapest; Local Services Ads and paid search are the fastest; SEO and reviews compound the longest. Agencies that sell to contractors should pitch the channel the contractor is visibly missing, which is why Contractor Leads scores every business on website, SEO, PPC and marketing gaps before you call.",
    summary:
      "A ranked, honest breakdown of every way a contractor gets work, what each one costs, how fast it pays off, and what an agency should sell for each channel.",
    faqs: [
      {
        q: "What is the cheapest way to get contractor leads?",
        a: "Referrals, a complete Google Business Profile and a steady flow of Google reviews cost almost nothing but time. They also compound: a profile with 150 reviews keeps producing calls for years. The trade-off is speed, which is why most growing contractors pair them with Local Services Ads or paid search.",
      },
      {
        q: "Are shared leads from Angi or Thumbtack worth it?",
        a: "Sometimes, for a new contractor with no pipeline. The same homeowner request is usually sold to three to five contractors, so close rates are low and price competition is high. Once a contractor has reviews and a working website, exclusive channels such as LSAs, search ads and their own site usually win on cost per booked job.",
      },
      {
        q: "How do agencies get contractor leads for themselves?",
        a: "Agencies prospect contractors directly. The fastest approach is a scored list: pull every roofer or HVAC company in a metro from live Google data, rank them by the marketing gap you fix, confirm the owner name, and send a first email that names the gap. Contractor Leads automates that workflow and gives 10 free leads to start.",
      },
      {
        q: "What is a good cost per lead for contractors?",
        a: "It depends on job value. Plumbers often target $30 to $90 per lead, HVAC $50 to $150, roofing $80 to $250 and solar $150 to $400. A channel is worth keeping when cost per booked job stays below roughly 10 percent of the average ticket.",
      },
    ],
    sections: [
      {
        heading: "How we ranked the channels",
        level: 2,
        body: "Every channel below is scored on three things: cost per lead, time to first lead, and lead quality (how often a lead turns into a booked, profitable job). Ranges are typical for US home-service trades in 2026 and will move with your market, trade and season. Use them to pick a mix, not as a guarantee.",
        table: {
          headers: ["Channel", "Typical cost per lead", "Time to first lead", "Quality", "What agencies sell here"],
          rows: [
            ["Referrals and word of mouth", "$0 to $20", "Weeks to months", "Very high", "Referral systems, review automation"],
            ["Google Business Profile", "$0 to $30", "2 to 8 weeks", "High", "GBP optimization, review velocity"],
            ["Local Services Ads", "$35 to $250", "Days", "High", "LSA setup, dispute management"],
            ["Google Search Ads", "$40 to $300", "Days", "Medium to high", "PPC management, landing pages"],
            ["SEO and content", "$10 to $60 at scale", "3 to 9 months", "High", "Local SEO retainers"],
            ["Facebook and Instagram ads", "$15 to $120", "Days", "Medium", "Paid social, creative, lead follow-up"],
            ["Lead marketplaces (Angi, Thumbtack)", "$20 to $150, shared", "Hours", "Low to medium", "Rarely; replace them"],
            ["Door knocking and yard signs", "$10 to $60 in labor", "Same day", "Medium", "Storm-season canvassing systems"],
            ["Realtor and supplier partnerships", "$0 to $50", "Weeks", "High", "Partner programs, co-marketing"],
            ["Email and SMS to past customers", "$1 to $10", "Days", "High", "CRM setup, nurture sequences"],
            ["Reviews and reputation", "$0 to $15", "Weeks", "Multiplier", "Review requests, response management"],
          ],
        },
      },
      {
        heading: "1. Referrals: the channel every other channel feeds",
        level: 2,
        body: "Most established contractors still get the majority of their work from referrals, and nothing beats the close rate. The weakness is that referrals are passive. The fix is a system: ask at job completion, offer a small thank-you, and follow up with a review request. Agencies package this as a referral and review program that sits on top of whatever CRM the contractor already uses.",
      },
      {
        heading: "2. Google Business Profile: free, local and under-used",
        level: 2,
        body: "The map pack appears on almost every 'near me' search and the profile costs nothing. Yet in a typical Contractor Leads search, a large share of contractors have incomplete profiles, few photos, slow review growth or no website link at all. Complete the categories, add service areas, publish weekly photos and answer every review. For agencies this is the easiest first retainer because the before-and-after is visible inside a month.",
        bullets: [
          "Pick the most specific primary category (Roofing contractor, not General contractor)",
          "Add every service as a separate line item with a short description",
          "Reply to every review within 48 hours, including the bad ones",
          "Link the profile to a page that loads in under three seconds on mobile",
        ],
      },
      {
        heading: "3. Local Services Ads: pay per lead at the top of Google",
        level: 2,
        body: "LSAs sit above the regular ads with a Google Guaranteed badge and charge per valid call or message instead of per click. For licensed trades such as plumbing, HVAC, electrical and roofing they are usually the fastest route to booked jobs. The catch is setup: licence, insurance and background checks must clear before the ad goes live, and invalid leads must be disputed each month. Our Local Service Ads guide covers the full agency workflow.",
      },
      {
        heading: "4. Google Search Ads: fast, flexible, expensive if neglected",
        level: 2,
        body: "Search ads capture emergency and high-intent searches that LSAs do not cover, and they let you control the landing page. Costs per click in home services are among the highest on Google, so a campaign without negative keywords, call tracking and a fast landing page burns budget quickly. Contractors with a PPC score under 40 in Contractor Leads are usually either not running search ads or running them badly, which is a clear agency opening.",
      },
      {
        heading: "5. SEO and content: slow to start, cheapest at scale",
        level: 2,
        body: "A contractor site that ranks for its city plus trade and the top ten service terms produces leads for years at a falling cost per lead. It takes three to nine months and consistent work on service pages, location pages and reviews. Agencies should sell SEO to contractors who already have a working paid channel, so the retainer is funded while rankings build. See our roofing SEO guide for a worked example.",
      },
      {
        heading: "6. Facebook and Instagram ads: volume with a follow-up problem",
        level: 2,
        body: "Meta ads can produce cheap leads for remodeling, solar, roofing inspections and seasonal HVAC offers, but lead quality depends almost entirely on speed to call. A lead that waits 24 hours is already talking to someone else. Agencies that pair Meta ads with an instant SMS and call sequence keep clients; agencies that hand over a spreadsheet of names do not. Contractor Leads shows whether a business already runs Meta ads so you know which pitch to open with.",
      },
      {
        heading: "7. Lead marketplaces: fast, shared and price-driven",
        level: 2,
        body: "Angi, Thumbtack, HomeAdvisor and similar marketplaces sell homeowner requests to several contractors at once. They are useful for a brand-new business and painful for everyone else: low close rates, fee disputes and homeowners trained to pick the lowest bid. Agencies rarely sell marketplace management. Instead, the pitch is to replace marketplace spend with owned channels over six months.",
      },
      {
        heading: "8. Door knocking, yard signs and canvassing",
        level: 2,
        body: "Still the backbone of storm-season roofing and a steady source for exterior trades. Costs are labor, not media. A yard sign on every active job and a short canvass of the surrounding streets reliably produces neighbors. Agencies can productize this with territory maps, door-hanger design and a simple canvassing CRM.",
      },
      {
        heading: "9. Realtor, property manager and supplier partnerships",
        level: 2,
        body: "A realtor who recommends one roofer or one HVAC company to every buyer is worth more than most ad campaigns. Property managers send repeat work. Supply houses know which contractors are growing. Partnerships take months to build and almost no money, so they suit established contractors with capacity to spare.",
      },
      {
        heading: "10. Email and SMS to past customers",
        level: 2,
        body: "The cheapest leads a contractor will ever get are from people who already paid them. Seasonal maintenance reminders, filter-change offers, roof inspections after a storm and anniversary check-ins all produce bookings for the cost of a CRM. Most contractors do none of this, which makes CRM setup and nurture sequences an easy add-on for agencies.",
      },
      {
        heading: "11. Reviews: the multiplier on every other channel",
        level: 2,
        body: "Reviews are not a lead source on their own, but they change the conversion rate of every other channel. A contractor with 4.8 stars and 200 reviews wins the same LSA call that a 4.2-star, 15-review competitor loses. Review velocity is one of the reputation signals Contractor Leads pulls on each lead, so you can pitch review automation to the businesses that need it most.",
      },
      {
        heading: "Picking the right mix by stage",
        level: 2,
        body: "A sensible progression for most contractors, and therefore for the agencies advising them:",
        bullets: [
          "Year one: Google Business Profile, reviews, referrals, one marketplace, yard signs",
          "Growing: add Local Services Ads or search ads, build a fast website, start email to past customers",
          "Established: SEO retainer, Meta ads with instant follow-up, partnerships, drop marketplaces",
          "Scaling: multi-location SEO, call tracking, CRM automation, dedicated inside sales",
        ],
      },
      {
        heading: "For agencies: find the contractors missing a channel",
        level: 2,
        body: "The pitch writes itself when you can see the gap. Contractor Leads searches live Google Places data for any trade and market, scores every business on website, SEO, PPC and overall marketing opportunity, checks Meta Ads Library status, finds the owner's name from the business website and drafts the first email. Start with 10 free leads and sort by the channel you sell.",
        callout: {
          title: "Opening line formula",
          text: "[Owner first name], [Business] has [strong signal: 4.8 stars / 160 reviews] but [gap: no website / no Local Services Ads / no Meta ads] in [City]. [Competitor] is picking up those calls. Worth a 10-minute look at what that is costing you?",
        },
      },
    ],
  },

  // 2. Plumbing contractor leads
  {
    slug: "plumbing-contractor-leads",
    type: "cluster",
    title: "Plumbing Contractor Leads for Agencies: How to Find, Qualify and Pitch Plumbers",
    titleTag: "Plumbing Contractor Leads for Agencies: Find and Pitch Plumbers",
    metaDescription:
      "How agencies find plumbing contractor leads, which plumbers to pitch first, what plumbing owners buy, and the outreach that books calls. Includes a 7-day sequence.",
    primaryKeyword: "plumbing contractor leads",
    secondaryKeywords: [
      "plumbing leads for agencies",
      "plumber leads",
      "plumbing marketing agency",
      "how to market to plumbers",
      "plumbing company leads",
      "lead generation for plumbers",
    ],
    searchVolume: "1,200/mo",
    growth: "+12%",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 10,
    author: AUTHOR,
    relatedIndustries: ["plumbing", "hvac", "electrical"],
    directAnswer:
      "Plumbing contractor leads for agencies are plumbing businesses with a visible marketing gap and an owner you can reach. The best ones have strong reviews but no website, weak local rankings, or no Local Services Ads in a market where competitors run them. Pull every plumber in a metro from live Google data, score them on website, SEO and PPC gaps, confirm the owner's name, and open with the emergency-search revenue they are losing. Plumbing works because demand is constant, tickets range from a few hundred dollars to full repipes, and most shops are owner-run.",
    summary:
      "The plumbing-specific playbook: why plumbers buy marketing, which signals mark a ready-to-buy shop, what to pitch, and a seven-day outreach sequence with scripts.",
    faqs: [
      {
        q: "Why are plumbers good clients for marketing agencies?",
        a: "Demand is year-round and often urgent, average tickets are healthy, repeat and membership revenue is common, and most plumbing companies are owner-operated with no marketing staff. A plumber who ranks for emergency searches in a mid-size city can fund a meaningful retainer from a handful of extra jobs a month.",
      },
      {
        q: "What services do plumbing companies actually buy from agencies?",
        a: "Local Services Ads management, Google Business Profile and review work, fast mobile websites with click-to-call, Google Search Ads for emergency terms, and CRM follow-up for estimates. Branding and social content are harder sells unless the shop is already large.",
      },
      {
        q: "How do I find plumbing contractor leads in a specific city?",
        a: "Search the trade and city in Contractor Leads. Results come from live Google Places data, each plumber is scored on website, SEO, PPC and marketing gaps, Meta ad status is checked, and the owner's name is pulled from the business site when available. Filter to the gap you fix and export or push to your CRM.",
      },
      {
        q: "What is a realistic retainer for a plumbing client?",
        a: "Single-truck shops typically start at $750 to $1,500 a month for GBP, reviews and LSA management. Multi-truck companies with dispatch software commonly pay $2,500 to $6,000 a month for paid search, LSAs, website and CRM work. Price against the value of one extra repipe or water heater job a week.",
      },
    ],
    sections: [
      {
        heading: "Why plumbing is one of the best trades to prospect",
        level: 2,
        body: "Plumbing has three qualities agencies should love. First, demand does not depend on a storm or a season: burst pipes, blocked drains and failed water heaters happen every week. Second, the ticket range is wide, from a few hundred dollars for a drain call to five figures for a repipe or sewer line, so a plumber can afford marketing once the phone rings. Third, most shops are owner-run with two to fifteen staff and no one whose job is marketing.",
      },
      {
        heading: "Signals that a plumber is ready to buy",
        level: 2,
        body: "Not every plumber is a good lead. The ones worth your first call show a specific pattern in their digital footprint:",
        bullets: [
          "Rating of 4.5 or higher with 40+ reviews but no website or a site that fails on mobile",
          "Ranked outside the map pack for 'plumber near me' in their own city",
          "No Local Services Ads while two or more competitors show the Google Guaranteed badge",
          "Running Meta ads with no landing page or follow-up, which signals budget but poor execution",
          "Recent growth signals: new trucks in photos, hiring posts, a second location",
        ],
      },
      {
        heading: "What to pitch each type of plumbing company",
        level: 2,
        body: "Match the offer to the shop. Pitching an SEO retainer to a one-truck plumber who needs calls this week will not land.",
        table: {
          headers: ["Shop profile", "Primary pain", "Lead offer", "Typical monthly retainer"],
          rows: [
            ["Solo or two trucks, strong reviews, no site", "Invisible outside word of mouth", "Fast mobile site + GBP optimization + review automation", "$750 to $1,500"],
            ["Three to six trucks, some ads, slow follow-up", "Leaking estimates, uneven weeks", "LSAs + Google Search Ads + instant SMS follow-up", "$1,500 to $3,500"],
            ["Multi-truck, dispatch software, membership plans", "Growth ceiling in one metro", "Local SEO + location pages + CRM nurture for members", "$3,000 to $6,000"],
            ["Commercial and new-construction plumbing", "Few but large bids", "LinkedIn + email outreach to GCs and property managers", "$2,000 to $5,000"],
          ],
        },
      },
      {
        heading: "The emergency-search angle",
        level: 2,
        body: "The most persuasive number for a plumber is the one they can feel: emergency calls going to someone else. Show the owner who ranks in the map pack and who holds the Local Services Ads slots for 'emergency plumber [city]' and 'water heater repair [city]'. If it is not them, the lost revenue is obvious. Contractor Leads gives you the SEO and PPC scores to lead with and the owner's name so the email does not open with 'Dear Business Owner'.",
      },
      {
        heading: "Seven-day outreach sequence for plumbing owners",
        level: 2,
        body: "Plumbers are in a van most of the day. Keep every message short, mobile-friendly and specific to their business. Send email mid-morning and SMS only after an email has gone out.",
        bullets: [
          "Day 1, email: name the gap and one competitor taking the calls. One question, no attachments.",
          "Day 2, SMS: 'Hi [first name], sent you a note about [Business]'s Google listing yesterday. Worth two minutes?'",
          "Day 4, email: a two-line proof point from a similar plumber, plus a 90-second screen recording of their map pack results.",
          "Day 5, call: late afternoon when trucks are heading back. Open with the competitor's badge, not your agency.",
          "Day 7, email: close the loop. Offer one specific fix you would do first and a time to talk.",
        ],
        callout: {
          title: "Day 1 email",
          text: "Subject: [City] water heater calls\n\nHi [first name],\n\n[Business] has [rating] stars and [review count] reviews, which is better than most plumbers in [City]. But when I searched 'water heater repair [City]' this morning, [Competitor] holds the Google Guaranteed spot and the map pack, and your site [does not show / loads slowly on mobile].\n\nThose are the highest-margin calls in your market going elsewhere.\n\nOpen to a 10-minute look at what it would take to get them?",
        },
      },
      {
        heading: "Objections you will hear from plumbers",
        level: 2,
        body: "'We get enough work from referrals' usually means the owner is the bottleneck and does not want to hire. Answer with margin, not volume: better jobs, fewer drain calls, more water heaters and repipes. 'We tried marketing before and it did not work' almost always means a lead marketplace or a cheap website vendor. Ask what they tried and show a different mechanism. 'Call me in the spring' is seasonal thinking in a trade that is not seasonal; show them winter emergency volume.",
      },
      {
        heading: "Pulling your first plumbing list",
        level: 2,
        body: "Open Contractor Leads, choose Plumbing, pick a country and a city or radius, and run the search. Sort by PPC score to find shops with no paid presence, or by website score to find strong reviewers with weak sites. Open any lead for the full audit, confirm the owner name, generate the first email in Outreach Studio and push the Hot tier to your CRM. Your first 10 leads are free.",
      },
    ],
  },

  // 3. Solar contractor leads
  {
    slug: "solar-contractor-leads",
    type: "cluster",
    title: "Solar Contractor Leads for Agencies: Pitching Installers in a Tighter Market",
    titleTag: "Solar Contractor Leads for Agencies: How to Pitch Installers",
    metaDescription:
      "How agencies find and pitch solar contractor leads: which installers survive a tighter market, what they buy, cost per lead benchmarks, and an outreach angle built on ad intelligence.",
    primaryKeyword: "solar contractor leads",
    secondaryKeywords: [
      "solar leads for agencies",
      "solar installer leads",
      "solar marketing agency",
      "how to market to solar companies",
      "solar lead generation",
      "solar installer marketing",
    ],
    searchVolume: "1,400/mo",
    growth: "+40%",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 10,
    author: AUTHOR,
    relatedIndustries: ["solar", "electrical", "roofing"],
    directAnswer:
      "Solar contractor leads for agencies are solar installers and EPCs with budget to acquire homeowners and a visible gap in how they do it. The best prospects run Meta or Google ads already, have strong reviews, and lack either a fast landing page, follow-up automation, or local SEO. Solar tickets are large, so installers tolerate high cost per lead, but the market has tightened as incentives shift, which makes installers more receptive to agencies that cut acquisition cost rather than just add volume. Find installers from live Google data, check their ad status, and pitch efficiency.",
    summary:
      "A solar-specific prospecting playbook: how the market changed, which installers to target, what they buy from agencies, and how to open with ad intelligence instead of a generic pitch.",
    faqs: [
      {
        q: "Is solar still a good vertical for marketing agencies?",
        a: "Yes, with a different pitch than a few years ago. Installers that survived the shake-out are run by operators who watch cost per acquisition closely. They buy from agencies that lower cost per installed system through better creative, faster follow-up and owned channels, not from agencies promising more raw leads.",
      },
      {
        q: "What do solar installers pay per lead?",
        a: "Paid-social solar leads commonly run $40 to $150 for a form fill and $150 to $400 for a qualified appointment, depending on state and utility rates. Because an installed system is a five-figure sale, installers accept high lead costs if close rates hold. Shared marketplace solar leads are usually the worst value.",
      },
      {
        q: "How do I find solar installers to pitch?",
        a: "Search Solar in Contractor Leads for your target state or metro. Each installer returns live Google data, website, SEO and PPC scores, Meta ad status and the owner's name where it can be verified. Sort by Meta ads running with a low website score to find installers spending money on traffic that lands badly.",
      },
      {
        q: "Which other trades sell solar?",
        a: "Roofers increasingly add solar to re-roof jobs, and electrical contractors install panels, batteries and EV chargers. Both are worth including in a solar prospecting list, especially in storm and high-utility-rate markets.",
      },
    ],
    sections: [
      {
        heading: "How the solar market changed, and why that helps agencies",
        level: 2,
        body: "Residential solar grew on cheap money and generous incentives, then contracted as rates rose, incentives shifted and several national installers failed. The installers still operating in 2026 are leaner and more disciplined about acquisition cost. That is good news for agencies with a performance story: an owner who has watched competitors collapse listens when you talk about cost per installed system instead of impressions.",
      },
      {
        heading: "Three installer profiles and what each buys",
        level: 2,
        body: "Solar companies are not interchangeable. Qualify the type before you pitch.",
        table: {
          headers: ["Installer profile", "How they get customers today", "Gap to look for", "Offer"],
          rows: [
            ["Local installer, 5 to 25 staff", "Referrals, some Meta ads, door knocking", "Slow follow-up, weak landing pages, thin reviews", "Meta ads with instant SMS and call follow-up, review program"],
            ["Regional EPC, multi-state", "In-house sales team fed by purchased leads", "High lead cost, no owned channel", "Local SEO by metro, branded search, CRM nurture of old quotes"],
            ["Roofer or electrician adding solar", "Existing customer base", "No solar-specific pages or proof", "Solar service pages, GBP categories, upsell sequences to past customers"],
          ],
        },
      },
      {
        heading: "Why Meta ad intelligence matters more in solar than anywhere else",
        level: 2,
        body: "Almost every active installer has run Facebook or Instagram ads at some point, so the question is not whether they advertise but how well. Contractor Leads checks the Meta Ads Library for each business. An installer with active ads and a website score under 50 is paying for traffic that lands on a slow page with no instant follow-up. That is the most profitable agency opening in the vertical: you are not asking for new budget, you are rescuing existing budget.",
        bullets: [
          "Active ads + weak site: pitch landing pages and speed-to-lead automation",
          "No ads + strong reviews: pitch a controlled paid-social test with a clear CPA target",
          "Active ads + strong site + low review count: pitch review velocity and retargeting",
        ],
      },
      {
        heading: "Cost per lead and cost per install benchmarks",
        level: 2,
        body: "Use these as conversation anchors, not promises. Figures vary widely by state, utility rates and whether the lead is a form fill or a set appointment.",
        table: {
          headers: ["Metric", "Typical range", "What moves it"],
          rows: [
            ["Meta form lead", "$40 to $150", "Creative, offer, state incentives"],
            ["Qualified appointment", "$150 to $400", "Speed to call, qualification questions"],
            ["Cost per installed system from paid", "$2,000 to $5,000", "Close rate, follow-up discipline"],
            ["Average residential system value", "$18,000 to $35,000", "System size, battery add-on, region"],
          ],
        },
      },
      {
        heading: "The outreach angle: efficiency, not volume",
        level: 2,
        body: "Open with a number the owner already worries about. 'You are running ads in [City] and your site takes six seconds to load on a phone' is a stronger first line than any offer of more leads. Follow with one proof point and one specific fix.",
        callout: {
          title: "Solar first-touch email",
          text: "Subject: your [City] ads\n\nHi [first name],\n\nSaw [Business] is running Meta ads in [City] this week. Nice creative. The page they land on scores [website score]/100 on mobile and there is no text-back when someone fills the form.\n\nIn solar that usually means paying for appointments that never get set.\n\nI can show you the three fixes we would make first, in ten minutes, no deck. Open to it?",
        },
      },
      {
        heading: "Where to find solar installers worth calling",
        level: 2,
        body: "High-utility-rate states and sunbelt metros still carry the deepest installer pools, and storm-prone regions are seeing roofers add solar. Run Solar, Electrical and Roofing searches in Contractor Leads for the same metro, filter for active Meta ads, and sort by website score. The installers at the bottom of that sort are spending money and losing it, which is exactly who an efficiency pitch is for.",
      },
    ],
  },

  // 4. Apollo vs Google Maps scraper
  {
    slug: "apollo-vs-google-maps-scraper",
    type: "cluster",
    title: "Apollo.io vs Google Maps Scraper vs Contractor Leads: Which Finds Local Contractors?",
    titleTag: "Apollo vs Google Maps Scraper for Contractor Leads: Compared",
    metaDescription:
      "Apollo.io, Google Maps scrapers and Contractor Leads compared for finding local contractors: data source, owner contacts, scoring, legality, cost and the right tool for each job.",
    primaryKeyword: "apollo vs google maps scraper",
    secondaryKeywords: [
      "apollo io vs google maps",
      "google maps scraper vs apollo",
      "best tool to find local business leads",
      "apollo alternative for local businesses",
      "google maps lead extractor",
      "local business lead generation tools",
    ],
    searchVolume: "880/mo",
    growth: "+55%",
    cluster: "tools",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "general-contractors"],
    directAnswer:
      "Apollo.io is a B2B contact database built for companies with employees on LinkedIn, so it is thin on owner-run contractors. A Google Maps scraper copies public listing fields such as name, phone, website and rating, but gives you no owner name, no scoring and no outreach, and automated scraping can conflict with Google's terms. Contractor Leads sits between them: it queries live Google Places data inside the platform, adds owner enrichment from the business website, scores each lead on marketing gaps, checks Meta ad status and writes the outreach. Use Apollo for corporate B2B, a scraper for raw one-off lists, and Contractor Leads for selling to home-service contractors.",
    summary:
      "A straight comparison of the three ways agencies build contractor lists, with a decision table, cost comparison and the legal considerations most scraper guides skip.",
    faqs: [
      {
        q: "Does Apollo.io have contractor leads?",
        a: "Apollo has some construction and home-services companies, but coverage of small owner-operated contractors is thin because its data is built around corporate employees and LinkedIn profiles. Many roofers, plumbers and HVAC shops exist only on Google Maps and their own website, which is where Contractor Leads looks.",
      },
      {
        q: "Is a Google Maps scraper legal?",
        a: "Collecting public business information is common, but automated scraping of the Google Maps interface can breach Google's Terms of Service, and privacy rules such as GDPR, PECR and CAN-SPAM govern how you contact people. Contractor Leads works from Google Places data within its own platform and focuses on business contacts. This is not legal advice; check the rules for your market.",
      },
      {
        q: "Which is cheapest?",
        a: "A Chrome scraper extension is cheapest for a one-off list at roughly $15 to $50 a month. Apollo starts around $49 per user per month on annual billing for paid plans. Contractor Leads starts at $19.99 a month for 500 credits after 10 free leads, and each credit includes scoring, enrichment and outreach generation that the other two do not provide.",
      },
      {
        q: "Can I use Apollo and Contractor Leads together?",
        a: "Yes, and some agencies do. Apollo for corporate accounts such as property management firms, franchisors and building-products companies; Contractor Leads for the local contractors those companies serve. Both push to the same CRM through webhooks.",
      },
    ],
    sections: [
      {
        heading: "Three tools, three different jobs",
        level: 2,
        body: "The comparison only makes sense once you name the job. Apollo.io answers 'who works at this company and what is their email'. A Google Maps scraper answers 'what businesses of this type exist in this area'. Contractor Leads answers 'which contractors in this market should my agency call first, who owns them, and what do I say'. Agencies run into trouble when they use the first two tools for the third job.",
      },
      {
        heading: "Side-by-side comparison",
        level: 2,
        body: "What each tool returns for a search such as 'roofing contractors in Dallas':",
        table: {
          headers: ["Dimension", "Apollo.io", "Google Maps scraper", "Contractor Leads"],
          rows: [
            ["Data source", "Stored B2B contact database", "Public Maps listing fields at scrape time", "Live Google Places data at search time, plus Yelp and the business website"],
            ["Coverage of owner-run contractors", "Thin", "Complete for listed businesses", "Complete for listed businesses"],
            ["Owner or decision-maker name", "If they have a LinkedIn profile", "No", "Read from the business website; blank if unverified"],
            ["Marketing gap scoring", "No", "No", "Website, SEO, PPC and marketing scores 0 to 100"],
            ["Meta ad status", "No", "No", "Checked per lead"],
            ["Outreach generation", "Generic sequences", "No", "Per-lead email, SMS and call scripts"],
            ["CRM hand-off", "Native integrations", "CSV", "Webhooks to GoHighLevel, HubSpot, Zapier, Make, Slack; CSV and Excel"],
            ["Terms-of-service risk", "Low", "Can breach Google ToS", "Low; runs on Places data within the platform"],
            ["Entry price", "Free tier; paid from about $49 per user per month annual", "$15 to $50 per month for extensions", "10 free leads; $19.99 per month for 500 credits"],
          ],
        },
      },
      {
        heading: "Where Apollo.io wins",
        level: 2,
        body: "If your agency sells to companies with departments, Apollo is excellent: verified work emails, titles, technographics, intent signals and sequencing. Franchise brands, building-product manufacturers, property management groups and commercial GCs with 50 or more employees are all well covered. The problem is the local trades: a three-truck plumbing company usually has no one on LinkedIn, so Apollo has nothing to return.",
      },
      {
        heading: "Where a Google Maps scraper wins",
        level: 2,
        body: "For a one-time list of every business in a category and radius, a scraper is fast and cheap. You get names, addresses, phones, websites, ratings and review counts. What you do not get is anything that tells you who to call first or who to ask for. Every row still needs an owner lookup, a site audit, an Ads Library check and a hand-written first line, which is where the real cost lands. There is also the terms-of-service question, which most scraper vendors leave to you.",
      },
      {
        heading: "Where Contractor Leads wins",
        level: 2,
        body: "Contractor Leads is built for one buyer: agencies and sales teams whose customers are contractors. It does what you would otherwise do by hand after a scrape. Each lead arrives with four scores and a tier, the owner's name when the business website names one, Meta ad status, reputation signals and a generated first touch. Credits are charged per lead returned, re-exports are free and the pipeline CRM feeds your CRM of record.",
        bullets: [
          "Agency selling websites: sort by website score ascending",
          "PPC shop: sort by PPC score ascending, filter to businesses not running Meta ads",
          "SEO agency: filter to strong reviews with low SEO score",
          "Appointment setters: take the Hot tier, generate call scripts, push to the dialer via webhook",
        ],
      },
      {
        heading: "Decision guide",
        level: 2,
        body: "Pick by who you are selling to, not by which tool has the longest feature list.",
        table: {
          headers: ["If you sell to", "Use"],
          rows: [
            ["Corporate B2B accounts with LinkedIn presence", "Apollo.io"],
            ["Any local business category, one-off raw list, you will enrich manually", "Google Maps scraper, within the terms you are comfortable with"],
            ["Home-service contractors: roofing, HVAC, plumbing, electrical, solar and 13 more trades", "Contractor Leads"],
            ["Both corporate accounts and the contractors they serve", "Apollo for the accounts, Contractor Leads for the contractors, one CRM"],
          ],
        },
      },
      {
        heading: "Test it on your own market",
        level: 2,
        body: "Export your current contractor contacts from Apollo or your last scrape, then run the same trade and city in Contractor Leads. Count how many records return an owner name, a score and ad status. Your first 10 leads are free, so the comparison costs nothing. See the Apollo alternative and Google Maps scraper pages for a deeper look at each.",
      },
    ],
  },

  // 5. How to sell SEO to contractors
  {
    slug: "how-to-sell-seo-to-contractors",
    type: "cluster",
    title: "How to Sell SEO to Contractors: Audit, Pitch and Pricing That Closes",
    titleTag: "How to Sell SEO to Contractors: Audit, Pitch and Pricing",
    metaDescription:
      "How to sell SEO services to contractors: who to target, the 5-minute audit that proves the gap, pitch scripts, pricing tiers and the objections roofers, plumbers and HVAC owners raise.",
    primaryKeyword: "how to sell seo to contractors",
    secondaryKeywords: [
      "selling seo to contractors",
      "how to sell seo services",
      "seo for contractors pricing",
      "contractor seo agency",
      "how to pitch seo to small businesses",
      "local seo for contractors",
    ],
    searchVolume: "720/mo",
    growth: "+31%",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 11,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "remodeling", "general-contractors"],
    directAnswer:
      "To sell SEO to contractors, target businesses that already have strong reviews and a working paid or referral channel but rank poorly for their city plus trade, show them a five-minute audit with the exact searches they are missing and who is winning them, price the retainer against the value of one extra job a month, and commit to reporting on calls and booked jobs rather than rankings. Contractors buy SEO when the gap is visible, the payback is framed in jobs, and the agency is not asking them to abandon a channel that currently works.",
    summary:
      "A step-by-step sales process for SEO retainers in home services: targeting, the audit that proves the gap, the pitch, pricing tiers, objection handling and what to report.",
    faqs: [
      {
        q: "How much should an agency charge a contractor for SEO?",
        a: "Local SEO for a single-location contractor typically runs $1,000 to $2,500 a month. Multi-location or multi-service companies pay $2,500 to $6,000. Price against job value: a roofer closing one extra $12,000 roof a month from organic search can justify a $2,000 retainer easily, a handyman cannot.",
      },
      {
        q: "How long before a contractor sees SEO results?",
        a: "Google Business Profile improvements often show within four to eight weeks. Organic rankings for city plus service terms usually take three to nine months depending on competition. Set this expectation in the first call and sell GBP work as the early win.",
      },
      {
        q: "Which contractors are the best SEO clients?",
        a: "Businesses with 4.5 stars or better, 50 or more reviews, a working website and at least one paid or referral channel that keeps the lights on while rankings build. Contractor Leads flags these as strong reputation with low SEO score.",
      },
      {
        q: "Should I sell SEO or Local Services Ads first?",
        a: "If the contractor has no steady lead flow, sell LSAs or search ads first and layer SEO on once they can fund a longer payback. If they already run paid channels profitably, SEO is the natural next retainer because it lowers blended cost per lead over time.",
      },
    ],
    sections: [
      {
        heading: "Who to target, and who to skip",
        level: 2,
        body: "SEO is a slow channel, so sell it to contractors who can wait. The best profile has strong reviews, a site that works, and a paid or referral channel producing revenue today. Skip contractors with no reviews, no website or an urgent cash problem; they need calls this week and will churn before rankings arrive. In Contractor Leads, filter for rating 4.5 and above with an SEO score under 40 to build this list in a minute.",
      },
      {
        heading: "The five-minute audit that proves the gap",
        level: 2,
        body: "Contractors do not buy rankings. They buy the calls they can see going to a competitor. Your audit should take five minutes to produce and sixty seconds to understand.",
        bullets: [
          "Search '[trade] [city]' and '[top service] [city]' and screenshot the map pack and first page",
          "Mark where the prospect appears, if at all, and who holds the top three spots",
          "Note review counts for each: it explains the map pack better than any backlink metric",
          "Run the prospect's site on a phone and note load time and whether the phone number is tappable",
          "Estimate monthly searches for the three terms and convert to calls at a conservative rate",
        ],
        callout: {
          title: "One-line summary for the owner",
          text: "'For \"roof replacement Fort Worth\", you do not appear on page one. ABC Roofing and Lone Star Roofing hold the map pack with 210 and 180 reviews. You have 140 reviews and a better rating, so this is fixable. At even 20 extra calls a month that is roughly two roofs.'",
        },
      },
      {
        heading: "The pitch: jobs, not keywords",
        level: 2,
        body: "Translate everything into jobs. Rankings, authority and content are how you work; booked estimates are what the owner pays for. Structure the call as gap, cause, fix, payback.",
        table: {
          headers: ["Stage", "What you say", "What you show"],
          rows: [
            ["Gap", "Here are the searches in your city you are not showing up for", "Map pack screenshots"],
            ["Cause", "Here is why: profile, pages, reviews, speed", "Three specific issues, no jargon"],
            ["Fix", "Here is what we do in the first 90 days", "Month-by-month plan on one page"],
            ["Payback", "Here is what one extra job a month covers", "Retainer vs average ticket"],
          ],
        },
      },
      {
        heading: "Pricing tiers that match contractor types",
        level: 2,
        body: "Three tiers keep the conversation simple and let the owner choose rather than negotiate.",
        table: {
          headers: ["Tier", "Fits", "Scope", "Monthly"],
          rows: [
            ["Foundation", "Single location, under $1M revenue", "GBP optimization, reviews, five service pages, monthly report", "$1,000 to $1,500"],
            ["Growth", "Single location, $1M to $5M", "Foundation plus location pages, content, citations, call tracking", "$1,500 to $3,000"],
            ["Market leader", "Multi-location or multi-trade", "Growth plus per-location strategy, technical SEO, conversion work", "$3,000 to $6,000"],
          ],
        },
      },
      {
        heading: "Objections and answers",
        level: 2,
        body: "You will hear the same five objections from almost every contractor.",
        bullets: [
          "'I already pay for ads.' Good. SEO lowers your blended cost per lead over time; we are not replacing ads.",
          "'The last SEO company did nothing.' Ask what they reported. If it was rankings and traffic, promise calls and jobs instead, with call tracking.",
          "'It takes too long.' Agree, then sell the GBP work as the 30-day win and SEO as the compounding layer.",
          "'My nephew does our website.' Keep the nephew. You are selling visibility and calls, not a redesign.",
          "'Too expensive.' Return to the one-job math. If the math does not work for their ticket size, they are not a fit and you should say so.",
        ],
      },
      {
        heading: "What to report every month",
        level: 2,
        body: "Report what the owner can verify: tracked calls from organic and GBP, form fills, booked estimates where they will share them, map pack positions for the ten terms you agreed on, and review count growth. Put rankings on the second page. Agencies that report calls keep contractor clients for years; agencies that report keyword positions get cancelled in month four.",
      },
      {
        heading: "Build the prospect list",
        level: 2,
        body: "Run a Contractor Leads search for the trade and metro you want, sort by SEO score ascending and filter to 4.5 stars and above. Open the top results, confirm the owner name, generate the first email from the audit in Outreach Studio and save the Hot tier to your pipeline. Pair this guide with our roofing SEO post for a worked example of the deliverables.",
      },
    ],
  },

  // 6. Cold calling contractors script
  {
    slug: "cold-calling-contractors-script",
    type: "cluster",
    title: "Cold Calling Contractors: Scripts, Timing and Openers That Get Past the Office",
    titleTag: "Cold Calling Contractors: Scripts and Openers That Work",
    metaDescription:
      "Cold calling contractors for agency sales: when to call, how to get past the office, openers that reference the owner's own business, voicemail scripts and a follow-up cadence.",
    primaryKeyword: "cold calling contractors",
    secondaryKeywords: [
      "cold call script for contractors",
      "cold calling script for marketing agency",
      "how to cold call contractors",
      "contractor cold call opener",
      "agency cold calling script",
      "b2b cold calling home services",
    ],
    searchVolume: "590/mo",
    growth: "+27%",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 10,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "electrical", "painting"],
    directAnswer:
      "Cold calling contractors works when you call the owner by name, reference something specific about their business in the first ten seconds, and ask for a short follow-up rather than a sale. Call between 7:00 and 8:30 in the morning or after 4:00 in the afternoon when owners are not on job sites, send a short email first so the call is not truly cold, and keep the opener to one observation and one question. Contractor Leads supplies the owner's name, scores and ad status that make the opener specific, and generates a call script per lead.",
    summary:
      "A practical cold-calling guide for agencies selling to roofers, plumbers, HVAC and other trades: timing, gatekeepers, four openers, voicemail, objection handling and a cadence that pairs calls with email and SMS.",
    faqs: [
      {
        q: "What is the best time to cold call contractors?",
        a: "Early morning between 7:00 and 8:30, before crews leave, and late afternoon after 4:00 when owners are back in the truck or office. Midday calls usually reach a dispatcher or voicemail. Tuesday through Thursday outperform Mondays, which are dispatch-heavy, and Fridays.",
      },
      {
        q: "How do I get past the office manager?",
        a: "Ask for the owner by first name as if you expect to be put through, state the reason in one specific sentence about their business, and never say 'marketing' in the first line. If they ask what it is about, say you noticed something on their Google listing and wanted to flag it to the owner directly.",
      },
      {
        q: "Should I email before I cold call?",
        a: "Yes. A two-line email the day before turns a cold call into a warm follow-up: 'Sent you a quick note yesterday about your Google listing.' Response rates on the call roughly double when the owner recognizes the context, and the email gives you a reason to call.",
      },
      {
        q: "How many touches before I give up on a contractor?",
        a: "Six to eight touches across email, SMS and phone over three weeks is a reasonable cadence for an owner-run business. After that, move the lead to a quarterly nurture rather than deleting it; contractor priorities change with the season.",
      },
    ],
    sections: [
      {
        heading: "Why contractor cold calls fail",
        level: 2,
        body: "Three reasons, in order. The caller does not know the owner's name and asks for 'the person who handles marketing', which no three-truck company has. The caller opens with their agency instead of the contractor's business. And the caller asks for a 30-minute meeting on the first call. Fix those three and cold calling contractors becomes one of the highest-yield channels an agency has, because almost no one else does it well.",
      },
      {
        heading: "Before you dial: the 30-second research pass",
        level: 2,
        body: "You need four facts: the owner's first name, their rating and review count, one visible gap, and one competitor winning that gap. Contractor Leads puts all four on the lead card, including owner enrichment from the business website, website, SEO and PPC scores, and Meta ad status. If you are doing it by hand, check the website's About page, the Google listing and the Meta Ads Library.",
      },
      {
        heading: "Timing and cadence",
        level: 2,
        body: "Contractors live by the job schedule, so call around it.",
        table: {
          headers: ["Window", "Who answers", "Use it for"],
          rows: [
            ["7:00 to 8:30 am", "Owner, before crews roll", "First calls and callbacks"],
            ["9:00 am to 3:30 pm", "Office or dispatcher", "Gatekeeper conversations, booking a callback time"],
            ["4:00 to 6:00 pm", "Owner, heading back", "Follow-ups and closing the meeting"],
            ["Rainy days", "Everyone", "Best day of the month for exterior trades"],
          ],
        },
      },
      {
        heading: "Getting past the office",
        level: 2,
        body: "The office manager's job is to protect the owner's time, so make your call sound like it belongs on the owner's list.",
        callout: {
          title: "Gatekeeper script",
          text: "'Hi, is Mike in? [Pause] It is [your name]. I noticed something on [Business]'s Google listing this morning that he will want to know about. It will take two minutes. Is he in the office or out on a job?'\n\nIf asked what company: '[Agency], I work with roofers in [City]. It is about the listing, not a sales pitch today. When is he usually back in?'",
        },
      },
      {
        heading: "Four openers, by gap",
        level: 2,
        body: "The opener is one observation about their business and one question. Pick the version that matches the gap you found.",
        bullets: [
          "No website: 'Mike, it is [name]. [Business] has 4.8 stars and 90 reviews, and no website on your Google listing. People are finding you and then calling the next guy down. Has anyone mentioned that?'",
          "Weak rankings: 'Mike, quick one. When I search roof replacement [City], ABC Roofing comes up first and you are not on the page, even though you have more reviews. Did you know that?'",
          "No Local Services Ads: 'Mike, two plumbers in [City] have the Google Guaranteed badge for emergency calls and you do not. Those are the best calls in your market. Is that on purpose?'",
          "Running Meta ads badly: 'Mike, saw your Facebook ads this week, good creative. The page they land on takes six seconds on a phone. Are you seeing the appointment numbers you expected?'",
        ],
      },
      {
        heading: "The ask: ten minutes, not a meeting",
        level: 2,
        body: "Once the owner engages, ask for a ten-minute screen share where you show the searches live. Offer two times, both early or late. Do not pitch services on the first call; the goal is the second conversation. If they want to talk now, walk through the gap and the first fix, then book the follow-up with a specific agenda.",
      },
      {
        heading: "Voicemail that gets a callback",
        level: 2,
        body: "Most calls will hit voicemail. Keep it under 20 seconds, lead with the observation and leave your number twice.",
        callout: {
          title: "Voicemail",
          text: "'Mike, [name] at [Agency]. Calling about [Business]'s Google listing. You have great reviews and no website attached, so a lot of those searches are going to [Competitor]. Two-minute fix. My number is [number], again [number]. I will also send a short email.'",
        },
      },
      {
        heading: "Objections on the phone",
        level: 2,
        body: "Contractors are direct, so be direct back.",
        bullets: [
          "'Not interested.' 'Fair enough. Can I send the screenshot so you have it? Takes me ten seconds.' Most say yes, and the email keeps the lead alive.",
          "'We are too busy.' 'That is the best time to fix this, while you can be choosy about jobs. Ten minutes next week?'",
          "'Send me something.' 'Will do. What is the best email? I will include the search results so you can see it yourself.'",
          "'We already have someone.' 'Great. Are they getting you into the map pack for [service]? If yes, ignore me. If not, that is the only thing I would look at.'",
        ],
      },
      {
        heading: "The three-week cadence",
        level: 2,
        body: "Pair calls with email and SMS so no touch is truly cold. Day 1 email, day 2 call and voicemail, day 3 SMS referencing the voicemail, day 6 email with the screenshot, day 8 call, day 12 SMS, day 15 call, day 20 break-up email. Generate each email and SMS from the lead's audit in Outreach Studio so every touch references the same gap, then log outcomes in the pipeline so the next rep does not start from zero.",
      },
    ],
  },
];
