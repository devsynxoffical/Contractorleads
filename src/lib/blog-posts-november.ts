import type { BlogPost } from "@/lib/blog-content";

const AUTHOR = {
  name: "Vaishali Kapoor",
  role: "Founder, Contractor Leads",
  bio: "Vaishali leads product and growth at Contractor Leads, helping marketing agencies prospect, score, and close high-ticket home-service contractors.",
  image: "/marketing/founder-portrait.jpg",
};

const PUBLISHED = "2026-11-04";

/**
 * Sixth wave: a Google Maps scraper comparison, a cold email follow-up guide, and trade
 * playbooks for flooring, fencing, pool service and garage door companies.
 * Body text may use [label](/path) for inline links; first mentions of key topics
 * are also auto-linked by LinkedText.
 */
export const NOVEMBER_POSTS: BlogPost[] = [
  // 1. Best Google Maps scrapers
  {
    slug: "best-google-maps-scrapers",
    type: "cluster",
    title: "Best Google Maps Scrapers for Lead Generation (2026)",
    titleTag: "Best Google Maps Scrapers for Lead Generation (2026)",
    metaDescription:
      "The best Google Maps scrapers for lead generation in 2026 compared: data fields, owner contacts, ease of use and pricing models, with the right pick for each job.",
    primaryKeyword: "best google maps scraper",
    secondaryKeywords: [
      "google maps scraper",
      "google maps scraper for lead generation",
      "google maps data extractor",
      "google maps lead scraper",
      "scrape google maps for leads",
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
      "The best Google Maps scraper depends on the job. For agencies prospecting home-service contractors, Contractor Leads returns Google business data with owner names, verified emails, AI marketing-gap scores and outreach in one step. For raw data at scale, Outscraper and Apify are flexible pay-as-you-go options. PhantomBuster suits teams already automating other prospecting. Octoparse is a no-code choice for custom pages, and Bright Data fits enterprise volumes. Whichever you pick, verify emails before sending and keep outreach compliant.",
    summary:
      "Seven Google Maps scrapers compared on data, contacts, ease of use and pricing model, plus how to turn a raw export into booked calls.",
    faqs: [
      {
        q: "What is the best Google Maps scraper for lead generation?",
        a: "For finding and pitching local service businesses, a tool that adds owner names, verified emails and scoring saves the most time; Contractor Leads does this for home-service contractors. For general-purpose data extraction at scale, Outscraper and Apify are the most common choices.",
      },
      {
        q: "Is it legal to scrape Google Maps?",
        a: "Business listings are public, but automated scraping can conflict with Google's Terms of Service, and how you store and contact people is governed by data protection and anti-spam laws such as GDPR and CAN-SPAM. Use reputable tools, collect only business data you need, honour opt-outs, and take legal advice for your market.",
      },
      {
        q: "Can a Google Maps scraper find email addresses?",
        a: "Google Maps listings do not show email addresses. Scrapers that return emails find them by visiting the business website or using enrichment sources, so coverage varies. Always verify emails before sending to protect your sender reputation.",
      },
      {
        q: "Is there a free Google Maps scraper?",
        a: "Several tools offer free tiers or trial credits, including Outscraper and Apify, and Contractor Leads gives 10 scored leads free. Free browser extensions exist too, but they are slower, less reliable and usually lack owner contacts.",
      },
      {
        q: "How many leads can I scrape from Google Maps?",
        a: "Google shows a limited number of results per search, so tools split large areas into smaller searches by city, ZIP code or map grid. The practical limit is your budget and how many businesses actually exist in the category and area.",
      },
    ],
    sections: [
      {
        heading: "What to look for in a Google Maps scraper",
        level: 2,
        body: "A scraper that returns thousands of rows is only useful if you can turn those rows into conversations. Judge each tool on the data you actually need for outreach, not on the size of the export.",
        table: {
          headers: ["Criterion", "Why it matters", "What good looks like"],
          rows: [
            ["Data fields", "Outreach needs more than a name and phone", "Rating, reviews, website, category, address, hours"],
            ["Owner contacts", "Generic info@ emails rarely reach the decision maker", "Owner name plus verified email where available"],
            ["Freshness", "Old exports mean closed businesses and bounces", "Data pulled live at search time"],
            ["Coverage of an area", "One search only shows a slice of results", "Splits cities and ZIP codes automatically"],
            ["Ease of use", "Setup time is a hidden cost", "Search by trade and city without code"],
            ["Pricing model", "Per-result, per-hour and seat pricing differ a lot", "Predictable cost per usable lead"],
          ],
        },
      },
      {
        heading: "The 7 best Google Maps scrapers in 2026",
        level: 2,
        body: "Each tool below is good at something different. We build Contractor Leads, so we list it first and say plainly where the others are the better fit. Check each vendor's site for current pricing, which changes often.",
      },
      {
        heading: "1. Contractor Leads: best for prospecting home-service contractors",
        level: 3,
        body: "Contractor Leads searches live Google data by trade and city, then adds owner names, verified emails, Meta ad status and an AI score for website, SEO and ad gaps, and writes outreach for each business. It is built for agencies, media buyers and sales teams selling to contractors, not for general data extraction. Start with 10 free leads from the [Google Maps scraper](/google-maps-scraper) page.",
        bullets: [
          "Best for: agencies that want ready-to-pitch contractor leads, not raw rows",
          "Limits: focused on 18 home-service trades rather than every business category",
        ],
      },
      {
        heading: "2. Outscraper: best for flexible pay-as-you-go data",
        level: 3,
        body: "Outscraper is a cloud service for extracting Google Maps places and reviews, with optional contact enrichment, billed per record with a free tier. It covers any category and suits teams that want a large raw dataset to process themselves. See our [Outscraper alternative](/alternatives/outscraper-alternative) comparison for how it differs on owner data and scoring.",
        bullets: [
          "Best for: large raw exports across any category",
          "Limits: you still need to qualify, score and write outreach yourself",
        ],
      },
      {
        heading: "3. Apify: best for developers and custom workflows",
        level: 3,
        body: "Apify is a scraping platform with a popular Google Maps scraper (an \"actor\") that you configure and run in the cloud, with usage-based pricing. It is powerful and flexible, and integrates with other tools through its API, but it rewards technical users. Compare it in our [Apify alternative](/alternatives/apify-google-maps-scraper-alternative) page.",
        bullets: [
          "Best for: developers who want full control and automation",
          "Limits: setup and tuning take time; data still needs qualifying",
        ],
      },
      {
        heading: "4. PhantomBuster: best if you already automate prospecting",
        level: 3,
        body: "PhantomBuster offers ready-made automations, including a Google Maps search export, alongside LinkedIn and other prospecting flows, with plans based on run time. It fits sales teams that chain several automations together. Our [PhantomBuster alternative](/alternatives/phantombuster-alternative) page explains the trade-offs for contractor prospecting.",
        bullets: [
          "Best for: teams running multi-step prospecting automations",
          "Limits: execution-time limits and little local-business scoring",
        ],
      },
      {
        heading: "5. Octoparse: best no-code option for custom pages",
        level: 3,
        body: "Octoparse is a visual, no-code web scraper with ready templates, including Google Maps, that runs on your computer or in its cloud. It is a good pick when you also need to scrape directories or websites beyond Maps.",
        bullets: [
          "Best for: non-developers scraping several kinds of sites",
          "Limits: templates can break when page layouts change",
        ],
      },
      {
        heading: "6. Bright Data: best for enterprise scale",
        level: 3,
        body: "Bright Data provides web data infrastructure, scraper APIs and ready-made datasets for very large volumes, with enterprise pricing and compliance processes. It is more than most agencies need, but suits data teams building products on local business data.",
        bullets: [
          "Best for: data teams and very high volumes",
          "Limits: cost and complexity for small agencies",
        ],
      },
      {
        heading: "7. D7 Lead Finder: best simple local lead lists",
        level: 3,
        body: "D7 Lead Finder searches local businesses by keyword and location and returns contact details such as emails and social profiles on a subscription. It is quick for simple lists, with no outreach or scoring built in. Our [D7 Lead Finder alternative](/alternatives/d7-lead-finder-alternative) page compares the two.",
        bullets: [
          "Best for: quick, simple local business lists",
          "Limits: no marketing-gap scoring or outreach generation",
        ],
      },
      {
        heading: "Side-by-side comparison",
        level: 2,
        body: "A quick view of where each tool fits. \"Partial\" means the feature exists but depends on add-ons, enrichment or your own setup.",
        table: {
          headers: ["Tool", "Best for", "Owner contacts", "Lead scoring", "Outreach", "Code needed"],
          rows: [
            ["Contractor Leads", "Contractor prospecting", "Yes", "Yes", "Yes", "No"],
            ["Outscraper", "Raw data at scale", "Partial", "No", "No", "No"],
            ["Apify", "Custom workflows", "Partial", "No", "No", "Some"],
            ["PhantomBuster", "Chained automations", "Partial", "No", "Partial", "No"],
            ["Octoparse", "Custom sites, no code", "No", "No", "No", "No"],
            ["Bright Data", "Enterprise volume", "Partial", "No", "No", "Some"],
            ["D7 Lead Finder", "Simple local lists", "Partial", "No", "No", "No"],
          ],
        },
      },
      {
        heading: "How to turn a Google Maps export into booked calls",
        level: 2,
        body: "The scrape is step one. The agencies that win clients add three steps after it; our [Google Maps lead generation guide](/blog/google-maps-lead-generation) walks through each in detail.",
        bullets: [
          "Qualify: keep businesses with good reviews but visible marketing gaps, such as no website or no ads",
          "Verify: check every email before sending to keep bounces under 2%",
          "Personalise: open with something specific to that business, such as their rating or a missing service page",
          "Follow up: most replies come after the first email, so plan three or four touches",
        ],
      },
      {
        heading: "Staying compliant",
        level: 2,
        body: "Collect business information only, respect Google's terms and rate limits through reputable tools, store data securely, and include a clear opt-out in every email. In the EU and UK, cold outreach to businesses needs a legitimate-interest basis; in the US, CAN-SPAM requires an accurate sender, a physical address and a working unsubscribe. When in doubt, ask a lawyer about your market.",
      },
    ],
  },

  // 2. Cold email follow-up
  {
    slug: "cold-email-follow-up",
    type: "cluster",
    title: "Cold Email Follow-Up: How Many, When, and What to Say",
    titleTag: "Cold Email Follow-Up: How Many, When & Templates (2026)",
    metaDescription:
      "How to follow up on cold emails: how many follow-ups to send, how long to wait between them, and six templates that get replies from busy contractor owners.",
    primaryKeyword: "cold email follow up",
    secondaryKeywords: [
      "how many follow up emails",
      "follow up email after no response",
      "cold email follow up template",
      "when to follow up on a cold email",
      "follow up sequence",
    ],
    searchVolume: "est. 2,000-4,000/mo",
    growth: "steady",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing"],
    directAnswer:
      "Send three to four follow-ups after your first cold email, so four or five touches in total, spaced further apart each time: about 2 to 3 days, then 4 to 5 days, then a week. Reply in the same thread, keep each follow-up shorter than the first email, and add something new every time, such as a specific observation, a result or an easy yes-or-no question. Stop immediately when someone replies, bounces or opts out, and end with a polite closing email.",
    summary:
      "How many follow-ups to send, a proven timing schedule, the rules that keep follow-ups from feeling pushy, and six templates for contractor outreach.",
    faqs: [
      {
        q: "How many follow-up emails should I send after a cold email?",
        a: "Three to four follow-ups is the usual sweet spot, for four or five emails in total. Fewer leaves replies on the table; many more starts to annoy people and raises spam complaints.",
      },
      {
        q: "How long should I wait before following up on a cold email?",
        a: "Wait two to three business days for the first follow-up, then widen the gap: four to five days for the second and about a week for the third and fourth.",
      },
      {
        q: "Should follow-ups go in the same email thread?",
        a: "Yes. Replying in the same thread keeps the context visible, looks like a normal conversation, and usually helps deliverability. Keep the original subject line with \"Re:\".",
      },
      {
        q: "What should I say in a follow-up email?",
        a: "Add something new each time: a specific observation about their business, a short result from a similar client, a useful resource or a simple yes-or-no question. Avoid empty \"just checking in\" emails.",
      },
      {
        q: "When should I stop following up?",
        a: "Stop as soon as the person replies, opts out or the email bounces, and after your final planned touch. Contractor Leads campaigns stop follow-ups automatically on replies, bounces and unsubscribes.",
      },
    ],
    sections: [
      {
        heading: "Why follow-ups matter",
        level: 2,
        body: "Contractor owners are on job sites, not at their desks. Your first email often arrives at the wrong moment, and a good follow-up simply catches them at a better one. In most outbound programmes a large share of replies come from follow-ups rather than the first email, which is why a sequence matters more than any single message. Start with a strong [cold email](/blog/cold-email-for-agencies), then plan the follow-ups before you send it.",
      },
      {
        heading: "How many follow-ups to send",
        level: 2,
        body: "Plan four or five touches in total: the first email plus three or four follow-ups. Each one should be shorter than the last and give the reader a new reason to reply. If a prospect has not responded after five well-spaced emails, a sixth rarely changes that, and extra emails increase spam complaints.",
      },
      {
        heading: "A follow-up schedule that works",
        level: 2,
        body: "Space follow-ups further apart each time, and send on business days in the prospect's time zone.",
        table: {
          headers: ["Touch", "When", "Purpose", "Length"],
          rows: [
            ["Email 1", "Day 1", "Specific observation and a clear offer", "60-120 words"],
            ["Follow-up 1", "Day 3-4", "Add one new detail or proof point", "30-60 words"],
            ["Follow-up 2", "Day 7-9", "Share a short result or example", "40-70 words"],
            ["Follow-up 3", "Day 14-16", "Ask a simple yes-or-no question", "20-40 words"],
            ["Follow-up 4", "Day 21-25", "Polite close, leave the door open", "20-40 words"],
          ],
        },
      },
      {
        heading: "Rules for follow-ups that get replies",
        level: 2,
        body: "Good follow-ups feel like a helpful nudge, not pressure.",
        bullets: [
          "Reply in the same thread and keep the subject with \"Re:\"",
          "Add something new every time; never send an empty \"just checking in\"",
          "Keep each follow-up shorter than the email before it",
          "Ask one easy question that can be answered in a word",
          "Vary the wording across leads with spintax so no two emails are identical",
          "Stop on reply, bounce or opt-out, and honour opt-outs immediately",
          "Send from warmed-up mailboxes and keep daily volume per mailbox modest",
        ],
      },
      {
        heading: "Six follow-up templates for contractor outreach",
        level: 2,
        body: "Adapt these to your offer. Variables such as {{firstName}} and {{businessName}} fill in automatically in Contractor Leads campaigns.",
      },
      {
        heading: "Template 1: the new detail",
        level: 3,
        body: "\"Hi {{firstName}}, one more thing I noticed: {{businessName}} has great reviews but no page for emergency repairs, which is what most people search for after a storm. Worth a quick look at how to fix that?\"",
      },
      {
        heading: "Template 2: the short result",
        level: 3,
        body: "\"Hi {{firstName}}, a roofer in a similar-sized town added a simple estimate page and started booking more inspections from Google within a few weeks. Happy to show you what we changed. Interested?\"",
      },
      {
        heading: "Template 3: the useful resource",
        level: 3,
        body: "\"Hi {{firstName}}, I put together a one-page checklist of the five fixes that most help contractors show up on Google Maps. Want me to send it over?\"",
      },
      {
        heading: "Template 4: the yes-or-no question",
        level: 3,
        body: "\"Hi {{firstName}}, quick one: is getting more booked jobs from Google something you're working on this season, or is the schedule already full?\"",
      },
      {
        heading: "Template 5: the different angle",
        level: 3,
        body: "\"Hi {{firstName}}, if a new website isn't a priority, a faster win is your Google Business Profile: more photos, review replies and service categories. I can send three specific suggestions for {{businessName}}.\"",
      },
      {
        heading: "Template 6: the polite close",
        level: 3,
        body: "\"Hi {{firstName}}, I won't keep filling your inbox. If more booked jobs from Google becomes a priority, just reply to this email and I'll pick it up from here. Wishing you a strong season.\"",
      },
      {
        heading: "Follow up on more than email",
        level: 2,
        body: "A short call between email two and three often doubles as a follow-up: mention that you sent a note and ask one question. Our [cold calling script](/blog/cold-calling-contractors-script) has openers that work with busy owners, and strong [subject lines](/blog/cold-email-subject-lines-for-contractors) help the first email get opened in the first place.",
        callout: {
          title: "Automate it without losing the personal touch",
          text: "Contractor Leads campaigns send each follow-up in the same thread from the same mailbox, vary wording per lead with spintax, and stop automatically when a lead replies, bounces or unsubscribes.",
        },
      },
    ],
  },

  // 3. Flooring contractor leads
  {
    slug: "flooring-contractor-leads",
    type: "cluster",
    title: "Flooring Contractor Leads: How Agencies Find and Win Flooring Companies",
    titleTag: "Flooring Contractor Leads: Find & Win Flooring Clients (2026)",
    metaDescription:
      "How agencies find and win flooring contractors: where flooring leads come from, installers vs showrooms, the gaps that signal a sale and what they buy.",
    primaryKeyword: "flooring contractor leads",
    secondaryKeywords: [
      "flooring leads",
      "flooring company leads",
      "marketing for flooring contractors",
      "flooring installer leads",
      "how to get flooring clients",
    ],
    searchVolume: "est. 300-1,000/mo",
    growth: "steady",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["flooring", "remodeling", "home-improvement"],
    directAnswer:
      "To find flooring contractor leads, pull flooring installers and flooring stores by city from Google Maps or a lead tool, then target owner-run installers and showrooms with good reviews but few project photos, no pages for their main materials and no ads. Flooring buyers compare options for weeks, so flooring companies value marketing that builds trust and captures estimate requests: project-gallery websites, material-specific pages, review generation and Google Ads on terms such as \"hardwood floor installation near me\".",
    summary:
      "Where flooring leads come from, how installers and showrooms differ, the gaps that signal a sale, what to sell first and how to report results.",
    faqs: [
      {
        q: "Which flooring companies are the best agency clients?",
        a: "Owner-run installers and independent flooring showrooms that sell installed projects. They have enough margin per job to fund marketing and the owner usually decides quickly. Big-box retailers and national chains rarely hire local agencies.",
      },
      {
        q: "What marketing do flooring contractors buy?",
        a: "Most often a website with project galleries and pages for each material, Google Business Profile and review management, Google Ads on installation terms, and follow-up for estimates that go quiet.",
      },
      {
        q: "When do flooring companies get busiest?",
        a: "Demand is fairly steady, with peaks in spring and in early autumn before the holidays, when homeowners want new floors before hosting. Pitch growth campaigns a month or two ahead of those peaks.",
      },
      {
        q: "How do flooring companies get leads today?",
        a: "Mostly referrals from builders, designers and past customers, showroom walk-ins, and Google searches. Many rely on referrals alone and have little search presence, which is the opening for an agency.",
      },
    ],
    sections: [
      {
        heading: "Why flooring is a good niche for agencies",
        level: 2,
        body: "Flooring projects are mid-to-high ticket, very visual and researched online, yet many flooring companies still depend on referrals. That gap between a strong reputation and weak online visibility is easy to show in a pitch. Use the [flooring lead finder](/industries/flooring) to pull flooring companies by city and compare their reviews with their web presence.",
      },
      {
        heading: "Installers, showrooms and refinishers",
        level: 2,
        body: "Flooring businesses fall into a few groups, and each buys marketing differently.",
        table: {
          headers: ["Segment", "How they win work", "Agency fit"],
          rows: [
            ["Installation contractors", "Search, referrals from builders and designers", "Excellent"],
            ["Independent showrooms", "Walk-ins, search, local reputation", "Excellent"],
            ["Refinishing specialists", "Search and reviews for hardwood refinishing", "Good"],
            ["Commercial flooring", "Bids and general contractor relationships", "Fair"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Flooring is sold on looks and trust, so missing visuals and thin service pages are the clearest openings.",
        bullets: [
          "Strong reviews but few photos of finished floors",
          "No separate pages for hardwood, luxury vinyl, tile and carpet",
          "No online estimate or measurement request",
          "Not running Google Ads while competitors are",
          "No follow-up on quotes, so estimates go quiet",
        ],
      },
      {
        heading: "What to offer first",
        level: 2,
        body: "Start with a visible win on the Google Business Profile (new photos, product categories and review replies; see the [GBP optimization guide](/blog/google-business-profile-optimization-for-contractors)), then build material-specific pages and add search ads. Flooring pairs naturally with [remodeling](/blog/remodeling-contractor-leads) companies, so a referral angle can help you win both.",
        table: {
          headers: ["Offer", "Why flooring companies buy it", "Typical price range"],
          rows: [
            ["Business Profile + reviews", "Fast lift in map visibility", "$300-$800/mo"],
            ["Gallery website with material pages", "Captures research-stage buyers", "$2,500-$8,000 one-off"],
            ["Google Ads on installation terms", "Direct estimate requests", "$750-$2,000/mo + spend"],
            ["Estimate follow-up emails and texts", "Recovers quotes that go quiet", "$200-$500/mo"],
          ],
        },
      },
      {
        heading: "How to report results",
        level: 2,
        body: "Report on estimate requests, in-home measurements booked and the value of quotes issued. Flooring owners track jobs by square footage and margin, so tie your monthly report to booked projects rather than clicks or impressions.",
      },
    ],
  },

  // 4. Fencing contractor leads
  {
    slug: "fencing-contractor-leads",
    type: "cluster",
    title: "Fencing Contractor Leads: How Agencies Find and Win Fence Companies",
    titleTag: "Fencing Contractor Leads: Find & Win Fence Clients (2026)",
    metaDescription:
      "How agencies find and win fence companies: where fencing leads come from, residential vs commercial work, seasonality and what fence contractors buy.",
    primaryKeyword: "fencing contractor leads",
    secondaryKeywords: [
      "fence leads",
      "fence company leads",
      "marketing for fence companies",
      "fence contractor clients",
      "how to get fence clients",
    ],
    searchVolume: "est. 300-1,000/mo",
    growth: "seasonal",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["fencing", "landscaping", "concrete"],
    directAnswer:
      "Agencies find fencing contractor leads by pulling fence companies by city from Google Maps or a lead tool, then targeting residential installers with strong reviews but few project photos, no pages for each fence type and no ads. Fence demand peaks in spring and summer, so owners buy marketing in late winter. The offers that work are gallery websites with pages for wood, vinyl, aluminium and chain-link fencing, Google Business Profile management, review generation and search ads on \"fence installation near me\" terms.",
    summary:
      "Where fence company leads come from, residential vs commercial fencing, the seasonal calendar, the gaps that signal a sale and what to sell first.",
    faqs: [
      {
        q: "When should I pitch marketing to fence companies?",
        a: "Late winter, from January to March, when owners plan for the spring rush. Demand stays high through summer, so mid-season outreach should focus on quick wins such as reviews and Business Profile updates.",
      },
      {
        q: "Which fence companies are the best agency clients?",
        a: "Residential fence installers with a few crews. Homeowners find them through Google, jobs are visual and easy to showcase, and the owner usually decides quickly.",
      },
      {
        q: "What marketing do fence contractors need?",
        a: "A website with galleries and pages for each fence type and material, an active Business Profile, review generation, and Google Ads or Local Services Ads for high-intent installation searches.",
      },
      {
        q: "Do fence companies get leads from home builders?",
        a: "Some do, especially in growing suburbs, but most residential work comes from homeowners replacing or adding fences, which makes search and reviews the main growth levers.",
      },
    ],
    sections: [
      {
        heading: "Why fence companies are a strong niche",
        level: 2,
        body: "Fencing is a clear, project-based purchase: homeowners search, compare a few quotes and book. Many fence companies are excellent operators with dozens of reviews but simple websites, which makes them receptive to a specific pitch. Use the [fencing lead finder](/industries/fencing) to see how many active fence companies are in your target cities.",
      },
      {
        heading: "Residential vs commercial fencing",
        level: 2,
        body: "Segment your list before outreach.",
        table: {
          headers: ["Segment", "Typical work", "Agency fit"],
          rows: [
            ["Residential installers", "Privacy, picket, pool and pet fences", "Excellent"],
            ["Ornamental and custom", "Aluminium, iron, gates and custom builds", "Excellent: high ticket, visual"],
            ["Farm and ranch", "Agricultural and rural fencing", "Fair: regional, referral driven"],
            ["Commercial and security", "Chain-link, security and site fencing", "Fair: bids and contracts"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Look for owners who are winning on reputation but not on visibility.",
        bullets: [
          "Strong reviews but no photo gallery of finished fences",
          "One generic page instead of pages for wood, vinyl, aluminium and chain-link",
          "No service-area pages for nearby towns",
          "No online quote request, or one that is hard to find on mobile",
          "Competitors running ads on \"fence installation near me\" while they are not",
        ],
      },
      {
        heading: "Seasonal outreach calendar",
        level: 2,
        body: "Time outreach to when owners are planning, not when crews are flat out.",
        table: {
          headers: ["Months", "Owner mindset", "What to pitch"],
          rows: [
            ["Jan - Mar", "Planning the season", "Website, GBP clean-up, spring ads"],
            ["Apr - Aug", "Peak installs", "Reviews and quick wins only"],
            ["Sep - Oct", "Autumn installs, slowing down", "Results review, gate and repair campaigns"],
            ["Nov - Dec", "Quiet season", "Annual retainers and budgets"],
          ],
        },
      },
      {
        heading: "What to sell first",
        level: 2,
        body: "Begin with the Business Profile and photos, then a gallery website and search ads. Fence companies often work alongside [landscaping](/blog/landscaping-leads) and [concrete](/blog/concrete-contractor-leads) contractors, so referral partnerships can help you win several clients in one market. If they have no website at all, the approach in [finding businesses without websites](/blog/how-to-find-businesses-without-websites) applies directly.",
      },
      {
        heading: "How to report results",
        level: 2,
        body: "Report quote requests, booked estimates and linear feet or project value quoted. Fence owners know their close rate well, so showing quotes added by your work makes the value obvious.",
      },
    ],
  },

  // 5. Pool service leads
  {
    slug: "pool-service-leads",
    type: "cluster",
    title: "Pool Service Leads: How Agencies Find and Win Pool Companies",
    titleTag: "Pool Service Leads: Find & Win Pool Company Clients (2026)",
    metaDescription:
      "How agencies find and win pool companies: service, repair and builder segments, where pool leads come from and the recurring-route pitch that closes.",
    primaryKeyword: "pool service leads",
    secondaryKeywords: [
      "pool company leads",
      "pool cleaning leads",
      "marketing for pool companies",
      "pool builder leads",
      "how to get pool service clients",
    ],
    searchVolume: "est. 300-1,000/mo",
    growth: "seasonal",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["pool-services", "landscaping", "cleaning-services"],
    directAnswer:
      "To find pool service leads, pull pool cleaning, repair and pool building companies by city from Google Maps or a lead tool, focusing on warm-weather and suburban markets. Target owner-run companies with good reviews but no online booking, thin service pages and no ads. Pool service is recurring, so owners value marketing that adds weekly route customers, while pool builders want high-ticket project leads. Sell booking-ready websites, review generation, Local Services Ads and seasonal opening and closing campaigns.",
    summary:
      "The three kinds of pool businesses, where pool leads come from, the recurring-route pitch, the seasonal calendar and what to sell first.",
    faqs: [
      {
        q: "What kinds of pool companies hire marketing agencies?",
        a: "Pool service and cleaning companies that want more weekly route customers, pool repair and equipment specialists, and pool builders that want high-ticket construction leads. Each needs a different message.",
      },
      {
        q: "When is the best time to pitch pool companies?",
        a: "In warm climates, late winter before the season ramps up. In colder regions, early spring ahead of pool openings and late summer ahead of closings. Avoid peak summer, when owners are busiest.",
      },
      {
        q: "Why is route density important for pool service companies?",
        a: "Pool service companies earn more when customers are close together, because technicians spend less time driving. Marketing that targets specific neighbourhoods to fill routes is especially valuable to them.",
      },
      {
        q: "What should a pool company's website include?",
        a: "Clear pages for weekly service, repairs, equipment and openings or closings, service areas, starting prices or a quote form, online booking, and reviews near every call to action.",
      },
    ],
    sections: [
      {
        heading: "Why pool companies are worth pursuing",
        level: 2,
        body: "Pool service combines recurring revenue with high-value repairs and upgrades, and pool builders sell some of the largest residential projects in home services. In warm, suburban markets there are many independent operators with strong reviews but basic websites. Use the [pool services lead finder](/industries/pool-services) to pull them by city.",
      },
      {
        heading: "Three kinds of pool businesses",
        level: 2,
        body: "Segment first, because the pitch is completely different for each.",
        table: {
          headers: ["Segment", "What they want", "What to pitch"],
          rows: [
            ["Service and cleaning", "More weekly route customers nearby", "Local search, reviews, neighbourhood campaigns"],
            ["Repair and equipment", "Higher-ticket repair and upgrade jobs", "Search ads, repair pages, follow-up"],
            ["Pool builders", "Large construction projects", "Portfolio site, Google Ads, nurture emails"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "Small friction points cost pool companies customers every week.",
        bullets: [
          "No online booking or quote request",
          "No separate pages for weekly service, repairs and equipment",
          "Few recent reviews, or reviews with no replies",
          "No service-area pages for the neighbourhoods they want to fill",
          "No reminders or campaigns for openings, closings and equipment upgrades",
        ],
      },
      {
        heading: "The recurring-route pitch",
        level: 2,
        body: "For service companies, talk about route customers, not leads. Ask how many weekly customers they gained last season and which neighbourhoods they want to fill. Then show how local search, [Local Services Ads](/blog/local-service-ads) and review generation bring customers in those exact areas.",
        callout: {
          title: "Opening line that works",
          text: "\"Your reviews are excellent. Which neighbourhoods would you most like to add weekly customers in? We help pool companies fill specific routes from Google.\"",
        },
      },
      {
        heading: "Seasonal outreach calendar",
        level: 2,
        body: "Adjust these dates for warm climates, where the season is longer.",
        table: {
          headers: ["Months", "Owner mindset", "What to pitch"],
          rows: [
            ["Jan - Mar", "Planning the season", "Website, LSAs, opening campaigns"],
            ["Apr - Aug", "Peak season", "Reviews and quick wins"],
            ["Sep - Oct", "Closings and upgrades", "Closing and equipment campaigns"],
            ["Nov - Dec", "Quiet season", "Annual retainers, builder lead generation"],
          ],
        },
      },
      {
        heading: "How to report results",
        level: 2,
        body: "For service companies, report new route customers, cost per route customer and retention. For builders, report consultations booked and project value quoted. Pool businesses work closely with [landscaping](/blog/landscaping-leads) and [cleaning](/blog/cleaning-business-leads) companies too, which can open referral partnerships.",
      },
    ],
  },

  // 6. Garage door leads
  {
    slug: "garage-door-leads",
    type: "cluster",
    title: "Garage Door Leads: How Agencies Find and Win Garage Door Companies",
    titleTag: "Garage Door Leads: Find & Win Garage Door Clients (2026)",
    metaDescription:
      "How agencies find and win garage door companies: repair vs installation, where the leads come from, what leads cost and the marketing they buy.",
    primaryKeyword: "garage door leads",
    secondaryKeywords: [
      "garage door company leads",
      "garage door repair leads",
      "marketing for garage door companies",
      "garage door installer leads",
      "how to get garage door clients",
    ],
    searchVolume: "est. 300-1,000/mo",
    growth: "steady",
    cluster: "trade-playbooks",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["garage-doors", "windows-and-doors", "home-improvement"],
    directAnswer:
      "Agencies find garage door leads by pulling garage door repair and installation companies by city from Google Maps or a lead tool, then targeting independent operators with good reviews but weak websites, no emergency-repair pages and no Local Services Ads. Garage door repair is urgent, so homeowners call the first trustworthy company they find; that makes Local Services Ads, Google Ads, a strong Business Profile and fast call handling the highest-value services you can sell them.",
    summary:
      "Repair vs installation businesses, where garage door leads come from, typical lead costs, the gaps that signal a sale and an outreach plan.",
    faqs: [
      {
        q: "What marketing works best for garage door companies?",
        a: "Local Services Ads and Google Ads for urgent repair searches, a strong Google Business Profile with reviews, and a mobile-friendly website with clear repair pages and click-to-call. Installation and new-door sales benefit from galleries and financing information.",
      },
      {
        q: "How much do garage door leads cost?",
        a: "Repair leads from search ads and Local Services Ads commonly cost from about $30 to over $100 depending on the market and competition. Because many repairs lead to spring, opener or full-door sales, the value of each customer is often much higher than the first ticket.",
      },
      {
        q: "Which garage door companies are the best agency clients?",
        a: "Independent repair and installation companies with a few vans. They depend on local search, decide quickly, and feel the difference of a few extra calls a week.",
      },
      {
        q: "Why is call handling important for garage door companies?",
        a: "Most repair customers call rather than fill in forms, and they call the next company if nobody answers. Missed-call text-back and call tracking often improve results as much as more ad spend.",
      },
    ],
    sections: [
      {
        heading: "Why garage door companies are strong clients",
        level: 2,
        body: "A broken garage door is urgent: the homeowner cannot get the car out or secure the house, so they search and call immediately. That urgency makes search marketing highly effective, and repairs often lead to opener or new-door sales. Use the [garage door lead finder](/industries/garage-doors) to pull independent companies by city.",
      },
      {
        heading: "Repair vs installation",
        level: 2,
        body: "Most companies do both, but their marketing priorities differ.",
        table: {
          headers: ["Work type", "How customers buy", "What to pitch"],
          rows: [
            ["Emergency repair", "Urgent search, first trustworthy call", "LSAs, Google Ads, click-to-call, call handling"],
            ["Springs and openers", "Search and upsell during repairs", "Repair pages, reviews, follow-up offers"],
            ["New door installation", "Research, compare styles and prices", "Galleries, financing info, retargeting"],
            ["Commercial doors", "Contracts and property managers", "Outreach and case studies"],
          ],
        },
      },
      {
        heading: "Gaps that signal a sale",
        level: 2,
        body: "In an urgent niche, small gaps lose calls every day.",
        bullets: [
          "Not running Local Services Ads where competitors show the Google badge",
          "No dedicated pages for spring repair, opener repair and emergency service",
          "No click-to-call button on mobile",
          "Slow or no answer when you call during business hours",
          "Strong reviews but no replies and few photos",
        ],
      },
      {
        heading: "What to sell first",
        level: 2,
        body: "Start where urgency is: [Local Services Ads](/blog/local-service-ads) and a Business Profile clean-up, then repair landing pages with click-to-call and call tracking. Add a missed-call text-back so no urgent caller goes to a competitor. See our breakdown of [what contractor leads cost](/blog/how-much-do-contractor-leads-cost) for benchmark context.",
        table: {
          headers: ["Offer", "Why it works", "Typical price range"],
          rows: [
            ["Local Services Ads management", "Badge and pay-per-lead for urgent searches", "$300-$800/mo"],
            ["Repair landing pages + call tracking", "More calls from the same traffic", "$1,500-$4,000 one-off"],
            ["Google Ads on repair terms", "Captures urgent demand all day", "$750-$2,000/mo + spend"],
            ["Missed-call text-back and reviews", "Saves lost calls, builds trust", "$150-$400/mo"],
          ],
        },
      },
      {
        heading: "A three-touch outreach plan",
        level: 2,
        body: "Keep it short and specific: call first during business hours (note how quickly they answer), send a brief email naming one gap such as missing Local Services Ads, then [follow up](/blog/cold-email-follow-up) a few days later with a screenshot of competitors showing above them. Owners in urgent niches respond to evidence of calls they are losing.",
      },
    ],
  },
];
