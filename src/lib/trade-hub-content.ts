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
        q: "I run an HVAC lead generation company. How do I find HVAC contractors to sell to?",
        a: "Search a city or state for HVAC companies in Contractor Leads. You get every heating and air-conditioning business Google lists there, with the owner's name, a verified email, review count and scores for website, SEO and ads, so you can start with the companies that have good reviews but no ads or a weak site.",
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
  "home-improvement": {
    quickAnswer: {
      q: "How do agencies find home improvement company leads?",
      a: "Search live Google data for home improvement and handyman companies by city, then keep the ones that offer several services but show only one generic page, few recent reviews or no booking option. Contractor Leads adds owner names, verified emails and scores so you call the companies with the clearest gap first.",
    },
    buys: [
      "A website with a separate page for each service they offer (decks, bathrooms, repairs, painting)",
      "Google Business Profile management with service lists and project photos",
      "Review requests after every finished job",
      "Simple online booking or estimate requests for small jobs",
    ],
    season: "Home improvement companies get busier in spring and early summer, and many plan marketing in late winter. Repair and handyman work runs all year, so a booking or estimate offer can be pitched any month.",
    searchTerms: ["home improvement contractor", "handyman services", "home repair", "deck builder", "bathroom renovation", "home improvement company near me"],
    mistakes: [
      "Pitching one generic website. These companies sell many services; show which ones they could rank for with a page each.",
      "Ignoring small jobs. Repair and handyman requests keep crews busy between projects; a booking flow is often the easiest first sale.",
      "Treating them like a remodeler. Many are owner-operators with a small crew, so price and scope the offer for that.",
      "Skipping the reviews check. A company with few recent reviews loses to competitors with many; fix reviews before ads.",
    ],
    faqs: [
      {
        q: "What do home improvement companies spend marketing money on?",
        a: "Usually a website that lists every service, their Google Business Profile, reviews and, once those work, local search ads. Owner-operators want simple tools that bring in booked estimates without extra admin.",
      },
      {
        q: "How is a home improvement company different from a remodeler?",
        a: "Home improvement companies tend to take many smaller jobs across several services, while remodelers focus on larger kitchen, bath and whole-home projects. That changes the pitch: volume and booking for the first, portfolio and qualified consultations for the second.",
      },
      {
        q: "Which home improvement companies are the best prospects?",
        a: "Active companies with steady recent reviews and several services, but a thin website or no booking option. They already win work and can show quick results from better pages and reviews.",
      },
    ],
  },
  flooring: {
    quickAnswer: {
      q: "How do agencies find flooring company leads?",
      a: "Search live Google data for flooring installers and flooring stores by city, then separate install-only contractors from showrooms, because they buy different marketing. Keep companies with few photos, no product pages or weak reviews. Contractor Leads adds owner names, verified emails and an opportunity score to each.",
    },
    buys: [
      "Project photo galleries by floor type (hardwood, LVP, tile, carpet)",
      "Pages for each flooring type and service area",
      "Search ads for installation and refinishing searches",
      "Review generation after each installation",
    ],
    season: "Flooring demand follows home sales and renovation season, with many homeowners planning projects in late winter and spring and again before the holidays. Pitch a few weeks before those windows.",
    searchTerms: ["flooring installation", "hardwood floor refinishing", "LVP flooring installers", "tile installation", "carpet installation", "flooring stores near me"],
    mistakes: [
      "Treating installers and showrooms the same. A showroom wants store visits and product searches; an installer wants installation leads.",
      "No photos in the pitch. Flooring is sold visually; show how thin their gallery is next to a competitor's.",
      "Ignoring refinishing. Hardwood refinishing is a separate search with its own customers and often better margins.",
      "Pitching national keywords. Flooring buyers search locally; focus on city and service-area pages.",
    ],
    faqs: [
      {
        q: "What marketing do flooring companies buy?",
        a: "Mostly a website with galleries and pages per floor type, Google Business Profile work, reviews and local search ads. Showrooms also invest in product pages and promotions that drive store visits.",
      },
      {
        q: "Should agencies target flooring stores or flooring installers?",
        a: "Both can work, but the offer differs. Stores need foot traffic and product searches; install-only contractors need installation and refinishing leads in their service area. Decide which you serve before building the list.",
      },
      {
        q: "How can you tell a flooring company needs marketing help?",
        a: "Few or old project photos, no page for the floor types they install, a low review count compared with nearby competitors, or no click-to-call on mobile.",
      },
    ],
  },
  landscaping: {
    quickAnswer: {
      q: "How do agencies find landscaping company leads?",
      a: "Search live Google data for landscapers and lawn care companies by city, then split design-build landscapers from maintenance crews, because they sell different services. Many have no website or a thin one, which makes them easy to qualify. Contractor Leads adds owner names, verified emails and a website score.",
    },
    buys: [
      "A first website or a rebuild with a project gallery",
      "Pages for each service: design, hardscaping, lawn care, irrigation",
      "Recurring maintenance sign-ups and seasonal promotions",
      "Google Business Profile photos and review requests",
    ],
    season: "Landscapers plan and buy marketing in late winter, before the spring rush; once the season starts, owners are in the field. Maintenance companies also sell autumn clean-ups and winter services such as snow removal in colder areas.",
    searchTerms: ["landscaping company", "lawn care service", "landscape design", "hardscaping contractor", "sod installation", "landscapers near me"],
    mistakes: [
      "Pitching in May. Most landscapers are booked solid in spring; pitch in late winter or after the summer peak.",
      "One offer for every landscaper. Design-build firms want high-value projects; maintenance crews want recurring contracts.",
      "Skipping the website check. Many landscapers have no site at all, which is the simplest first sale.",
      "Ignoring seasonality in reporting. Leads drop in winter for most landscapers; agree what success looks like by season.",
    ],
    faqs: [
      {
        q: "Why are landscapers good clients for agencies?",
        a: "Many are owner-run with little online presence, so the gaps are obvious and fixable: a website, photos, reviews and service pages. Design-build projects are valuable enough to justify ongoing marketing.",
      },
      {
        q: "What is the best time to pitch a landscaping company?",
        a: "Late winter, before the spring rush, and late summer or autumn, when owners plan next year. In the middle of spring most owners are too busy to take a call.",
      },
      {
        q: "Should agencies target lawn care or design-build landscapers?",
        a: "Lawn care suits recurring-revenue offers and volume; design-build suits portfolio-led marketing and fewer, larger projects. Pick one first so the pitch and case studies match.",
      },
    ],
  },
  painting: {
    quickAnswer: {
      q: "How do agencies find painting company leads?",
      a: "Search live Google data for painting contractors by city, then separate residential repaint companies from commercial painters. Keep companies with few photos, few recent reviews or no estimate form. Contractor Leads adds owner names, verified emails and an opportunity score so you start with the clearest gaps.",
    },
    buys: [
      "Before-and-after galleries for interior and exterior work",
      "Separate pages for interior, exterior, cabinet and commercial painting",
      "Online estimate requests with photo upload",
      "Review requests and Local Services Ads where available",
    ],
    season: "Exterior painting is seasonal in most of the US, so painters plan marketing in late winter and early spring. Interior and cabinet work fills the colder months, which is a good time to pitch interior-focused campaigns.",
    searchTerms: ["house painters", "interior painting", "exterior painting", "cabinet painting", "commercial painting contractor", "painters near me"],
    mistakes: [
      "Leading with design. Painters buy estimates, not looks; show how many estimate requests a better page would bring.",
      "Missing cabinet painting. It is searched on its own and often has better margins than whole-house work.",
      "Same pitch for commercial painters. They win through bids and property managers, not homeowner searches.",
      "No before-and-after proof. Painting is sold on visible results; a thin gallery is the first thing to fix.",
    ],
    faqs: [
      {
        q: "What marketing do painting contractors buy?",
        a: "A website with galleries, pages for each painting service, Google Business Profile work, reviews and often Local Services Ads. Estimate request forms with photo upload help them quote faster.",
      },
      {
        q: "When do painting companies buy marketing?",
        a: "Before exterior season, usually late winter or early spring, and in autumn to fill interior work over winter.",
      },
      {
        q: "How do you pitch a painting company that already has a website?",
        a: "Show the gap: missing pages for interior, exterior or cabinet work, few photos, no estimate form or fewer reviews than the companies ranking above them in their city.",
      },
    ],
  },
  concrete: {
    quickAnswer: {
      q: "How do agencies find concrete contractor leads?",
      a: "Search live Google data for concrete contractors by city and separate residential flatwork (driveways, patios) from commercial and decorative concrete. Keep companies with no project photos, no service pages or few reviews. Contractor Leads adds owner names, verified emails and a website score.",
    },
    buys: [
      "A website with pages for driveways, patios, foundations and decorative concrete",
      "Project photo galleries and before-and-after images",
      "Search ads for driveway and patio searches in season",
      "Review requests after each pour",
    ],
    season: "Concrete work depends on weather, so most companies plan marketing in late winter and push hardest in spring and summer. In colder states work slows sharply in winter.",
    searchTerms: ["concrete contractor", "concrete driveway", "stamped concrete patio", "concrete repair", "foundation contractor", "concrete companies near me"],
    mistakes: [
      "Ignoring the weather. Pitch before the pouring season starts, not in the middle of it or in deep winter.",
      "One page for everything. Driveways, patios, foundations and decorative work are separate searches and buyers.",
      "Pitching commercial concrete like residential. Commercial work comes through bids and general contractors.",
      "No photos. Homeowners choose concrete contractors from finished work; a gallery is the first fix.",
    ],
    faqs: [
      {
        q: "What marketing do concrete contractors buy?",
        a: "Usually a website with a page per service, photo galleries, Google Business Profile work, reviews and seasonal search ads for driveways and patios.",
      },
      {
        q: "Are concrete contractors good clients for agencies?",
        a: "Residential concrete companies often have little online presence, so improvements are visible quickly. Jobs such as driveways and stamped patios are valuable enough to support ongoing marketing in season.",
      },
      {
        q: "When should you pitch a concrete company?",
        a: "Late winter or early spring, before the season, when owners are planning. In mid-summer most crews are booked and owners are hard to reach.",
      },
    ],
  },
  "windows-and-doors": {
    quickAnswer: {
      q: "How do agencies find window and door company leads?",
      a: "Search live Google data for window and door installers and replacement companies by city, then separate dealers of a single brand from independent installers. Keep companies with weak product pages, few reviews or no financing information. Contractor Leads adds owner names, verified emails and an opportunity score.",
    },
    buys: [
      "Pages for window replacement, door installation and each product line",
      "Financing and energy-efficiency information pages",
      "Search ads for replacement windows and doors",
      "Consultation booking and follow-up for long decisions",
    ],
    season: "Window and door replacement is often planned before winter and in spring. Homeowners take time to decide, so follow-up and consultation booking matter as much as the first lead.",
    searchTerms: ["window replacement", "replacement windows", "door installation", "entry doors", "sliding patio doors", "window installers near me"],
    mistakes: [
      "Ignoring the decision time. Replacement buyers compare quotes for weeks; pitch follow-up, not only more leads.",
      "Missing financing. Many buyers search for payment options; a financing page can lift enquiries.",
      "Treating brand dealers like independents. Dealers may have co-op marketing rules and brand assets to follow.",
      "One page for windows and doors. They are separate searches with separate buyers.",
    ],
    faqs: [
      {
        q: "What marketing do window and door companies buy?",
        a: "Pages per product and service, financing pages, search ads for replacement searches, consultation booking and follow-up for quotes that take weeks to close.",
      },
      {
        q: "Why do window replacement companies need follow-up?",
        a: "Replacement is a large, considered purchase, so homeowners collect several quotes. Fast follow-up and reminders win more of the quotes already given.",
      },
      {
        q: "How do you find window and door companies that need help?",
        a: "Look for thin product pages, no financing information, few reviews or no online consultation booking, compared with competitors in the same city.",
      },
    ],
  },
  fencing: {
    quickAnswer: {
      q: "How do agencies find fencing contractor leads?",
      a: "Search live Google data for fence companies by city and note which materials they install (wood, vinyl, chain link, aluminum) and whether they do residential or commercial work. Keep companies with one generic page, few photos or few reviews. Contractor Leads adds owner names, verified emails and a website score.",
    },
    buys: [
      "Pages for each fence type and service area",
      "Photo galleries by material and style",
      "Search ads for fence installation in season",
      "Online quote requests and review requests",
    ],
    season: "Fence installation peaks in spring and summer in most areas, so fence companies plan marketing in late winter. Storm damage and new home purchases create repair and new-fence demand at other times.",
    searchTerms: ["fence installation", "fence company", "vinyl fence installers", "wood fence contractors", "chain link fence", "fence repair"],
    mistakes: [
      "One page for every material. Vinyl, wood, chain link and aluminum fences are searched separately.",
      "Pitching mid-season. Crews are booked in late spring and summer; pitch in late winter.",
      "Ignoring repair work. Fence repair after storms is a separate, urgent search.",
      "Same pitch for commercial fencing. Commercial jobs come through bids and property managers.",
    ],
    faqs: [
      {
        q: "What marketing do fence companies buy?",
        a: "A website with pages for each fence type and area, photo galleries, quote request forms, reviews and seasonal search ads.",
      },
      {
        q: "When is the best time to pitch a fence company?",
        a: "Late winter, before installation season. After a major storm, repair-focused campaigns can also land.",
      },
      {
        q: "How do you qualify a fencing company as a prospect?",
        a: "Check whether they show the materials they install, have recent reviews, answer the phone and appear for fence searches in their own city. Gaps in any of these are your opening.",
      },
    ],
  },
  "garage-doors": {
    quickAnswer: {
      q: "How do agencies find garage door company leads?",
      a: "Search live Google data for garage door repair and installation companies by city. Repair calls are urgent, so check answer speed, click-to-call and reviews first, then whether they have pages for repair, springs, openers and new doors. Contractor Leads adds owner names, verified emails and an opportunity score.",
    },
    buys: [
      "Pages for repair, broken springs, openers and new door installation",
      "Local Services Ads and search ads for urgent repair searches",
      "Call tracking and answering for missed calls",
      "Review generation after every service call",
    ],
    season: "Garage door repair is year-round and urgent, with extra demand when temperatures change and springs fail. New door installation is more seasonal and often tied to home sales.",
    searchTerms: ["garage door repair", "garage door spring replacement", "garage door opener repair", "new garage door installation", "emergency garage door repair", "garage door company near me"],
    mistakes: [
      "Ignoring missed calls. Repair buyers call the next company if nobody answers; check answer speed before pitching ads.",
      "One page for all services. Springs, openers and new doors are separate searches.",
      "Underestimating competition. Repair searches often have many advertisers; show where the company can win, such as its own suburbs.",
      "Skipping reviews. Urgent buyers pick the company with the most recent good reviews.",
    ],
    faqs: [
      {
        q: "Why are garage door companies good clients for agencies?",
        a: "Repair demand is urgent and constant, so better visibility and call handling show results quickly. Many companies still have thin websites and miss calls.",
      },
      {
        q: "What do garage door companies buy from agencies?",
        a: "Local Services Ads and search ads for repair, pages per service, call tracking or answering, and review generation.",
      },
      {
        q: "How do you pitch a garage door repair company?",
        a: "Lead with the calls they lose: call them after hours, check whether they appear for spring and opener repair in their city, and show competitors with more reviews.",
      },
    ],
  },
  "pest-control": {
    quickAnswer: {
      q: "How do agencies find pest control company leads?",
      a: "Search live Google data for pest control companies and exterminators by city, then check which pests and services they cover and whether they sell recurring service plans. Keep independent operators with thin pages or few reviews. Contractor Leads adds owner names, verified emails and an opportunity score.",
    },
    buys: [
      "Pages for each pest (termites, rodents, bed bugs, mosquitoes) and service area",
      "Recurring service plan sign-ups",
      "Local Services Ads and search ads for urgent infestations",
      "Review generation after treatments",
    ],
    season: "Pest pressure rises in spring and summer for many pests, so pest control companies plan marketing in late winter. Recurring plans keep revenue steady all year, which makes plan sign-ups a strong year-round offer.",
    searchTerms: ["pest control service", "exterminator", "termite treatment", "rodent control", "bed bug treatment", "pest control near me"],
    mistakes: [
      "One page for every pest. Termites, rodents and bed bugs are separate searches with different buyers.",
      "Selling one-off jobs only. Recurring service plans are where pest control companies earn steady revenue.",
      "Pitching national chains. Independent operators are the realistic clients; chains run marketing centrally.",
      "Ignoring urgency. Infestation searches are urgent, so call answering and Local Services Ads matter.",
    ],
    faqs: [
      {
        q: "What marketing do pest control companies buy?",
        a: "Pages per pest and area, Local Services Ads and search ads for urgent problems, review generation and campaigns that turn one-off treatments into recurring service plans.",
      },
      {
        q: "Are pest control companies good clients for agencies?",
        a: "Independent operators often are: demand is steady, many searches are urgent, and recurring plans mean each new customer is worth more than one visit.",
      },
      {
        q: "When is the best time to pitch pest control?",
        a: "Late winter, before the spring rise in pest activity, and any time for recurring-plan campaigns.",
      },
    ],
  },
  "cleaning-services": {
    quickAnswer: {
      q: "How do agencies find cleaning company leads?",
      a: "Search live Google data for house cleaning, maid services and commercial cleaning companies by city, then split residential from commercial cleaners, because they buy different marketing. Keep companies with no booking option, few reviews or a thin site. Contractor Leads adds owner names, verified emails and a website score.",
    },
    buys: [
      "Online booking and instant quotes",
      "Pages for each service: regular cleaning, deep cleaning, move-out, commercial",
      "Recurring client sign-ups and referral offers",
      "Review requests after cleans",
    ],
    season: "Cleaning demand is steady all year, with peaks around spring cleaning, move-in and move-out periods and the holidays. Recurring clients are the core of the business, so retention offers work in any month.",
    searchTerms: ["house cleaning service", "maid service", "deep cleaning", "move out cleaning", "commercial cleaning company", "cleaning services near me"],
    mistakes: [
      "Same pitch for residential and commercial. Commercial cleaners win contracts through outreach and bids, not homeowner searches.",
      "No online booking. Residential cleaning buyers expect to book or get a price online.",
      "Focusing on one-off cleans. Recurring clients are where cleaning companies make money; pitch retention too.",
      "Ignoring move-out cleaning. It is a separate, urgent search tied to moving dates.",
    ],
    faqs: [
      {
        q: "What do cleaning companies buy from agencies?",
        a: "Online booking and quoting, pages for each cleaning service, review generation and campaigns that turn one-time cleans into recurring clients.",
      },
      {
        q: "Should agencies target residential or commercial cleaners?",
        a: "Residential cleaners suit booking, reviews and local search; commercial cleaners suit outbound and bid support. Pick one first so the offer fits.",
      },
      {
        q: "How do you find cleaning companies that need marketing?",
        a: "Look for no online booking, few recent reviews, no page per service, or no presence for cleaning searches in their own area.",
      },
    ],
  },
  "pool-services": {
    quickAnswer: {
      q: "How do agencies find pool service company leads?",
      a: "Search live Google data for pool cleaning, repair and pool builders by city, then separate weekly service companies from builders, because one sells recurring maintenance and the other sells large projects. Keep companies with thin pages or few reviews. Contractor Leads adds owner names, verified emails and an opportunity score.",
    },
    buys: [
      "Recurring weekly service sign-ups",
      "Pages for cleaning, repair, equipment and opening or closing",
      "Project galleries and consultation booking for pool builders",
      "Review requests after service",
    ],
    season: "In seasonal climates pool companies plan marketing before spring openings; in warmer states service runs most of the year. Builders sell projects months ahead, so their marketing starts well before summer.",
    searchTerms: ["pool cleaning service", "pool repair", "pool builders", "pool opening and closing", "pool equipment repair", "pool service near me"],
    mistakes: [
      "Same pitch for builders and service companies. Builders need portfolio and consultations; service companies need recurring sign-ups.",
      "Ignoring climate. Pool season length changes by state, and so does the right time to pitch.",
      "One page for all services. Cleaning, repair and opening or closing are separate searches.",
      "No proof. Builders are chosen from finished pools; a weak gallery is the first fix.",
    ],
    faqs: [
      {
        q: "What marketing do pool service companies buy?",
        a: "Recurring service sign-ups, pages per service, reviews and seasonal campaigns. Pool builders also buy galleries, consultation booking and ads for new pool searches.",
      },
      {
        q: "When should you pitch a pool company?",
        a: "Before the season: late winter in colder states, and any time in warmer states where service runs most of the year. Builders should be pitched months before summer.",
      },
      {
        q: "Are pool builders and pool service companies the same prospect?",
        a: "No. Builders sell large, infrequent projects and need portfolio-led marketing; service companies sell recurring maintenance and need sign-ups and retention.",
      },
    ],
  },
};

export function getTradeHubContent(slug: string): TradeHubContent | undefined {
  return TRADE_HUB_CONTENT[slug];
}
