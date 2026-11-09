/**
 * Trade-specific copy for the /industries/[trade] hubs: a quick answer, what owners in
 * that trade buy from agencies, when they buy, and FAQs. Written per trade so the hubs
 * are genuinely different pages, not one template with the trade name swapped.
 */
export type TradeHubContent = {
  quickAnswer: { q: string; a: string };
  buys: string[];
  season: string;
  /** Searches homeowners use to find this trade, used to frame the pitch (no volumes claimed). */
  searchTerms?: string[];
  /** Common mistakes agencies make when pitching this trade. Each starts with a short sentence. */
  mistakes?: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const TRADE_HUB_CONTENT: Record<string, TradeHubContent> = {
  roofing: {
    quickAnswer: {
      q: "How do agencies find roofing contractor leads?",
      a: "Agencies find roofing contractor leads by searching live Google data for roofers by city or state, then prioritising companies with strong reviews but weak websites, no Local Services Ads or no storm-repair pages. Contractor Leads adds owner names, verified emails and AI scores, so you pitch the roofers most likely to buy first.",
    },
    buys: [
      "Local Services Ads and Google Ads for storm, repair and replacement searches",
      "Storm and insurance-claim landing pages that launch quickly after hail or wind events",
      "Review generation after every completed roof",
      "Websites with project galleries and service-area pages",
    ],
    season: "Roofers buy marketing in late winter and early spring, before storm and replacement season, and again after major storms when demand outruns their crews.",
    searchTerms: ["roof repair", "roof replacement", "roofing contractor", "roof leak repair", "storm damage roof repair", "metal roofing", "roof inspection"],
    mistakes: [
      "Pitching during storm cleanup. Right after hail or wind, owners are on roofs and adjusters' calls, not reading cold email. Pitch before the season or once the backlog clears.",
      "Selling generic SEO. Roofers judge marketing by signed roofs, so tie the pitch to repair, replacement and insurance-claim searches, not rankings in general.",
      "Ignoring Local Services Ads and reviews. In many cities the Google Guaranteed badge and review count decide who gets the call; check both before you pitch.",
      "Promising more leads to a crew that is already booked. Ask about capacity first; a roofer turning work away needs higher-margin jobs, not more volume.",
    ],
    faqs: [
      {
        q: "Why are roofers good clients for marketing agencies?",
        a: "Roof replacements are high-ticket jobs, so one extra signed roof can pay for months of marketing. Demand is urgent and search-driven after storms, which makes results easy to show, and many roofers still rely on referrals and door knocking with weak websites.",
      },
      {
        q: "What is the best way to pitch a roofing company?",
        a: "Open with one specific gap, such as missing Local Services Ads or no storm-repair page, and name a nearby competitor that outranks them. Keep it short, offer a quick audit, and follow up after storms, when owners feel the cost of missed calls most.",
      },
      {
        q: "Which roofing companies should I contact first?",
        a: "Owner-run residential roofers with good reviews but a dated or missing website and no ads. They have enough jobs to afford a retainer, decide quickly, and gain the most from better visibility. Large storm-chasing outfits usually have in-house marketing.",
      },
      {
        q: "How much do roofers pay agencies?",
        a: "Retainers for owner-run roofers commonly run from about $1,000 to $3,500 a month plus ad spend, depending on services. Storm-season campaigns and Local Services Ads management are often sold as add-ons with clear lead-based reporting.",
      },
      {
        q: "Can I find roofers in a specific state?",
        a: "Yes. Every US state has its own roofing page with weather factors, timing and the largest cities, and the app searches any city, county or radius you choose with live Google data and owner enrichment.",
      },
    ],
  },
  hvac: {
    quickAnswer: {
      q: "How do agencies find HVAC contractor leads?",
      a: "Agencies find HVAC contractor leads by searching live Google data for heating and air-conditioning companies by city or state, then targeting owner-run businesses with good reviews but weak websites, no maintenance-plan offers or no ads. Contractor Leads adds owner names, verified emails and AI scores so you can rank who to pitch first.",
    },
    buys: [
      "Google Ads and Local Services Ads for AC repair, furnace repair and replacement",
      "Maintenance-plan and tune-up campaigns to existing customers",
      "Websites with clear repair, replacement and financing pages",
      "Call tracking and missed-call text-back during peak season",
    ],
    season: "HVAC owners plan marketing before each peak: late winter and spring for cooling season, late summer for heating season.",
    searchTerms: ["AC repair", "furnace repair", "HVAC company", "air conditioner installation", "heat pump installation", "emergency AC repair", "HVAC maintenance"],
    mistakes: [
      "Pitching at peak season. In the first heatwave or cold snap, owners are running calls themselves. Shoulder seasons (spring and autumn) are when they plan marketing.",
      "Ignoring maintenance plans. Recurring service agreements smooth out seasonal cash flow, so a pitch that grows memberships often lands better than one that only adds repair calls.",
      "Overlooking missed and after-hours calls. Many HVAC searches are emergencies; if calls go to voicemail, more ads only waste money. Test the phone line before you pitch.",
      "Using one pitch for residential and commercial. Commercial HVAC buyers are facility managers on contracts, a different funnel from homeowners searching for AC repair.",
    ],
    faqs: [
      {
        q: "Why do agencies target HVAC companies?",
        a: "HVAC has urgent, search-driven demand, high replacement values and recurring maintenance plans, so marketing results are easy to measure. Many owner-run HVAC companies have strong reviews but weak websites and little paid search, leaving room for clear wins.",
      },
      {
        q: "When is the best time to pitch HVAC contractors?",
        a: "Pitch in the shoulder seasons, before summer cooling demand and before winter heating demand. During peak weeks owners are busy and respond best to very short, specific offers rather than long sales calls.",
      },
      {
        q: "What should an HVAC marketing offer include?",
        a: "Search ads and Local Services Ads for repair and replacement, a website with financing and service-area pages, review generation, and maintenance-plan campaigns that keep technicians busy in slower months. Report on booked calls and replacement quotes.",
      },
      {
        q: "Which HVAC companies are the best prospects?",
        a: "Independent companies with a few trucks and good reviews but no ads or a dated website. They decide quickly and feel each extra booked call, while large franchises and private-equity-backed groups usually have central marketing teams.",
      },
      {
        q: "Does Contractor Leads show which HVAC companies run ads?",
        a: "Yes. Each lead shows whether the business is running Meta ads, along with website, SEO and PPC scores from 0 to 100, so you can spot companies with no paid presence and lead with that gap.",
      },
    ],
  },
  plumbing: {
    quickAnswer: {
      q: "How do agencies find plumbing contractor leads?",
      a: "Agencies find plumbing contractor leads by searching live Google data for plumbers by city or state, then targeting owner-run companies with strong reviews but slow call handling, weak websites or no Local Services Ads. Contractor Leads adds owner names, verified emails and AI scores so you pitch the plumbers with the biggest visible gaps first.",
    },
    buys: [
      "Local Services Ads and emergency-search Google Ads",
      "Emergency, drain, water-heater and repiping service pages",
      "Click-to-call, call tracking and missed-call text-back",
      "Review generation and Google Business Profile management",
    ],
    season: "Plumbing demand is steady year-round, with extra urgency before winter in cold states and before storm season on the coasts.",
    searchTerms: ["plumber", "emergency plumber", "drain cleaning", "water heater repair", "water heater installation", "leak detection", "sewer line repair"],
    mistakes: [
      "Not checking answer speed. Plumbing searches are urgent and the first company to answer usually wins the job; call the number before you pitch and mention what happened.",
      "Ignoring emergency intent. Pages and ads for burst pipes, blocked drains and no hot water convert far better than a generic services page.",
      "Pitching a new website when the gap is click-to-call. On phones, call buttons, Local Services Ads and the Google Business Profile often matter more than the site design.",
      "Missing service-area pages. Plumbers cover several towns; separate pages for the suburbs they serve are an easy, concrete win to show.",
    ],
    faqs: [
      {
        q: "Why are plumbers strong agency clients?",
        a: "Plumbing emergencies send homeowners straight to search and they call the first trustworthy company, so visibility converts quickly into jobs. Many plumbers have excellent reviews but miss calls or lack service pages, which makes the gap easy to demonstrate.",
      },
      {
        q: "What is the best opening for a plumber?",
        a: "Call during business hours and note how fast they answer, then show the gap: missing Local Services Ads, no emergency page or competitors above them on the map. A short audit with two or three fixes works better than a long proposal.",
      },
      {
        q: "Which plumbing services pay best to market?",
        a: "Emergency repairs, water-heater replacement, repiping and sewer or drain work. These are urgent or high-ticket jobs where one extra booking per week clearly pays for the marketing.",
      },
      {
        q: "How do I report results to a plumbing company?",
        a: "Report booked calls, answered versus missed calls, and revenue from jobs that came from marketing. Plumbers track jobs, not clicks, so call tracking from day one makes your results visible and keeps retainers renewing.",
      },
      {
        q: "Can I target plumbers in one city?",
        a: "Yes. Search any city, county or radius with live Google data. Each lead shows rating, review count, website status and ad activity, and you can filter to the businesses with the largest marketing gaps.",
      },
    ],
  },
  electrical: {
    quickAnswer: {
      q: "How do agencies find electrical contractor leads?",
      a: "Agencies find electrical contractor leads by searching live Google data for electricians by city or state, then targeting owner-run companies with good reviews but no pages for high-ticket work such as panel upgrades, generators and EV chargers. Contractor Leads adds owner names, verified emails and AI scores so you can prioritise the best prospects.",
    },
    buys: [
      "Landing pages and search ads for panel upgrades, generators and EV chargers",
      "Local Services Ads for urgent electrical repairs",
      "Websites with service-area pages and project photos",
      "Review generation and Google Business Profile management",
    ],
    season: "Electricians respond well before storm and winter seasons, when generator and panel demand rises, and year-round for EV charger installs.",
    searchTerms: ["electrician", "emergency electrician", "panel upgrade", "EV charger installation", "generator installation", "electrical repair", "electrical contractor"],
    mistakes: [
      "Using one pitch for residential and commercial. Commercial electrical contractors win work through bids and general contractors, not homeowner searches.",
      "Ignoring the EV charger and generator niches. These are higher-ticket, searchable services many electricians want more of; a pitch built around one niche stands out.",
      "Leading with a generic website redesign. Show the specific searches (panel upgrade, EV charger installation) where they do not appear today.",
      "Forgetting licensing and trust signals. Licence numbers, insurance and reviews on the site and profile matter more for electrical work than for most trades.",
    ],
    faqs: [
      {
        q: "Why should agencies target electricians?",
        a: "Electricians increasingly sell high-ticket work such as panel upgrades, standby generators and EV chargers, and those buyers search online. Many electrical contractors still market only general repairs, so a page and ad campaign for one high-ticket service is a clear, measurable win.",
      },
      {
        q: "What is the best pitch for an electrical contractor?",
        a: "Pick one high-ticket service they already offer, such as EV chargers or generators, and show that they have no page or ads for it while competitors do. Offer a landing page with search ads behind it and report on the quotes it produces.",
      },
      {
        q: "Which electricians are the best prospects?",
        a: "Residential and light-commercial electricians with a few vans, good reviews and a weak website. Large commercial electrical contractors mostly win work through bids and general contractor relationships, so search marketing changes less for them.",
      },
      {
        q: "When do electricians buy marketing?",
        a: "Generator and panel campaigns sell best before storm or winter seasons, when homeowners think about outages. EV charger and service-upgrade campaigns work year-round, so electricians can usually be pitched in any month.",
      },
      {
        q: "Can I see which electricians already advertise?",
        a: "Yes. Each lead shows Meta ad activity and scores for website, SEO and PPC, so you can find electricians with no paid presence and lead with that gap in your outreach.",
      },
    ],
  },
  solar: {
    quickAnswer: {
      q: "How do agencies find solar contractor leads?",
      a: "Agencies find solar contractor leads by searching live Google data for solar installers by city or state, then focusing on independent installers with strong reviews but weak websites, unclear financing pages or no ads. Contractor Leads adds owner names, verified emails and AI scores, so you can reach the installers most likely to need marketing help.",
    },
    buys: [
      "Meta and Google ads with clear savings, financing and battery-backup messaging",
      "Websites with installation galleries, financing explainers and reviews",
      "Appointment setting and follow-up for long-cycle homeowner decisions",
      "Review generation and reputation management in a trust-sensitive market",
    ],
    season: "Solar installers market most heavily in late winter and spring, when homeowners notice energy bills and plan home projects.",
    searchTerms: ["solar installers", "solar panel installation", "solar companies", "home battery installation", "solar roofing", "solar panel cost"],
    mistakes: [
      "Selling more leads when the problem is acquisition cost. Many solar companies already buy leads; the stronger pitch is a lower cost per signed contract.",
      "Ignoring incentive changes. Tax credits, net metering and state rebates change often and move demand; check what has changed in their state before you write.",
      "Treating installers and sales organisations the same. Some solar companies install, others only sell; their margins, funnels and decision makers differ.",
      "Promising volume without a qualification step. Shade, roof condition and credit kill many solar leads; offer filtering, not just more forms.",
    ],
    faqs: [
      {
        q: "Why are solar installers good agency clients?",
        a: "Solar systems are high-value purchases with long decision cycles, so installers depend on steady, well-qualified appointments. Independent installers often compete with national brands that outspend them, and they value agencies that can bring exclusive leads and handle follow-up.",
      },
      {
        q: "What makes solar marketing different from other trades?",
        a: "Homeowners research solar for weeks or months and worry about trust, financing and payback. Effective campaigns combine ads with clear financing explanations, reviews, battery-backup messaging and persistent follow-up rather than relying on one-touch emergency demand.",
      },
      {
        q: "Which solar companies should I pitch first?",
        a: "Independent residential installers with good reviews but weak websites or no ads. They need a steady flow of appointments and decide quickly. National solar brands and large dealer networks usually run marketing in-house.",
      },
      {
        q: "Do solar incentives affect how I pitch installers?",
        a: "Yes. Incentives and net-metering rules vary by state and utility and change over time, which shapes how installers sell. Check current programs, for example in the DSIRE database, before using savings figures in ads or outreach.",
      },
      {
        q: "Can I find solar installers in my state?",
        a: "Yes. Every US state has a solar page covering its sun resource, weather factors and largest cities, and the app searches any city, county or radius with live Google data and owner enrichment.",
      },
    ],
  },
  "general-contractors": {
    quickAnswer: {
      q: "How do agencies find general contractor leads?",
      a: "Agencies find general contractor leads by searching live Google data for general contractors and builders by city or state, then targeting residential and remodel-focused firms with strong reviews but thin project galleries and no search ads. Contractor Leads adds owner names, verified emails and AI scores, so you can pitch the right GCs first.",
    },
    buys: [
      "Project-gallery websites with pages for additions, kitchens and custom homes",
      "Google Ads on high-ticket project searches",
      "Google Business Profile management and review generation",
      "Estimate follow-up systems that recover quotes that go quiet",
    ],
    season: "General contractors in cold states book spring and summer work in winter; elsewhere they can be pitched year-round.",
    searchTerms: ["general contractor", "home addition contractor", "ADU builder", "commercial general contractor", "custom home builder", "home renovation contractor"],
    mistakes: [
      "Pitching homeowner lead gen to commercial GCs. Commercial general contractors win work through bids, architects and relationships, not Google searches.",
      "Ignoring the portfolio. For large projects, buyers judge GCs by finished work; project pages with photos and scope often beat ads as a first step.",
      "Expecting quick results. Additions, ADUs and custom homes have long sales cycles; set expectations in months, and measure consultations, not just calls.",
      "Missing niche services. ADUs, additions and design-build are searched separately; a page per service gives the pitch something concrete.",
    ],
    faqs: [
      {
        q: "Are general contractors good clients for agencies?",
        a: "Yes, especially residential and remodel-focused GCs. Their projects are large, so one extra signed job can cover months of fees, and many still depend on referrals with little search presence. Large commercial GCs win work through bids, so marketing moves them less.",
      },
      {
        q: "What do general contractors want from marketing?",
        a: "Qualified estimate requests for the projects they actually want, not traffic. Lead with a portfolio site, pages for their best-paying work and search ads on terms such as home additions, then report on estimates booked and quotes issued.",
      },
      {
        q: "How do I qualify a general contractor before pitching?",
        a: "Check whether they are residential, remodel, custom-home or commercial, how strong their reviews are, and whether their website shows real projects. The best prospects have strong reputations but weak visibility for high-ticket searches in their area.",
      },
      {
        q: "How long does it take to sell a GC on marketing?",
        a: "Usually a few weeks and two or three conversations, because owners want to see how marketing ties to signed projects. A short audit showing who outranks them for high-value searches speeds this up considerably.",
      },
      {
        q: "Can I find general contractors in specific states?",
        a: "Yes. Every US state has a general contractor page with its weather factors, growth signals and largest cities, and the app searches any city, county or radius with live data.",
      },
    ],
  },
  remodeling: {
    quickAnswer: {
      q: "How do agencies find remodeling contractor leads?",
      a: "Agencies find remodeling contractor leads by searching live Google data for kitchen, bath and whole-home remodelers by city or state, then targeting owner-run firms with strong reviews but few project photos, no room-specific pages and no search ads. Contractor Leads adds owner names, verified emails and AI scores so you can prioritise who to pitch.",
    },
    buys: [
      "Portfolio websites organised by room, with before-and-after photos",
      "Google Ads on kitchen and bathroom remodel searches",
      "Review generation after every finished project",
      "Email and retargeting nurture for homeowners who research for months",
    ],
    season: "Remodelers plan marketing in January and February, with a second window in late summer for projects homeowners want finished before the holidays.",
    searchTerms: ["kitchen remodeling", "bathroom remodeling", "basement finishing", "home remodeling contractor", "bathroom renovation", "kitchen renovation"],
    mistakes: [
      "Pitching without visuals. Remodeling is sold on before-and-after photos; a contractor with a thin gallery needs that fixed before ads will work.",
      "Ignoring Houzz and Google Business Profile photos. Homeowners browse photos on these profiles before they visit a website.",
      "Missing seasonality. Many homeowners plan interior projects after the holidays and outdoor work in spring; time the pitch before those windows.",
      "Selling cheap leads. Remodelers lose money on price shoppers; focus on qualified consultations and average project value.",
    ],
    faqs: [
      {
        q: "Why are remodelers good agency clients?",
        a: "Remodeling projects are large and visual, and homeowners research them online for weeks. Remodelers with great work but weak galleries or no ads lose those homeowners to competitors, which makes the value of better marketing easy to show.",
      },
      {
        q: "What should a remodeling marketing offer include?",
        a: "A portfolio site with pages for kitchens, bathrooms and basements, review generation, search ads on high-intent remodel terms, and a nurture sequence for homeowners who are not ready yet. Report on consultations booked and the value of quotes issued.",
      },
      {
        q: "Which remodeling companies should I contact first?",
        a: "Owner-run kitchen, bath and whole-home remodelers with strong reviews but thin galleries or no paid search. They have the margins to fund marketing and usually decide quickly once they see where they are losing projects.",
      },
      {
        q: "How do remodelers get leads today?",
        a: "Mostly referrals, repeat clients, showroom or supplier relationships and Google searches, plus some shared marketplace leads that many dislike because several contractors receive them. Offering exclusive leads from their own ads and search presence is a strong angle.",
      },
      {
        q: "Can I find remodelers in my state?",
        a: "Yes. Every US state has a remodeling page with its housing and weather factors and largest cities, and the app searches any city, county or radius with live Google data and owner enrichment.",
      },
    ],
  },
};

export function getTradeHubContent(slug: string): TradeHubContent | undefined {
  return TRADE_HUB_CONTENT[slug];
}
