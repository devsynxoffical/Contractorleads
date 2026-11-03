import type { BlogPost } from "@/lib/blog-content";

const AUTHOR = {
  name: "Vaishali Kapoor",
  role: "Founder, Contractor Leads",
  bio: "Vaishali leads product and growth at Contractor Leads, helping marketing agencies prospect, score, and close high-ticket home-service contractors.",
  image: "/marketing/founder-portrait.jpg",
};

const PUBLISHED = "2026-11-03";

/**
 * Fifth wave (trade playbooks + deliverability): general contractors, remodelers,
 * pest control, concrete, cleaning companies, and email warmup for cold outreach.
 * Body text may use [label](/path) for inline links; first mentions of key topics
 * are also auto-linked by LinkedText.
 */
export const TRADE_GUIDE_POSTS: BlogPost[] = [
  // 1. General contractor leads
  {
    slug: "general-contractor-leads",
    type: "cluster",
    title: "General Contractor Leads: How Agencies Find and Win GC Clients",
    titleTag: "General Contractor Leads for Agencies: Find & Win GC Clients",
    metaDescription:
      "How agencies find and win general contractor leads: where GC leads come from, residential vs commercial builders, what GCs buy and an outreach plan.",
    primaryKeyword: "general contractor leads",
    secondaryKeywords: [
      "leads for general contractors",
      "general contractor clients",
      "marketing for general contractors",
      "construction company leads",
      "residential general contractor leads",
    ],
    searchVolume: "est. 1,000-2,500/mo",
    growth: "steady",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["general-contractors", "remodeling", "home-improvement", "concrete"],
    directAnswer:
      "To find general contractor leads, pull GC and construction companies by city from Google Maps or a lead tool, then split them into residential builders, remodel-focused GCs and commercial contractors. The best agency clients are owner-run residential and remodel GCs with strong reviews, a dated or missing website and no paid ads. They buy project-gallery websites, Google Business Profile management, review generation and search ads for high-ticket jobs such as additions, kitchens and custom homes, and they judge you on booked estimates rather than clicks.",
    summary:
      "Where general contractor leads come from, how to qualify them by segment, the marketing gaps that signal a sale, what GCs buy, and a four-touch outreach plan.",
    faqs: [
      {
        q: "Where can I find general contractor leads?",
        a: "Google Maps is the richest free source because almost every GC keeps a Business Profile with reviews, a phone number and often a website. Lead tools such as Contractor Leads pull those profiles in bulk by city or state and add owner names, verified emails and opportunity scores. State contractor licence boards and local builders' associations are useful second sources for verifying that a company is active.",
      },
      {
        q: "Are residential or commercial general contractors better clients for an agency?",
        a: "For most agencies, residential and remodel-focused GCs are better. They depend on homeowners finding them online, their owners decide quickly, and a single extra project can pay for a year of marketing. Commercial GCs win work through bids, relationships and prequalification, so search marketing moves their pipeline less.",
      },
      {
        q: "What marketing do general contractors pay for?",
        a: "The most common buys are a website with project galleries and service-area pages, Google Business Profile and review management, Google Ads for high-ticket keywords such as home additions or custom homes, and a simple CRM or follow-up system for estimates. Larger GCs add video, recruiting campaigns and retargeting.",
      },
      {
        q: "How much is a general contractor client worth to an agency?",
        a: "Retainers for owner-run GCs commonly sit between $1,000 and $3,500 a month plus ad spend, depending on the scope. Because projects are large, clients tend to stay as long as you can show booked estimates and signed jobs.",
      },
    ],
    sections: [
      {
        heading: "Why general contractors are strong agency clients",
        level: 2,
        body: "A general contractor's average project is large, so one extra signed job per quarter usually covers your fee several times over. That makes the sale easier than with low-ticket trades, as long as you talk about projects and margin rather than traffic. GCs also tend to need several services at once, which is why the [general contractor lead finder](/industries/general-contractors) shows multi-channel opportunity scores rather than a single gap.",
        bullets: [
          "High average project value: additions, kitchens, custom homes and commercial fit-outs",
          "Long project cycles, so a steady pipeline of estimates matters more than volume",
          "Owners often run sales themselves and feel slow months immediately",
          "Many still rely on referrals and have little search presence to compete with",
        ],
      },
      {
        heading: "Where general contractor leads come from",
        level: 2,
        body: "Start with Google Maps, because a GC without a Business Profile is rarely worth pitching. Search by city and category, or use the [Google Maps scraper](/google-maps-scraper) to export every profile with reviews, phone, website and address in one pass. Then enrich the list with owner names and verified emails; our guide to [finding a business owner's name](/blog/how-to-find-business-owner-name) covers the manual methods if you are working by hand.",
        table: {
          headers: ["Source", "What you get", "Best used for"],
          rows: [
            ["Google Maps / Business Profiles", "Name, phone, site, reviews, category", "Building the base list by city"],
            ["Lead tool with enrichment", "Owner name, verified email, gap scores", "Prioritising and outreach"],
            ["State licence board", "Licence status and classification", "Confirming the company is active"],
            ["Local builders' association", "Member directory", "Finding established, reputable firms"],
            ["Building permit data", "Recent permitted projects", "Spotting firms that are actively growing"],
          ],
        },
      },
      {
        heading: "Qualify by segment before you pitch",
        level: 2,
        body: "\"General contractor\" covers very different businesses. Sort your list into segments first, because each one buys differently and needs its own message.",
        table: {
          headers: ["Segment", "How they win work", "Fit for an agency"],
          rows: [
            ["Residential remodel GC", "Homeowner searches, reviews, referrals", "Excellent: search and reviews drive jobs"],
            ["Custom home builder", "Referrals, portfolio, local reputation", "Good: portfolio site, video, Google Ads"],
            ["Small commercial / tenant fit-out", "Relationships with property managers", "Fair: LinkedIn, case studies, email"],
            ["Large commercial GC", "Bids and prequalification", "Weak: marketing rarely changes win rate"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Look for a mismatch between reputation and visibility. A GC with dozens of five-star reviews and a weak website is leaving projects to competitors who simply show up better.",
        bullets: [
          "Strong reviews but no website, or a site without project photos",
          "No pages for the high-ticket services they actually sell, such as additions or kitchens",
          "No Google Ads or Local Services Ads while competitors run them",
          "Unanswered reviews and an outdated Business Profile",
          "Slow or no response to a website enquiry (test it before you call)",
        ],
        callout: {
          title: "Quick qualifier",
          text: "Search \"general contractor near me\" from the prospect's city. If they are not in the top three map results but have more reviews than someone who is, you have your opening line.",
        },
      },
      {
        heading: "What to offer general contractors first",
        level: 2,
        body: "Lead with the fastest visible win, then expand. A cleaned-up Business Profile with project photos and review replies shows results in weeks (see our [Google Business Profile optimization guide](/blog/google-business-profile-optimization-for-contractors)). Follow with a project-gallery website and search ads on high-ticket terms. If they are weak on the web entirely, our playbook on [selling websites to contractors](/blog/how-to-sell-websites-to-contractors) applies directly.",
        table: {
          headers: ["Offer", "Why GCs buy it", "Typical price range"],
          rows: [
            ["Business Profile + review management", "Fast, visible improvement in map rankings", "$300-$800/mo"],
            ["Project-gallery website", "Proof of quality for high-ticket buyers", "$3,000-$10,000 one-off"],
            ["Google Ads on high-ticket terms", "Direct, trackable estimate requests", "$750-$2,000/mo + spend"],
            ["Estimate follow-up system", "Recovers quotes that go quiet", "$200-$500/mo"],
          ],
        },
      },
      {
        heading: "A four-touch outreach plan for GCs",
        level: 2,
        body: "Keep outreach short and specific to their projects. A useful rhythm over two weeks:",
        bullets: [
          "Day 1: a short cold email naming one visible gap and one nearby competitor that outranks them",
          "Day 3: a cold call referencing the email (our [cold calling script](/blog/cold-calling-contractors-script) has openers that work with busy owners)",
          "Day 7: a follow-up email with a 60-second screen recording of their map ranking",
          "Day 14: a final note offering a free estimate-flow audit",
        ],
      },
      {
        heading: "Mistakes to avoid",
        level: 2,
        body: "The most common mistake is pitching traffic. GCs do not care about visitors; they care about qualified estimates for the jobs they want. Avoid pitching large commercial contractors with search marketing, avoid long contracts before you have shown results, and never promise a number of signed projects you cannot control. Report on estimate requests, booked site visits and the value of quotes issued.",
      },
    ],
  },

  // 2. Remodeling contractor leads
  {
    slug: "remodeling-contractor-leads",
    type: "cluster",
    title: "Remodeling Contractor Leads: How Agencies Find and Win Remodelers",
    titleTag: "Remodeling Contractor Leads for Agencies (2026 Guide)",
    metaDescription:
      "How agencies find and win remodeling contractor leads: kitchen, bath and whole-home remodelers, gaps that signal a sale, lead costs and what they buy.",
    primaryKeyword: "remodeling contractor leads",
    secondaryKeywords: [
      "remodeling leads",
      "kitchen remodeling leads",
      "bathroom remodeling leads",
      "marketing for remodelers",
      "home remodeling clients",
    ],
    searchVolume: "est. 1,000-3,000/mo",
    growth: "steady",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["remodeling", "home-improvement", "flooring", "windows-and-doors"],
    directAnswer:
      "Agencies find remodeling contractor leads by pulling kitchen, bath and whole-home remodelers from Google Maps or a lead tool, then prioritising owner-run firms with strong reviews but thin project galleries, no service pages for their best-paying work and no paid search. Remodelers sell large, considered projects, so they buy marketing that builds trust before the first call: portfolio websites, review generation, Google Ads on kitchen and bathroom terms, and nurture emails for homeowners who are not ready yet.",
    summary:
      "Where remodeling leads come from, how to qualify remodelers, what homeowner leads cost them, and the offers that turn into long retainers.",
    faqs: [
      {
        q: "How much does a remodeling lead cost a contractor?",
        a: "Remodeling leads are among the most expensive in home services because projects are large. Search ad leads for kitchen and bathroom remodels commonly cost $80 to $250 or more in competitive metros, and shared leads from marketplaces are cheaper but often go to several contractors at once. That high cost is exactly why remodelers value an agency that brings exclusive leads.",
      },
      {
        q: "Which remodelers make the best agency clients?",
        a: "Owner-run kitchen, bathroom and whole-home remodelers with a few crews or trusted subcontractors. They have enough margin per project to fund marketing, and the owner usually makes decisions quickly.",
      },
      {
        q: "What should a remodeling contractor's website include?",
        a: "Project galleries organised by room, before-and-after photos, clear service pages for kitchens, bathrooms, basements and additions, honest price-range guidance, reviews near every call to action, and an easy consultation request form.",
      },
      {
        q: "Why do remodelers need nurture marketing?",
        a: "Homeowners often research a remodel for months. Email and retargeting keep the remodeler in view until the homeowner is ready, so fewer leads are lost to whichever contractor happened to call last.",
      },
    ],
    sections: [
      {
        heading: "Why remodelers are high-value clients",
        level: 2,
        body: "A single kitchen or bathroom project can be worth more than a month of your retainer, so remodelers are comfortable investing in marketing once they trust you. Their sales cycle is long and visual, which rewards agencies that can build credibility online. Use the [remodeling lead finder](/industries/remodeling) to pull remodelers by city and compare their review strength with their web presence.",
      },
      {
        heading: "Where remodeling leads come from",
        level: 2,
        body: "Most remodelers keep a Google Business Profile, so Maps is the base list. Add Houzz and similar portfolio sites, which show who invests in their image, and permit data for kitchens and additions, which shows who is busy. Enrich the list with owner names and verified emails before you reach out.",
        table: {
          headers: ["Source", "Signal it gives you"],
          rows: [
            ["Google Maps / Business Profiles", "Reviews, rating, website, category, phone"],
            ["Houzz and portfolio sites", "Project photos and how much they invest in image"],
            ["Building permits", "Recent kitchen, bath and addition projects"],
            ["Supplier and showroom partners", "Remodelers who are actively buying materials"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Remodeling buyers judge quality from photos and reviews, so visual gaps are the clearest openings.",
        bullets: [
          "Great reviews but few or poor project photos",
          "One generic \"services\" page instead of pages for kitchens, bathrooms and basements",
          "No Google Ads while competitors bid on \"kitchen remodel near me\"",
          "Slow replies to website enquiries, or no form at all",
          "Relying on shared marketplace leads they complain about",
        ],
      },
      {
        heading: "What remodeling leads cost, by source",
        level: 2,
        body: "Showing a remodeler what they pay per lead today is a strong opening, because most have never calculated it. Ranges vary by metro; see our breakdown of [what contractor leads cost](/blog/how-much-do-contractor-leads-cost) for more context.",
        table: {
          headers: ["Lead source", "Typical cost per lead", "Exclusive?"],
          rows: [
            ["Google search ads", "$80-$250+", "Yes"],
            ["Local Services Ads", "$40-$150", "Yes"],
            ["Meta (Facebook/Instagram) ads", "$30-$120", "Yes"],
            ["Shared lead marketplaces", "$20-$100", "No, sent to several contractors"],
            ["Referrals and past clients", "Low, but limited volume", "Yes"],
          ],
        },
      },
      {
        heading: "Offers that close remodelers",
        level: 2,
        body: "Start with trust, then add demand. A portfolio refresh and review programme makes every other channel convert better. Then add search ads on kitchen and bathroom terms and a simple email nurture for homeowners who are still deciding. [Meta ads](/blog/facebook-ads-for-contractors) work well for before-and-after creative in suburban markets.",
        bullets: [
          "Portfolio and project-gallery website with room-by-room pages",
          "Review generation after every completed project",
          "Google Ads on high-intent remodel terms",
          "Email and retargeting nurture for long-cycle homeowners",
        ],
      },
      {
        heading: "How to report results to a remodeler",
        level: 2,
        body: "Report on consultations booked, average project value quoted and projects signed. Remodelers think in pipeline value, so a monthly line showing \"quotes issued from marketing\" is far more persuasive than impressions or clicks. Agree on how leads are tracked (call tracking and form tags) before the first campaign launches.",
      },
    ],
  },

  // 3. Pest control leads
  {
    slug: "pest-control-leads",
    type: "cluster",
    title: "Pest Control Leads: How Agencies Find and Win Pest Control Companies",
    titleTag: "Pest Control Leads for Agencies: Find & Win Exterminators",
    metaDescription:
      "How agencies find and win pest control leads: where exterminators are, the seasonal calendar, the recurring-revenue pitch and the gaps that signal a sale.",
    primaryKeyword: "pest control leads",
    secondaryKeywords: [
      "pest control clients",
      "exterminator leads",
      "marketing for pest control companies",
      "pest control marketing agency",
      "pest control company leads",
    ],
    searchVolume: "est. 500-1,500/mo",
    growth: "seasonal",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["pest-control", "cleaning-services", "landscaping"],
    directAnswer:
      "To find pest control leads, pull exterminators and pest control companies by city from Google Maps or a lead tool, then target independent operators with good reviews but a weak website, few service pages and no Local Services Ads. Pest control runs on recurring service plans, so owners value marketing that adds long-term customers, not one-off jobs. The services they buy most are Local Services Ads, pest-specific landing pages, review generation and email or text campaigns that convert one-time treatments into quarterly plans.",
    summary:
      "Where pest control leads come from, the seasonal buying calendar, the recurring-revenue pitch that closes owners, and the gaps to look for.",
    faqs: [
      {
        q: "When is the best time to pitch pest control companies?",
        a: "Late winter and early spring, before peak insect season, when owners plan how to fill routes. Termite swarm season in spring and rodent season in autumn are also strong moments to pitch campaigns for those services.",
      },
      {
        q: "What marketing do pest control companies buy?",
        a: "Local Services Ads, Google Ads on pest-specific terms such as termite or bed bug treatment, landing pages for each pest, review generation, and email or text campaigns that turn one-time customers into recurring plans.",
      },
      {
        q: "Why is recurring revenue so important in pest control?",
        a: "Most of a pest control company's value comes from customers on quarterly or monthly plans. A new plan customer can be worth several times the first treatment over their lifetime, so owners will pay more to acquire plan customers.",
      },
      {
        q: "Do pest control companies use Local Services Ads?",
        a: "Yes. Pest control is one of the categories Local Services Ads covers in many markets, and the Google Guaranteed or Google Screened badge builds trust for a service where homeowners let technicians inside.",
      },
    ],
    sections: [
      {
        heading: "Why pest control is a strong niche for agencies",
        level: 2,
        body: "Pest control combines urgent demand with recurring revenue. A homeowner with mice or termites searches immediately and often calls the first trustworthy company they find, and a good company turns that call into an ongoing plan. That gives you a clear story: your marketing brings plan customers whose lifetime value dwarfs the cost per lead. Pull companies by market with the [pest control lead finder](/industries/pest-control).",
      },
      {
        heading: "Where pest control leads come from",
        level: 2,
        body: "Independent pest control companies almost always have a Business Profile, so Google Maps is the base list. Filter out national franchises unless you sell to franchise owners, and prioritise independents with steady reviews. Use our [Google Maps lead generation guide](/blog/google-maps-lead-generation) for the step-by-step export and filtering process.",
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Look for owners who are good at the work but invisible online for their most profitable services.",
        bullets: [
          "No separate pages for termites, rodents, bed bugs or mosquitoes",
          "Not running Local Services Ads in a market where competitors are",
          "Few recent reviews, or reviews with no replies",
          "No online booking or quote request",
          "No follow-up campaign to convert one-time treatments into plans",
        ],
      },
      {
        heading: "Seasonal outreach calendar",
        level: 2,
        body: "Pest demand moves with the weather, and owners plan marketing just before each peak.",
        table: {
          headers: ["Months", "Demand", "What to pitch"],
          rows: [
            ["Jan - Mar", "Planning for spring", "LSAs, pest pages, spring campaigns"],
            ["Mar - May", "Termite swarms, ants", "Termite landing pages and search ads"],
            ["Jun - Aug", "Peak insects, mosquitoes", "Review generation, quick wins"],
            ["Sep - Nov", "Rodents move indoors", "Rodent campaigns, plan conversion emails"],
            ["Dec", "Quiet season", "Annual retainers and next-year budget"],
          ],
        },
      },
      {
        heading: "The recurring-revenue pitch",
        level: 2,
        body: "Frame every offer in plan customers. Ask how many one-time treatments they did last year and how many became plans. A simple email and text sequence after each treatment often lifts plan sign-ups noticeably, and it costs the owner nothing in ad spend. Pair it with [Local Services Ads](/blog/local-service-ads) for new demand and you have both halves of the growth story.",
        callout: {
          title: "Opening line that works",
          text: "\"You did great work for these customers. How many of last year's one-time treatments are on a plan today? We help companies like yours turn more of them into recurring customers.\"",
        },
      },
      {
        heading: "Pricing and reporting",
        level: 2,
        body: "Retainers for independent pest control companies commonly run from $750 to $2,500 a month plus ad spend. Report on new plan customers, cost per plan customer and the share of one-time treatments that converted, because those are the numbers the owner already watches.",
      },
    ],
  },

  // 4. Concrete contractor leads
  {
    slug: "concrete-contractor-leads",
    type: "cluster",
    title: "Concrete Contractor Leads: How Agencies Find and Win Concrete Companies",
    titleTag: "Concrete Contractor Leads for Agencies (Driveways, Patios & More)",
    metaDescription:
      "How agencies find and win concrete contractors: residential vs commercial targeting, where the leads are, gaps that signal a sale, seasonality and offers.",
    primaryKeyword: "concrete contractor leads",
    secondaryKeywords: [
      "concrete leads",
      "concrete company leads",
      "marketing for concrete contractors",
      "concrete driveway leads",
      "concrete business clients",
    ],
    searchVolume: "est. 300-1,000/mo",
    growth: "seasonal",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["concrete", "fencing", "landscaping", "general-contractors"],
    directAnswer:
      "Concrete contractor leads come mostly from Google Maps: pull concrete companies by city, then focus on residential flatwork contractors (driveways, patios, sidewalks, stamped and decorative concrete) with good reviews but few project photos, no service pages and no ads. Concrete demand is seasonal and weather-driven, so owners buy marketing before spring. The offers that work are project-gallery websites, Google Business Profile management, review generation and search ads on driveway and patio terms.",
    summary:
      "Where concrete leads come from, residential vs commercial targeting, the gaps to look for, the seasonal calendar and what to sell.",
    faqs: [
      {
        q: "Which concrete contractors should an agency target?",
        a: "Residential flatwork and decorative concrete contractors. They sell directly to homeowners who search online, jobs are visual and easy to showcase, and owners decide quickly. Commercial and structural concrete firms mostly win work through general contractor relationships and bids.",
      },
      {
        q: "When do concrete contractors buy marketing?",
        a: "In late winter and early spring, before the pouring season starts in colder regions. In warm climates demand is steadier, but spring and early autumn are still the strongest periods.",
      },
      {
        q: "What services do concrete contractors need most?",
        a: "A website with project galleries for driveways, patios and stamped concrete, an active Google Business Profile with photos, review generation, and Google Ads or Local Services Ads for high-intent searches such as \"concrete driveway contractor near me\".",
      },
      {
        q: "How do I find the owner of a concrete company?",
        a: "Check the Business Profile, the website's about page, the state business registry and LinkedIn. Contractor Leads adds owner names and verified emails automatically for most companies.",
      },
    ],
    sections: [
      {
        heading: "Why concrete contractors are an overlooked niche",
        level: 2,
        body: "Most agencies chase roofers and HVAC companies, so concrete contractors receive far less marketing outreach. Many are excellent operators with strong reviews and almost no web presence, which makes them receptive to a clear, specific pitch. Use the [concrete lead finder](/industries/concrete) to see how many active companies are in your target cities.",
      },
      {
        heading: "Residential vs commercial concrete",
        level: 2,
        body: "Segment before you pitch. The work, the buyer and the marketing all differ.",
        table: {
          headers: ["Segment", "Typical jobs", "Agency fit"],
          rows: [
            ["Residential flatwork", "Driveways, patios, sidewalks, garage floors", "Excellent"],
            ["Decorative concrete", "Stamped, stained, polished, pool decks", "Excellent: very visual"],
            ["Foundations", "New homes and additions", "Fair: often sold through GCs"],
            ["Commercial / structural", "Slabs, tilt-up, parking structures", "Weak: bid and relationship driven"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Concrete work photographs well, so missing visuals are the clearest gap.",
        bullets: [
          "No website, or a site with no project photos",
          "No separate pages for driveways, patios and stamped concrete",
          "Business Profile with few photos and no recent updates",
          "Strong reviews but no ads in a market where competitors advertise",
          "No service-area pages for nearby towns",
        ],
      },
      {
        heading: "Seasonal outreach calendar",
        level: 2,
        body: "Pouring depends on temperature, so plan outreach around the season in each region.",
        table: {
          headers: ["Months", "Owner mindset", "What to pitch"],
          rows: [
            ["Jan - Mar", "Planning the season", "Website, GBP clean-up, spring ads"],
            ["Apr - Jun", "Booking fast", "Review generation, quick wins"],
            ["Jul - Sep", "Peak pouring", "Short check-ins only"],
            ["Oct - Nov", "Season winding down", "Results review, next-year planning"],
            ["Dec", "Off-season in cold regions", "Annual retainers"],
          ],
        },
      },
      {
        heading: "What to sell first",
        level: 2,
        body: "Start with a fast win on the Business Profile: new project photos, service categories and review replies. Then build a simple gallery website and add search ads on driveway and patio terms. Concrete companies often pair well with [landscaping](/blog/landscaping-leads) and fencing companies, so a referral or co-marketing angle can help you win several clients in one market. If they have no website at all, use the approach in our guide to [finding businesses without websites](/blog/how-to-find-businesses-without-websites).",
      },
    ],
  },

  // 5. Cleaning business leads
  {
    slug: "cleaning-business-leads",
    type: "cluster",
    title: "Cleaning Business Leads: How Agencies Find and Win Cleaning Companies",
    titleTag: "Cleaning Business Leads for Agencies: Residential & Commercial",
    metaDescription:
      "How agencies find and win residential and commercial cleaning companies: where cleaning business leads are, how to qualify them and what cleaners buy.",
    primaryKeyword: "cleaning business leads",
    secondaryKeywords: [
      "cleaning company leads",
      "cleaning service leads",
      "marketing for cleaning companies",
      "commercial cleaning leads",
      "house cleaning clients",
    ],
    searchVolume: "est. 500-2,000/mo",
    growth: "steady",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["cleaning-services", "pest-control", "pool-services"],
    directAnswer:
      "Agencies find cleaning business leads by pulling residential and commercial cleaning companies by city from Google Maps or a lead tool, then targeting owner-run firms with good reviews, a basic or missing website, no online booking and no ads. Cleaning is recurring, so owners value marketing that adds weekly or monthly clients and keeps them. The services cleaning companies buy most are booking-ready websites, Local Services Ads, review generation and email or text campaigns for repeat and referral business.",
    summary:
      "How to find and qualify cleaning companies, the difference between residential and commercial cleaning, the offers that work, and how to report results.",
    faqs: [
      {
        q: "Are residential or commercial cleaning companies better agency clients?",
        a: "Both can work, but they buy differently. Residential cleaners respond to search, Local Services Ads, reviews and online booking. Commercial cleaners win office and facility contracts through outreach, LinkedIn and case studies, so they value lead generation and email campaigns aimed at property and office managers.",
      },
      {
        q: "What do cleaning companies pay for marketing?",
        a: "Owner-run cleaning companies commonly spend $500 to $2,000 a month on an agency plus ad spend. Larger commercial cleaners with several crews spend more because a single contract can be worth thousands a month.",
      },
      {
        q: "What should a cleaning company's website include?",
        a: "Clear service pages (standard, deep, move-in/move-out, office), transparent starting prices or a quote calculator, online booking, trust signals such as insurance and background checks, and reviews next to every call to action.",
      },
      {
        q: "How do cleaning companies keep clients?",
        a: "Consistent teams, easy rescheduling and regular communication. Agencies can help with automated reminder and feedback messages, review requests after good visits, and referral offers for existing clients.",
      },
    ],
    sections: [
      {
        heading: "Why cleaning companies are good agency clients",
        level: 2,
        body: "Cleaning businesses grow on recurring clients, so each new weekly or bi-weekly customer is worth a lot over a year. Many are run by owners who started as cleaners and have little marketing experience, which makes a clear, simple offer attractive. Pull cleaning companies by city with the [cleaning services lead finder](/industries/cleaning-services).",
      },
      {
        heading: "Residential vs commercial cleaning",
        level: 2,
        body: "Decide which segment you serve, because the channels are different.",
        table: {
          headers: ["", "Residential cleaning", "Commercial cleaning"],
          rows: [
            ["Buyer", "Homeowners and renters", "Office, property and facility managers"],
            ["How they find a cleaner", "Search, maps, reviews, referrals", "Outreach, referrals, bids"],
            ["Best channels", "LSAs, Google Ads, reviews, booking", "Cold email, LinkedIn, case studies"],
            ["Contract value", "Lower, but recurring", "Higher, recurring contracts"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Look for small friction points that cost the owner bookings every week.",
        bullets: [
          "No online booking or instant quote",
          "No starting prices, so visitors leave to compare elsewhere",
          "Few recent reviews or no review replies",
          "No pages for deep cleaning, move-out or office cleaning",
          "Not running Local Services Ads where competitors are",
        ],
      },
      {
        heading: "Offers that work for cleaning businesses",
        level: 2,
        body: "Start with conversion, then add demand. A booking-ready website and a review programme make every lead more valuable, and [Local Services Ads](/blog/local-service-ads) bring new residential demand quickly. For commercial cleaners, a targeted cold email programme to office and property managers works well; our [cold email guide for agencies](/blog/cold-email-for-agencies) explains the structure.",
        table: {
          headers: ["Offer", "Best for", "Why it works"],
          rows: [
            ["Booking-ready website", "Residential", "Removes friction and captures leads at night"],
            ["Local Services Ads", "Residential", "Trusted badge and pay-per-lead pricing"],
            ["Review generation", "Both", "Reviews decide most cleaning bookings"],
            ["Cold email to managers", "Commercial", "Reaches decision makers directly"],
            ["Referral and repeat campaigns", "Both", "Cheapest new clients come from existing ones"],
          ],
        },
      },
      {
        heading: "How to report results",
        level: 2,
        body: "Report on new recurring clients, cost per recurring client and client retention. Cleaning owners think in recurring revenue, so show the monthly value of the clients your work added rather than leads or clicks.",
      },
    ],
  },

  // 6. Email warmup for cold email
  {
    slug: "email-warmup-for-cold-email",
    type: "cluster",
    title: "Email Warmup for Cold Email: How to Warm Up a Domain and Stay Out of Spam",
    titleTag: "Email Warmup for Cold Email: Warm Up a Domain the Right Way",
    metaDescription:
      "Email warmup for cold email: set up SPF, DKIM and DMARC, how long to warm up a new domain, safe daily sending limits and how to stay out of spam.",
    primaryKeyword: "email warmup",
    secondaryKeywords: [
      "how to warm up an email domain",
      "email warm up for cold email",
      "how long to warm up email",
      "cold email deliverability",
      "email warmup schedule",
    ],
    searchVolume: "est. 2,000-5,000/mo",
    growth: "growing",
    cluster: "tools",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 10,
    author: AUTHOR,
    relatedIndustries: [],
    directAnswer:
      "Email warmup means building a new mailbox's sending reputation gradually before you use it for cold email. Set up SPF, DKIM and DMARC on a separate sending domain, then send a small number of real, engaging emails per day and increase slowly over two to four weeks. Most teams start around 5 to 10 emails a day, aim for 30 to 50 per mailbox per day once warm, and keep spam complaints well below 0.3%. Keep warmup running at a low level even after launch, and spread volume across several mailboxes instead of pushing one.",
    summary:
      "How to set up a sending domain, authenticate it, warm it up on a safe schedule, and keep cold email landing in the inbox.",
    faqs: [
      {
        q: "How long does it take to warm up an email domain?",
        a: "Plan on two to four weeks for a new domain and mailbox. Brand-new domains need the longest; older domains with a clean history can ramp faster. Watch inbox placement and replies rather than the calendar: if emails start landing in spam, slow down.",
      },
      {
        q: "How many cold emails can I send per day from one mailbox?",
        a: "Once a mailbox is fully warmed, 30 to 50 cold emails a day is a common safe range. To send more, add mailboxes and domains and rotate between them instead of increasing one mailbox's volume.",
      },
      {
        q: "Do I need SPF, DKIM and DMARC for cold email?",
        a: "Yes. Google and Yahoo require authenticated email from bulk senders, and unauthenticated mail is far more likely to be filtered. Set all three up before you start warming, and check them again after any DNS change.",
      },
      {
        q: "Should I send cold email from my main domain?",
        a: "No. Use a separate but similar domain, such as a variation of your brand name, for cold outreach. If its reputation is damaged, your main domain's everyday email is protected.",
      },
      {
        q: "Should I stop warmup once I start sending campaigns?",
        a: "No. Keep a low level of warmup running alongside campaigns. It keeps positive engagement flowing and helps you notice a reputation problem early.",
      },
    ],
    sections: [
      {
        heading: "What email warmup is and why it matters",
        level: 2,
        body: "Mailbox providers such as Gmail and Outlook judge every sender by its history. A brand-new mailbox that suddenly sends hundreds of emails looks exactly like a spammer, so its messages go to spam or are blocked. Warmup builds a history first: small daily volumes of real emails that are opened, replied to and rescued from spam, increasing step by step. Only once the mailbox looks like a normal, trusted sender do you start [cold email](/blog/cold-email-for-agencies) campaigns.",
      },
      {
        heading: "Step 1: Use a separate sending domain",
        level: 2,
        body: "Buy one or more domains that are close to your brand (for example a variation with \"get\" or \"try\" in front) and use them only for outreach. Point the website of each sending domain to your main site so recipients who check it see a real business. Create two or three mailboxes per domain rather than dozens; a small number of real-looking mailboxes is safer than many.",
      },
      {
        heading: "Step 2: Authenticate the domain (SPF, DKIM, DMARC)",
        level: 2,
        body: "Authentication proves your emails really come from you. Set up all three records with your email provider's values before sending a single message.",
        table: {
          headers: ["Record", "What it does", "What to check"],
          rows: [
            ["SPF", "Lists the servers allowed to send for your domain", "One SPF record only, including your email provider"],
            ["DKIM", "Signs each email so providers can verify it was not altered", "DKIM enabled in your provider and the DNS record published"],
            ["DMARC", "Tells providers what to do with mail that fails SPF/DKIM", "Start with p=none and a reporting address, tighten later"],
            ["MX", "Lets the domain receive replies", "Points to your email provider so replies arrive"],
          ],
        },
        callout: {
          title: "Check before you warm",
          text: "Contractor Leads checks SPF, DKIM, DMARC and MX for every connected mailbox and shows exactly which record is missing, so you can fix DNS before warmup starts rather than after deliverability drops.",
        },
      },
      {
        heading: "Step 3: Follow a gradual warmup schedule",
        level: 2,
        body: "Increase volume slowly and keep emails personal and two-way. A typical schedule for a new mailbox looks like this; slow down if inbox placement drops.",
        table: {
          headers: ["Week", "Warmup emails per day", "Cold emails per day"],
          rows: [
            ["Week 1", "5-10", "0"],
            ["Week 2", "10-20", "0"],
            ["Week 3", "20-30", "5-10 to your best-fit prospects"],
            ["Week 4", "20-30", "20-30"],
            ["Week 5+", "10-20 ongoing", "30-50 per mailbox"],
          ],
        },
      },
      {
        heading: "Step 4: Protect your reputation while you send",
        level: 2,
        body: "Warmup only helps if your campaigns do not undo it. The biggest risks are bounces, spam complaints and sudden volume spikes.",
        bullets: [
          "Verify every address before sending; aim for a bounce rate under 2%",
          "Keep spam complaints well below 0.3%, the threshold Google and Yahoo publish for bulk senders",
          "Include a clear way to opt out and honour it quickly",
          "Write short, specific, personal emails; avoid heavy images, many links and attachments in first touches",
          "Rotate across several mailboxes and keep each one within its daily limit",
          "Increase volume gradually, never in sudden jumps",
        ],
      },
      {
        heading: "Signs your warmup is working (or not)",
        level: 2,
        body: "Track inbox placement and engagement, not just how many emails went out.",
        table: {
          headers: ["Signal", "Healthy", "Warning sign"],
          rows: [
            ["Bounce rate", "Under 2%", "Above 3%: clean your list"],
            ["Reply rate on cold email", "Steady or rising", "Sudden drop: check spam placement"],
            ["Warmup emails landing in spam", "Rare and decreasing", "Rising: pause cold sends, keep warming"],
            ["DNS checks", "SPF, DKIM, DMARC all pass", "Any failing record: fix before sending"],
          ],
        },
      },
      {
        heading: "Common warmup mistakes",
        level: 2,
        body: "Most deliverability problems come from a few avoidable mistakes: sending cold email from the main company domain, skipping DKIM or DMARC, jumping from zero to hundreds of emails in a week, sending to unverified lists, and turning warmup off as soon as campaigns start. Fix these and you remove most of the risk. When your mailboxes are ready, pair them with well-written [subject lines](/blog/cold-email-subject-lines-for-contractors) and a list of [verified contractor emails](/contractor-lead-generation-software) so every send counts.",
      },
    ],
  },
];
