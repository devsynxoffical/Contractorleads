import type { BlogPost } from "@/lib/blog-content";

const AUTHOR = {
  name: "Vaishali Kapoor",
  role: "Founder, Contractor Leads",
  bio: "Vaishali leads product and growth at Contractor Leads, helping marketing agencies prospect, score, and close high-ticket home-service contractors.",
  image: "/marketing/founder-portrait.jpg",
};

const PUBLISHED = "2026-10-30";

/**
 * Third wave of guides: cost benchmarks, vendor roundups, GBP, owner lookup,
 * electrical playbook, subject lines. Merged into BLOG_POSTS in blog-content.ts.
 */
export const GROWTH_POSTS: BlogPost[] = [
  // 1. How much do contractor leads cost
  {
    slug: "how-much-do-contractor-leads-cost",
    type: "cluster",
    title: "How Much Do Contractor Leads Cost in 2026? Benchmarks by Trade and Channel",
    titleTag: "How Much Do Contractor Leads Cost? 2026 Benchmarks by Trade",
    metaDescription:
      "Contractor lead costs in 2026: typical cost per lead for roofing, HVAC, plumbing, electrical and solar across LSAs, Google Ads, Meta, marketplaces and SEO, plus what agencies should charge.",
    primaryKeyword: "how much do contractor leads cost",
    secondaryKeywords: [
      "contractor lead cost",
      "cost per lead contractors",
      "roofing lead cost",
      "hvac lead cost",
      "plumbing lead cost",
      "exclusive contractor leads price",
    ],
    searchVolume: "1,300/mo",
    growth: "+19%",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "electrical", "solar"],
    directAnswer:
      "Contractor leads typically cost between $20 and $400 each in 2026 depending on trade and channel. Shared marketplace leads run $20 to $150, Google Local Services Ads $35 to $250 per valid call, Google Search Ads $40 to $300 per lead, Meta ads $15 to $150, and SEO falls to $10 to $60 per lead at scale once rankings hold. Roofing and solar sit at the top of every range, plumbing and HVAC in the middle. The number that matters is cost per booked job, which should stay under roughly 10 percent of the average ticket.",
    summary:
      "Cost-per-lead benchmarks for the main home-service trades across every major channel, how to judge whether a cost is good, and how agencies should price lead generation.",
    faqs: [
      {
        q: "What is a good cost per lead for a roofing company?",
        a: "Roofing replacement leads commonly cost $80 to $250 through Local Services Ads or search ads and $40 to $150 on Meta. With an average replacement ticket above $10,000 and a close rate near one in four, a cost per lead under $300 is usually healthy.",
      },
      {
        q: "Why are shared leads cheaper?",
        a: "Marketplaces sell the same homeowner request to several contractors, so each pays less but competes on price and speed. Close rates are far lower than exclusive channels, which is why cost per booked job is often higher despite the cheaper lead.",
      },
      {
        q: "How should an agency price lead generation for contractors?",
        a: "Most agencies charge a management retainer plus the client's media spend, or a flat retainer that includes a defined channel mix. Pay-per-lead pricing is possible for trades with predictable volume but shifts risk to the agency. Anchor every model to the client's average ticket and close rate.",
      },
      {
        q: "Does cost per lead vary by state?",
        a: "Yes. Dense, high-income metros with many advertisers, such as parts of California, Texas, Florida and the Northeast, run higher. Rural and smaller markets are cheaper but lower volume. Contractor Leads' state pages give directional estimates by trade.",
      },
    ],
    sections: [
      {
        heading: "Cost per lead by trade and channel",
        level: 2,
        body: "Typical 2026 ranges for US home-service trades. Treat them as planning anchors; your market, season and offer will move them.",
        table: {
          headers: ["Trade", "Local Services Ads", "Google Search Ads", "Meta ads", "Marketplace (shared)", "SEO at scale"],
          rows: [
            ["Roofing", "$80 to $250", "$90 to $300", "$40 to $150", "$50 to $150", "$25 to $60"],
            ["HVAC", "$50 to $150", "$60 to $200", "$25 to $120", "$30 to $100", "$15 to $50"],
            ["Plumbing", "$35 to $100", "$40 to $150", "$20 to $90", "$20 to $80", "$10 to $40"],
            ["Electrical", "$40 to $110", "$45 to $160", "$20 to $90", "$20 to $80", "$10 to $45"],
            ["Solar", "$150 to $400", "$120 to $350", "$40 to $150", "$60 to $200", "$30 to $80"],
            ["Remodeling", "$60 to $200", "$70 to $250", "$30 to $140", "$40 to $150", "$20 to $60"],
          ],
        },
      },
      {
        heading: "Why the ranges are so wide",
        level: 2,
        body: "Four variables explain most of the spread. Job value: a $25,000 solar system supports a far higher lead cost than a $300 drain call. Competition: metros with many advertisers push auction prices up. Lead definition: a form fill, a phone call and a set appointment are three different products at three different prices. Follow-up speed: the same Meta lead that converts at 15 percent with a two-minute text-back converts at 3 percent after a day, which triples the effective cost per job.",
      },
      {
        heading: "The only number that matters: cost per booked job",
        level: 2,
        body: "Divide what you spent by jobs actually booked and compare it to the average ticket. A rule most contractors accept is that acquisition should stay under about 10 percent of the ticket. Use the formula below when you qualify a contractor or report to one.",
        callout: {
          title: "Cost per booked job",
          text: "Cost per booked job = (media spend + management fee) ÷ jobs booked\n\nExample: $4,000 spend + $1,500 fee = $5,500. 11 roofs booked. $500 per roof on a $12,000 ticket = 4.2% of revenue.",
        },
      },
      {
        heading: "Shared vs exclusive leads",
        level: 2,
        body: "Shared leads from marketplaces look cheap per lead and expensive per job. A $60 lead sold to four roofers with a 10 percent close rate costs $600 per job and trains homeowners to shop on price. An exclusive LSA call at $180 with a 35 percent close rate costs about $515 per job and arrives with the contractor's name already chosen. For established contractors the exclusive route almost always wins. For a brand-new business, a marketplace can be the only option for the first few months.",
      },
      {
        heading: "What agencies should charge",
        level: 2,
        body: "Three models are common. Retainer plus media: the contractor pays the ad platforms directly and the agency a fixed fee, typically $1,000 to $5,000 a month depending on channels. Flat all-in: one monthly price that includes a defined spend, simpler for small shops. Pay per lead: the agency sells leads at a set price and absorbs media risk; workable in plumbing and HVAC where volume is steady, risky in roofing where storms distort everything. Whatever the model, state the target cost per booked job in writing.",
        bullets: [
          "Single-truck shop: $750 to $1,500 retainer, GBP, reviews and one paid channel",
          "Three to ten trucks: $1,500 to $3,500, LSAs plus search ads plus follow-up automation",
          "Multi-location: $3,500 to $8,000, full channel mix with call tracking and reporting",
        ],
      },
      {
        heading: "How to find contractors who are overpaying",
        level: 2,
        body: "Contractors stuck on marketplaces or running ads to a slow site are the easiest agency wins, because you can lower their cost per job without asking for new budget. Contractor Leads shows PPC and website scores and Meta ad status on every business, so you can filter a metro for active advertisers with weak sites and open with the number above. Your first 10 leads are free.",
      },
    ],
  },

  // 2. Best contractor lead generation companies
  {
    slug: "best-contractor-lead-generation-companies",
    type: "cluster",
    title: "Best Contractor Lead Generation Companies and Tools in 2026 (By Use Case)",
    titleTag: "Best Contractor Lead Generation Companies and Tools 2026",
    metaDescription:
      "The best contractor lead generation companies and tools in 2026, grouped by use case: marketplaces, Local Services Ads, agencies, and prospecting software for agencies that sell to contractors.",
    primaryKeyword: "best contractor lead generation companies",
    secondaryKeywords: [
      "contractor lead generation companies",
      "lead generation companies for contractors",
      "contractor lead generation services",
      "best lead generation for contractors",
      "contractor lead gen tools",
    ],
    searchVolume: "1,000/mo",
    growth: "+14%",
    cluster: "tools",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 10,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "general-contractors"],
    directAnswer:
      "The best contractor lead generation option depends on who is buying. Contractors buying homeowner leads choose between marketplaces such as Angi, Thumbtack and HomeAdvisor, Google Local Services Ads, and a marketing agency running owned channels. Agencies and sales teams that sell to contractors need a different category entirely: prospecting software such as Contractor Leads that finds contractors from live Google data, scores them and supplies the owner's name and outreach. This guide groups the main options by use case and explains the trade-offs honestly, including where our own product does not fit.",
    summary:
      "A use-case-first roundup of contractor lead generation companies and tools, covering marketplaces, LSAs, agencies and agency-side prospecting software, with the trade-offs of each.",
    faqs: [
      {
        q: "What is the best lead generation company for contractors?",
        a: "For most established contractors, the best results come from exclusive channels: Google Local Services Ads, search ads and a strong Google Business Profile, usually managed by a specialist agency. Marketplaces suit new contractors who need volume immediately and accept shared leads.",
      },
      {
        q: "Is Contractor Leads a lead generation company for contractors?",
        a: "No. Contractor Leads is prospecting software for agencies, media buyers and sales teams that sell services to contractors. It does not sell homeowner leads. If you are a contractor looking for customers, the marketplace and LSA sections of this guide apply to you.",
      },
      {
        q: "How do I choose between a marketplace and an agency?",
        a: "Compare cost per booked job over 90 days, not cost per lead. Marketplaces win on speed and lose on close rate and price pressure. Agencies take longer to ramp and build channels the contractor owns.",
      },
      {
        q: "What should an agency use to find contractor clients?",
        a: "A tool that finds contractors from live business data and tells you who to call first. Contractor Leads does that for 18 home-service trades with owner names, marketing-gap scores, Meta ad status and outreach drafts.",
      },
    ],
    sections: [
      {
        heading: "Start with who is buying",
        level: 2,
        body: "Searches for contractor lead generation companies come from two very different buyers. Contractors want homeowners. Agencies want contractors. Most roundups blur the two and recommend marketplaces to everyone. This guide splits them.",
      },
      {
        heading: "For contractors: homeowner lead marketplaces",
        level: 2,
        body: "Angi (formerly HomeAdvisor and Angie's List), Thumbtack, Networx, Porch and similar platforms sell homeowner requests to contractors, usually shared among several. They are fast to start and useful for a new business, with the trade-offs of shared leads, price-driven homeowners and fee disputes.",
        table: {
          headers: ["Option", "Model", "Strengths", "Watch for"],
          rows: [
            ["Angi", "Pay per lead and membership", "Brand recognition, high volume", "Shared leads, variable lead quality"],
            ["Thumbtack", "Pay per contact", "Good for smaller jobs, pro profile", "Price-shopping homeowners"],
            ["Networx and Porch", "Pay per lead", "Exclusive options in some markets", "Coverage varies by area"],
          ],
        },
      },
      {
        heading: "For contractors: Google Local Services Ads",
        level: 2,
        body: "LSAs are Google's own pay-per-lead product for licensed and insured service businesses. Contractors pay for valid calls and messages, appear above search ads with a Google Guaranteed badge, and can dispute bad leads. For licensed trades this is often the best value exclusive channel, with the setup effort of verification. See our Local Service Ads guide for the full process.",
      },
      {
        heading: "For contractors: marketing agencies",
        level: 2,
        body: "Specialist home-service agencies run LSAs, search ads, Meta ads, websites, SEO and follow-up automation as a package. The right agency lowers cost per booked job over time and builds channels the contractor owns. The wrong one reports impressions. Ask any agency for cost per booked job on a comparable client before signing.",
        bullets: [
          "Ask for trade-specific references, not generic small-business clients",
          "Insist on call tracking and a shared definition of a booked job",
          "Prefer month-to-month after an initial 90-day ramp",
        ],
      },
      {
        heading: "For agencies: prospecting software that finds contractors",
        level: 2,
        body: "Agencies and sales teams have the opposite problem: finding contractors worth pitching. Options fall into three groups. Google Maps scrapers such as Outscraper or Apify export raw listings. B2B databases such as Apollo, ZoomInfo and UpLead cover companies with employees online and miss most owner-run shops. Purpose-built software such as Contractor Leads finds contractors from live Google data, scores the marketing gap, supplies the owner's name and writes the outreach.",
        table: {
          headers: ["Group", "Examples", "Best for", "Limit for contractor prospecting"],
          rows: [
            ["Maps scrapers", "Outscraper, Apify, PhantomBuster", "Raw bulk lists", "No owner, no scoring, no outreach"],
            ["B2B databases", "Apollo, ZoomInfo, UpLead, Lusha", "Corporate accounts", "Thin on owner-run local trades"],
            ["Local lead finders", "D7 Lead Finder", "Quick category lists", "Shallow signals, no trade focus"],
            ["Contractor-specific software", "Contractor Leads", "Agencies selling to trades", "Home-service trades only"],
          ],
        },
      },
      {
        heading: "How Contractor Leads fits, and where it does not",
        level: 2,
        body: "Contractor Leads is built for one buyer: agencies, media buyers and sales teams selling to home-service contractors across 18 trades in five countries. It does not sell homeowner leads, it does not cover restaurants or dentists, and it is not a replacement for a B2B database if your customers are corporations. For its intended buyer it compresses the research morning into a scored list with the owner's name and the first email drafted. Ten leads are free to test.",
      },
      {
        heading: "Decision table",
        level: 2,
        body: "Match the buyer to the option.",
        table: {
          headers: ["You are", "You need", "Start with"],
          rows: [
            ["A new contractor", "Any jobs this month", "A marketplace plus a complete Google Business Profile"],
            ["An established licensed contractor", "Exclusive, high-intent calls", "Local Services Ads, then search ads"],
            ["A contractor ready to scale", "Owned channels and lower cost per job", "A specialist agency with call tracking"],
            ["An agency selling to contractors", "A ranked list of who to call", "Contractor Leads"],
          ],
        },
      },
    ],
  },

  // 3. Google Business Profile optimization for contractors
  {
    slug: "google-business-profile-optimization-for-contractors",
    type: "cluster",
    title: "Google Business Profile Optimization for Contractors: The Agency Checklist",
    titleTag: "Google Business Profile Optimization for Contractors: Checklist",
    metaDescription:
      "A complete Google Business Profile optimization checklist for contractors, written for agencies: categories, services, photos, reviews, posts, Q&A, and how to sell GBP as a first retainer.",
    primaryKeyword: "google business profile optimization for contractors",
    secondaryKeywords: [
      "google business profile for contractors",
      "gbp optimization checklist",
      "google my business for contractors",
      "map pack ranking contractors",
      "local seo for contractors",
      "google business profile services",
    ],
    searchVolume: "900/mo",
    growth: "+24%",
    cluster: "lsa",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 11,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "electrical", "landscaping", "painting"],
    directAnswer:
      "Google Business Profile optimization for contractors means completing and maintaining the profile so it ranks in the local map pack and converts searchers into calls: the most specific primary category, every service listed, accurate service areas, weekly photos, a steady flow of reviews with replies, posts, Q&A, and a fast mobile site linked from the profile. For agencies it is the best first retainer in home services because results show within weeks and the before-and-after is visible to the owner.",
    summary:
      "The full GBP checklist for home-service contractors, the ranking factors that matter most in the map pack, common mistakes, and how agencies package and price GBP work.",
    faqs: [
      {
        q: "What matters most for map pack ranking?",
        a: "Relevance, distance and prominence. In practice for contractors: the right primary category, a complete services list, proximity of the address or service area to the searcher, review count and velocity, and a linked website that supports the same terms. Reviews and category are the levers an agency moves fastest.",
      },
      {
        q: "Can a service-area business without a storefront rank?",
        a: "Yes. Hide the address and set service areas. Service-area businesses rank in the map pack across their areas, though usually strongest near the registered location.",
      },
      {
        q: "How often should a contractor post on Google Business Profile?",
        a: "Weekly is enough. Job photos, before-and-afters and seasonal offers keep the profile active. Posts are a minor ranking signal but a meaningful conversion signal.",
      },
      {
        q: "How much should an agency charge for GBP management?",
        a: "Setup and cleanup typically runs $500 to $1,500 one-off. Ongoing management with review requests, posts and reporting commonly runs $300 to $800 a month standalone, or is bundled into a $1,000 to $1,500 local SEO retainer.",
      },
    ],
    sections: [
      {
        heading: "Why GBP is the best first retainer in home services",
        level: 2,
        body: "Every 'near me' search shows the map pack above organic results, the profile is free, and most contractors run theirs badly. In a typical Contractor Leads search a large share of businesses have an incomplete profile, few photos or slow review growth. An agency that fixes this sees ranking and call changes within four to eight weeks, which is fast enough to earn trust for larger work.",
      },
      {
        heading: "The checklist",
        level: 2,
        body: "Work top to bottom. The first five items move rankings; the rest move conversion.",
        bullets: [
          "Primary category: the most specific match (Roofing contractor, HVAC contractor, Plumber, Electrician)",
          "Secondary categories: every relevant service line, without padding",
          "Services: each service as a separate item with a short description and the terms homeowners use",
          "Service areas: the cities and zips the contractor actually serves, address hidden for service-area businesses",
          "Reviews: a request system that produces a steady weekly flow, every review answered within 48 hours",
          "Photos: real job photos weekly, team and truck photos, logo and cover set",
          "Business description: plain language, services and areas, no keyword stuffing",
          "Hours, phone, website link to a fast mobile page with a tappable number",
          "Posts: weekly job or offer posts",
          "Q&A: seed the ten questions homeowners actually ask and answer them",
          "Attributes: licensed, insured, emergency service, free estimates where true",
          "Messaging on, with someone assigned to answer within minutes",
        ],
      },
      {
        heading: "Ranking factors that matter most for contractors",
        level: 2,
        body: "Google ranks the map pack on relevance, distance and prominence. For contractors that translates to a small set of controllable levers.",
        table: {
          headers: ["Lever", "Effect", "Agency action"],
          rows: [
            ["Primary category", "High", "Fix on day one; wrong category caps everything"],
            ["Review count and velocity", "High", "Install a request system; target steady weekly reviews"],
            ["Review replies", "Medium", "Reply to all within 48 hours"],
            ["Services and description completeness", "Medium", "Complete every field with homeowner language"],
            ["Linked website relevance and speed", "Medium", "Service pages that match the categories, under 3s on mobile"],
            ["Photos and posts", "Low to medium", "Weekly cadence"],
            ["Spam competitors", "Variable", "Report keyword-stuffed names and fake listings"],
          ],
        },
      },
      {
        heading: "Mistakes that hold contractors back",
        level: 2,
        body: "The same errors appear on most contractor profiles: a generic primary category, a stuffed business name that risks suspension, a single photo from five years ago, unanswered one-star reviews, a website link to a slow homepage instead of a service page, and service areas set to the whole state. Fixing these alone often moves a profile into the pack.",
      },
      {
        heading: "Review velocity: the lever agencies control",
        level: 2,
        body: "Contractors with the most reviews are rarely the best; they are the ones who ask. Build the ask into job completion: a text with a direct review link sent by the tech on site, a follow-up email two days later, and a monthly check of who has not reviewed. Reply to every review, including the bad ones, with a short, specific response. Contractor Leads shows rating, review count and velocity on each lead, so you can target the contractors with great work and few reviews.",
      },
      {
        heading: "Packaging and pricing GBP work",
        level: 2,
        body: "Sell it as a defined product with a visible outcome: setup and cleanup in month one, then ongoing management with weekly posts, review requests and a monthly report showing map pack positions for ten agreed terms, calls from the profile and review growth. Price standalone at $300 to $800 a month after a $500 to $1,500 setup, or bundle into a local SEO retainer. Use it as the entry point to website, LSA and paid-search work once trust is established.",
      },
      {
        heading: "Find contractors whose profiles need work",
        level: 2,
        body: "Run a trade and metro in Contractor Leads, sort by SEO score ascending and look at rating, review count and website score together. A contractor with 4.8 stars, 30 reviews and no website is the ideal first GBP client. Open the lead, confirm the owner's name and generate the first email from Outreach Studio.",
      },
    ],
  },

  // 4. How to find the owner of a business
  {
    slug: "how-to-find-business-owner-name",
    type: "cluster",
    title: "How to Find the Owner of a Contracting Business: 9 Methods Ranked",
    titleTag: "How to Find a Contracting Business Owner's Name: 9 Methods",
    metaDescription:
      "Nine ways to find who owns a contracting business, from the website and state licence boards to Secretary of State records and Contractor Leads owner enrichment, ranked by speed and accuracy.",
    primaryKeyword: "how to find the owner of a business",
    secondaryKeywords: [
      "find business owner name",
      "who owns this business",
      "find owner of a company",
      "contractor license lookup owner",
      "find decision maker small business",
      "business owner lookup",
    ],
    searchVolume: "2,900/mo",
    growth: "+9%",
    cluster: "tools",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "electrical", "general-contractors"],
    directAnswer:
      "To find the owner of a contracting business, check the company website's About page first, then the state contractor licence board, which lists the qualifying individual for licensed trades, then the Secretary of State business registry for registered agents and officers. Google Business Profile owner replies, Facebook page transparency, LinkedIn, BBB profiles and local news fill the gaps. Contractor Leads automates the first step by reading the owner's name from the business website and leaving the field blank when it cannot verify one, so outreach never opens with a guess.",
    summary:
      "A ranked guide to finding the decision-maker at a contracting company, with the public sources that work for licensed trades and the verification habit that protects your sender reputation.",
    faqs: [
      {
        q: "Is it legal to look up a business owner's name?",
        a: "Business ownership and licensing records are public in most jurisdictions, and a company's own website is published for the public. How you contact the person is governed by rules such as CAN-SPAM, TCPA for calls and texts in the US, GDPR in Europe and PECR in the UK. Use business contact details and honour opt-outs.",
      },
      {
        q: "Why do contractor licence boards list a person?",
        a: "Most licensed trades require a qualifying individual, often the owner or a master tradesperson, whose licence covers the company. State licence lookups show that person's name, which is frequently the decision-maker.",
      },
      {
        q: "What if the owner's name is nowhere online?",
        a: "Leave it blank and address the business. 'Hi there' plus a specific observation about the company beats a guessed first name that is wrong. Contractor Leads follows the same rule.",
      },
      {
        q: "Does Contractor Leads find owner names automatically?",
        a: "Yes. Owner enrichment reads the business website and cross-checks the name, returning it on the lead card when verified. Fields it cannot verify stay empty rather than being pattern-guessed.",
      },
    ],
    sections: [
      {
        heading: "Why the owner's name matters",
        level: 2,
        body: "Most contracting companies have one decision-maker and no marketing department. An email that opens with the owner's first name and a specific observation about their business gets read; one that opens with 'Dear Business Owner' does not. The name is also how you get past the office manager on the phone. The trap is guessing: a wrong name costs more credibility than no name.",
      },
      {
        heading: "Nine methods ranked",
        level: 2,
        body: "Ordered by how fast they are and how often they return the right person for a home-service contractor.",
        table: {
          headers: ["Method", "Speed", "Accuracy for contractors", "Notes"],
          rows: [
            ["Company website About or Team page", "Seconds", "High when present", "Often names the founder; check footer and photos too"],
            ["State contractor licence board lookup", "1 to 2 minutes", "High for licensed trades", "Lists the qualifying individual; US states vary in detail"],
            ["Secretary of State business registry", "2 to 3 minutes", "Medium to high", "Officers, members or registered agent; agent may be a service company"],
            ["Google Business Profile review replies", "1 minute", "Medium", "Owners often sign replies with their name"],
            ["Facebook page transparency and posts", "1 to 2 minutes", "Medium", "Page admin country, posts signed by the owner"],
            ["LinkedIn company and people search", "1 to 2 minutes", "Low to medium", "Most owner-operators are not active"],
            ["BBB business profile", "1 minute", "Medium", "Lists principal contacts for accredited and many non-accredited businesses"],
            ["Local news, awards and association pages", "Variable", "Medium", "Chamber of commerce, trade associations, local press"],
            ["Contractor Leads owner enrichment", "Automatic", "High when returned, blank otherwise", "Reads the business site and verifies; no guessing"],
          ],
        },
      },
      {
        heading: "Method 1: the business website",
        level: 2,
        body: "Start at the About page, then the footer, team photos, blog author names and the privacy policy, which sometimes names the legal entity and a contact. Owner-operators often write in the first person: 'I started this company in 2009' is your answer. If the site is a template with no names, move to the licence board.",
      },
      {
        heading: "Method 2: state contractor licence boards",
        level: 2,
        body: "Roofing, HVAC, plumbing and electrical are licensed in most US states, and the licence record names a qualifying individual. Search the state board by company name. In some states the qualifier is an employee rather than the owner, so cross-check with the website or registry before you use the name.",
      },
      {
        heading: "Method 3: Secretary of State and company registries",
        level: 2,
        body: "Every registered LLC or corporation appears in its state's business registry with officers, members or managers, and a registered agent. Small contractors frequently list themselves as agent. If the agent is a registered-agent service, look for the organiser or manager fields instead. Outside the US, use Companies House in the UK, provincial registries in Canada, ASIC in Australia and the Companies Office in New Zealand.",
      },
      {
        heading: "Methods 4 to 8: signals in public profiles",
        level: 2,
        body: "Owners sign Google review replies, post on the company Facebook page, appear in local award write-ups and chamber of commerce listings, and are named as principals on BBB profiles. Each is a confirmation source rather than a first stop. Two independent sources agreeing is the standard before you put a name in an email.",
      },
      {
        heading: "Method 9: automate it, with a blank-beats-wrong rule",
        level: 2,
        body: "Doing the above for 200 contractors a week is a full-time job. Contractor Leads runs owner enrichment on every lead by reading the business website and cross-checking the result. When a name is verified it appears on the lead card with the scores and ad status; when it is not, the field stays blank and Outreach Studio writes to the business instead. Your first 10 leads are free.",
        callout: {
          title: "Verification habit",
          text: "Use a name only when two sources agree, or one source is the business's own website. Otherwise address the business. A blank beats a wrong name every time.",
        },
      },
    ],
  },

  // 5. Electrical contractor leads
  {
    slug: "electrical-contractor-leads",
    type: "cluster",
    title: "Electrical Contractor Leads for Agencies: EV Chargers, Panels and the Pitch That Lands",
    titleTag: "Electrical Contractor Leads for Agencies: How to Pitch Electricians",
    metaDescription:
      "How agencies find and pitch electrical contractor leads: the EV charger and panel-upgrade angle, which electricians to call first, what they buy, and a first-touch email that works.",
    primaryKeyword: "electrical contractor leads",
    secondaryKeywords: [
      "electrician leads for agencies",
      "electrical contractor marketing",
      "how to market to electricians",
      "electrician marketing agency",
      "leads for electricians",
      "electrical company leads",
    ],
    searchVolume: "800/mo",
    growth: "+17%",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["electrical", "solar", "hvac"],
    directAnswer:
      "Electrical contractor leads for agencies are licensed electrical businesses with a visible marketing gap and a reachable owner. The strongest angle in 2026 is high-ticket residential work: EV charger installs, panel upgrades, whole-home rewires, generator and battery installs. Most electricians rank for none of it. Pull electricians in a metro from live Google data, sort by SEO and PPC scores, confirm the owner through the licence board or the business website, and open with the specific high-ticket search they are missing.",
    summary:
      "The electrical trade playbook: why high-ticket residential work changed the pitch, which electricians to target, what they buy, pricing and a first-touch email.",
    faqs: [
      {
        q: "Why are electricians good agency clients?",
        a: "Licensed, steady demand, growing high-ticket categories such as EV chargers, panel upgrades and batteries, and very little marketing sophistication. Most electrical companies rely on referrals and GC relationships and have never ranked for the residential searches with the best margins.",
      },
      {
        q: "What do electrical contractors buy from agencies?",
        a: "Service pages for high-ticket work, Google Business Profile and reviews, Local Services Ads, search ads for emergency and EV terms, and follow-up automation for estimates. Commercial electricians also buy outreach to general contractors and property managers.",
      },
      {
        q: "How do I find electricians who are not advertising?",
        a: "Search Electrical in Contractor Leads for the metro, sort by PPC score ascending and filter to businesses not running Meta ads. Those are electricians with no paid presence; pair with rating and review count to find the ones with good work and no visibility.",
      },
      {
        q: "What retainer is realistic for an electrical client?",
        a: "Small residential shops start at $750 to $1,500 a month. Companies with several crews and an EV or generator line typically pay $1,500 to $4,000 for a mix of SEO, LSAs and paid search.",
      },
    ],
    sections: [
      {
        heading: "What changed in electrical marketing",
        level: 2,
        body: "A decade ago electricians lived on referrals and general contractors. Three shifts changed the pitch. EV adoption created a steady stream of charger installs that homeowners search for directly. Older housing stock and heat pumps drive panel upgrades. Outages and solar drive generators and batteries. These are four-figure jobs that homeowners research online, and most electrical companies have no page, no reviews mentioning them and no ads for any of it.",
      },
      {
        heading: "Which electricians to call first",
        level: 2,
        body: "Qualify on three signals in the lead card.",
        bullets: [
          "Strong reviews, weak visibility: 4.6 stars and 40+ reviews with an SEO score under 40",
          "No paid presence: PPC score under 30 and no Meta ads while competitors hold the Local Services Ads slots",
          "Growth signals: new vans in photos, hiring posts, EV or generator brand partnerships on the site",
          "Residential focus: commercial-only shops buy different services and sell differently",
        ],
      },
      {
        heading: "Offers that match the shop",
        level: 2,
        body: "Pitch the work the electrician can see in revenue terms.",
        table: {
          headers: ["Shop profile", "Gap", "Lead offer", "Typical monthly retainer"],
          rows: [
            ["Owner plus one or two electricians", "No site or a template site, few reviews", "GBP optimization, review system, five service pages", "$750 to $1,500"],
            ["Three to eight electricians, some residential", "No high-ticket pages, no LSAs", "EV, panel and generator pages plus Local Services Ads", "$1,500 to $3,000"],
            ["Multi-crew with EV or solar line", "Paid traffic to a slow site", "Search ads, landing pages, instant follow-up", "$2,500 to $4,000"],
            ["Commercial electrical", "Few, large bids", "Outbound to GCs, property managers and developers", "$2,000 to $5,000"],
          ],
        },
      },
      {
        heading: "The high-ticket angle",
        level: 2,
        body: "Search 'EV charger installation [city]', 'panel upgrade [city]' and 'whole house generator [city]'. Screenshot who ranks and who holds the Local Services Ads slots. For most metros the answer is two or three companies and a lot of national lead-gen sites. If the electrician you are pitching is absent, you have the whole conversation in one image.",
        callout: {
          title: "First-touch email",
          text: "Subject: EV charger searches in [City]\n\nHi [first name],\n\n[Business] has [rating] stars and [review count] reviews, better than most electricians in [City]. But for 'EV charger installation [City]' this morning, [Competitor] holds the Google Guaranteed spot and your company does not appear.\n\nThose are $1,500 to $3,000 jobs with homeowners who already decided to buy.\n\nWorth a 10-minute look at what it would take to show up?",
        },
      },
      {
        heading: "Objections from electricians",
        level: 2,
        body: "'We stay busy through GCs' means margin pressure and no control; answer with residential margin and owned demand. 'We do not do residential service calls' is often true, so pitch the high-ticket installs only, not drain-call style emergency work. 'We tried a website guy' means a brochure site with no pages for the work they want; show the missing pages.",
      },
      {
        heading: "Build the list",
        level: 2,
        body: "Run Electrical for the metro in Contractor Leads, sort by SEO score ascending, filter to 4.5 stars and above, and open the top results. Owner enrichment reads the business site; the state licence board confirms the qualifier. Generate the first email in Outreach Studio and save the Hot tier to your pipeline. Pair with the Solar playbook for electricians adding panels and batteries.",
      },
    ],
  },

  // 6. Cold email subject lines for contractors
  {
    slug: "cold-email-subject-lines-for-contractors",
    type: "cluster",
    title: "47 Cold Email Subject Lines for Contractors, Grouped by Angle and Tested Logic",
    titleTag: "47 Cold Email Subject Lines for Contractors (By Angle)",
    metaDescription:
      "47 cold email subject lines for pitching contractors, grouped by angle: reviews, rankings, ads, website, seasonal and referral, with the rules that keep agency email out of spam.",
    primaryKeyword: "cold email subject lines for contractors",
    secondaryKeywords: [
      "subject lines for cold email to contractors",
      "best cold email subject lines b2b",
      "cold email subject lines agency",
      "email subject lines for roofers",
      "subject lines that get opened small business",
    ],
    searchVolume: "640/mo",
    growth: "+21%",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "remodeling"],
    directAnswer:
      "The cold email subject lines that get opened by contractors are short, lowercase or sentence case, specific to the business or its city, and free of marketing words. 'your [City] water heater calls', '[Business] on Google this morning' and 'quick one, [first name]' outperform 'Grow Your Roofing Business With Our Proven System' every time. Below are 47 subject lines grouped by the angle of the email, plus the deliverability rules that matter more than any single line.",
    summary:
      "A swipe file of 47 subject lines for agency outreach to contractors, organised by angle, with the rules on length, personalisation, follow-ups and deliverability that decide whether they get opened.",
    faqs: [
      {
        q: "How long should a cold email subject line be?",
        a: "Two to six words. Most contractors read email on a phone, which shows about 35 characters. Short, specific lines look like a message from a person rather than a campaign.",
      },
      {
        q: "Should I use the contractor's name in the subject line?",
        a: "The business name or city works better than the first name in the subject, because it signals you looked at their company. Use the first name in the first line of the body instead.",
      },
      {
        q: "Do emojis or capital letters help?",
        a: "No. They read as marketing and often hurt deliverability. Sentence case or lowercase, no punctuation tricks, no 'RE:' or 'FWD:' fakes.",
      },
      {
        q: "What matters more than the subject line?",
        a: "Deliverability. Send from a warmed mailbox on your own domain, keep volume modest, personalise the first line, and avoid spam-trigger words. Contractor Leads sends from your own Gmail, Outlook or SMTP so replies land in your inbox.",
      },
    ],
    sections: [
      {
        heading: "Rules before the swipe file",
        level: 2,
        body: "A subject line can only earn the open; the first line earns the reply. Keep these rules and most lines below will work.",
        bullets: [
          "Two to six words, sentence case or lowercase",
          "Reference the business, the city or a specific observation",
          "No marketing words: grow, boost, skyrocket, proven, system, free",
          "No fake replies or forwards, no emojis, no all caps",
          "Match the subject to the first line; a mismatch gets deleted after the open",
          "Send from your own warmed domain at modest volume",
        ],
      },
      {
        heading: "Reviews and reputation angle",
        level: 2,
        body: "For contractors with strong reviews and weak visibility.",
        bullets: [
          "your reviews vs your rankings",
          "[Business]'s 4.8 stars",
          "190 reviews, page two",
          "the review gap in [City]",
          "who's ranking above [Business]",
          "[City] homeowners can't find you",
          "great reviews, wrong spot",
          "your Google listing this morning",
        ],
      },
      {
        heading: "Rankings and search angle",
        level: 2,
        body: "For SEO and Google Business Profile pitches.",
        bullets: [
          "'roofer [City]' results",
          "[Competitor] is above you",
          "map pack in [City]",
          "the search you're missing",
          "page one for [service] [City]",
          "your website on a phone",
          "[City] water heater calls",
          "emergency plumber [City]",
        ],
      },
      {
        heading: "Ads and Local Services Ads angle",
        level: 2,
        body: "For paid-search, LSA and Meta pitches, especially when Meta Ads Intel shows activity.",
        bullets: [
          "your Facebook ads",
          "Google Guaranteed in [City]",
          "two roofers have the badge",
          "the page your ads land on",
          "ads on, phone quiet?",
          "your cost per call",
          "[Competitor]'s ads this week",
          "spending without the follow-up",
        ],
      },
      {
        heading: "Website angle",
        level: 2,
        body: "For contractors with no site or a slow one.",
        bullets: [
          "no website on your listing",
          "six seconds on a phone",
          "[Business].com",
          "the link on your Google profile",
          "your site vs [Competitor]'s",
          "one page is costing you calls",
          "tappable phone number",
        ],
      },
      {
        heading: "Seasonal and event angle",
        level: 2,
        body: "Tie the subject to something happening in their market.",
        bullets: [
          "after Tuesday's storm",
          "before AC season",
          "furnace season in [City]",
          "the hail map",
          "spring remodel searches",
          "rainy day question",
          "January is coming",
        ],
      },
      {
        heading: "Plain and curiosity angle",
        level: 2,
        body: "Short lines that read like a colleague. Use sparingly and always match the first line.",
        bullets: [
          "quick one, [first name]",
          "question about [Business]",
          "noticed something",
          "[City] + [trade]",
          "two minutes",
          "saw this and thought of you",
          "mind if I send a screenshot?",
          "wrong person?",
          "closing the loop",
        ],
      },
      {
        heading: "Follow-up subject lines",
        level: 2,
        body: "Follow-ups should stay in the same thread when possible. When you start a new one, keep the reference.",
        bullets: [
          "re: your Google listing (screenshot attached)",
          "the screenshot I mentioned",
          "still above you",
          "last one from me",
          "should I close this out?",
        ],
      },
      {
        heading: "Pair the line with the right first sentence",
        level: 2,
        body: "The subject earns the open; the first line must deliver what it promised, in one sentence, about their business. Outreach Studio in Contractor Leads drafts the subject and first line from the lead's own audit, so 'your Facebook ads' is followed by what their ads actually land on and 'the review gap in [City]' by the competitor's count. See our cold email guide for full templates and the sequence around them.",
      },
    ],
  },
];
