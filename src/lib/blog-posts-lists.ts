import type { BlogPost } from "@/lib/blog-content";

const AUTHOR = {
  name: "Vaishali Kapoor",
  role: "Founder, Contractor Leads",
  bio: "Vaishali leads product and growth at Contractor Leads, helping marketing agencies prospect, score, and close high-ticket home-service contractors.",
  image: "/marketing/founder-portrait.jpg",
};

const PUBLISHED = "2026-11-06";
const NOT_MEASURED = "not measured (no keyword data on 2026-11-06)";

/**
 * Seventh wave (6 November): guides that support the new /email-lists pages, chosen from
 * competitor gaps: owner research through contractor license records, buying vs building
 * a contractor list, and CAN-SPAM rules for contractor outreach.
 */
export const LIST_POSTS: BlogPost[] = [
  // 1. Contractor license lookup for owner research
  {
    slug: "contractor-license-lookup-owner-name",
    type: "cluster",
    title: "Contractor License Lookup: How to Find the Owner of a Contracting Business",
    titleTag: "Contractor License Lookup: Find the Business Owner",
    metaDescription:
      "Use state contractor license lookups, business filings and websites to find who owns a contracting business. A state-by-state guide.",
    primaryKeyword: "contractor license lookup",
    secondaryKeywords: [
      "find owner of contracting business",
      "contractor license search by name",
      "who owns a contracting company",
      "state contractor license board lookup",
      "contractor owner name",
    ],
    searchVolume: NOT_MEASURED,
    growth: "steady",
    cluster: "tools",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 9,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "electrical", "general-contractors"],
    sources: [
      { label: "California CSLB: Check a license", url: "https://www.cslb.ca.gov/onlineservices/checklicenseII/checklicense.aspx" },
      { label: "California CSLB: Public data portal", url: "https://www.cslb.ca.gov/onlineservices/dataportal/" },
      { label: "FTC: CAN-SPAM Act, a compliance guide for business", url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business" },
    ],
    directAnswer:
      "To find the owner of a contracting business, search the company in your state's contractor license lookup: most records show the license holder or qualifying individual, who is often the owner in small firms. Confirm the name against the state business registry, the company website's About page and its Google Business Profile replies. Not every trade is licensed in every state, so combine sources, and verify the email before you send anything.",
    summary:
      "Where contractor license records live in 10 large states, what they show, and a five-source workflow for confirming the owner of a contracting business.",
    faqs: [
      {
        q: "Does a contractor license show the owner's name?",
        a: "Often, but not always. Many state records show the license holder or the qualifying individual (the person whose experience and exam qualify the company). In small firms that is usually the owner; in larger companies it may be a manager. Check it against the state business registry before you rely on it.",
      },
      {
        q: "Can I search a contractor license by the owner's name?",
        a: "Some states let you search by a person's name as well as by business name or license number, while others only search by business name or number. Start with the business name, open the record, and note the people listed on it.",
      },
      {
        q: "What if the trade is not licensed in that state?",
        a: "Some trades are licensed only at the city or county level, or not at all; Texas, for example, has no statewide general contractor or roofing license. Use the secretary of state business filing, the company website and its Google profile instead, and look for a city license where one exists.",
      },
      {
        q: "Is it legal to use license records for sales outreach?",
        a: "License records are public, and business-to-business email is allowed in the US under CAN-SPAM when you follow its rules. Some states restrict commercial use of certain public records or contact details, so read the terms on each lookup site and take legal advice for large campaigns.",
      },
      {
        q: "How do I get the owner's email once I have the name?",
        a: "Check the company website and Google profile first, then use an email finder that verifies addresses before you send. Contractor Leads does this for contractors found on Google, labelling each email safe, catch-all, role-based or invalid so you avoid bounces.",
      },
    ],
    sections: [
      {
        heading: "Why license records are the best owner source for contractors",
        body: "Most contractors are small, owner-run businesses with little presence on LinkedIn or in B2B databases. The state license record is different: it exists because the company needs it to work, and it names the person who holds or qualifies the license. For prospecting, that is usually the decision-maker you want, and it is a far better starting point than a generic info@ inbox.",
      },
      {
        heading: "Where to look in 10 large states",
        body: "Each state runs its own lookup, and some trades are licensed by separate boards. Search by business name or license number first, then open the record to see the people listed.",
        table: {
          headers: ["State", "Licensing body", "Notes for owner research"],
          rows: [
            ["California", "Contractors State License Board (CSLB)", "Covers most trades by classification; records list personnel tied to the license"],
            ["Florida", "Department of Business and Professional Regulation (DBPR)", "Construction Industry Licensing Board covers GCs, roofing, HVAC and more"],
            ["Texas", "TDLR for electricians and A/C contractors; State Board of Plumbing Examiners for plumbers", "No statewide general contractor or roofing license; check city permits"],
            ["Arizona", "Registrar of Contractors (ROC)", "Records name the qualifying party for each license"],
            ["Nevada", "State Contractors Board (NSCB)", "Licenses most construction trades statewide"],
            ["North Carolina", "Licensing Board for General Contractors", "Electrical, plumbing and HVAC have their own boards"],
            ["Washington", "Department of Labor & Industries (L&I)", "Contractor registration lists the business owners or principals"],
            ["Oregon", "Construction Contractors Board (CCB)", "Registration required for most residential and commercial work"],
            ["Georgia", "Licensing Board for Residential and General Contractors", "Trade licenses such as electrical and plumbing are separate"],
            ["Utah", "Division of Professional Licensing (DOPL)", "Covers contractors and many trades in one search"],
          ],
        },
        callout: {
          title: "Check the date",
          text: "License records are updated when the company renews or changes its qualifier, so a record can lag behind a sale or a change of ownership. Use it with at least one other source.",
        },
      },
      {
        heading: "A five-source workflow to confirm the owner",
        body: "No single source is complete, but two that agree are usually enough. Work through them in this order and stop when two match.",
        bullets: [
          "State license record: the license holder or qualifier, as above",
          "Secretary of state business filing: officers, members or managers listed on the company's annual report",
          "Company website: the About page, team page and footer often name the owner",
          "Google Business Profile: owners often sign their replies to reviews",
          "Reviews and local press: customers mention the owner by name more often than you might expect",
        ],
      },
      {
        heading: "When the owner is not on the license",
        body: "In larger contracting companies the qualifier may be a licensed manager rather than the owner. In that case the business filing usually names the real principals. In family businesses, two or more family members may appear; address the person named on the website or in review replies, since they are most likely to read email. Our guide to [finding a business owner's name](/blog/how-to-find-business-owner-name) covers more general techniques.",
      },
      {
        heading: "Doing it at scale",
        body: "Checking license records by hand works for a short list of high-value prospects. For hundreds of contractors, start from live business data instead: Contractor Leads pulls the contractors listed on Google in your area, finds owner names from their websites and public sources where they can be confirmed, and verifies each email. You can then spot-check the most valuable prospects against the license record. See the [contractor email finder](/contractor-email-finder) or build a list by trade on the [contractor email lists](/email-lists) page.",
      },
      {
        heading: "Use what you find responsibly",
        body: "Public records are public, but how you contact people is regulated. In the US, CAN-SPAM covers business email and the TCPA covers calls and texts to mobile numbers. Keep your outreach relevant and easy to opt out of; our [CAN-SPAM guide for contractor outreach](/blog/can-spam-cold-email-contractors) has a checklist.",
      },
    ],
  },

  // 2. Buy vs build a contractor email list
  {
    slug: "buy-vs-build-contractor-email-list",
    type: "cluster",
    title: "Buy or Build a Contractor Email List? Cost, Quality and Risk Compared",
    titleTag: "Buy vs Build a Contractor Email List (2026)",
    metaDescription:
      "Should you buy a contractor email list or build one? Compare freshness, owner names, bounce risk, cost and compliance, plus a vendor checklist.",
    primaryKeyword: "buy contractor email list",
    secondaryKeywords: [
      "contractor email list",
      "buy email list for contractors",
      "construction email list",
      "are bought email lists worth it",
      "build b2b email list",
    ],
    searchVolume: NOT_MEASURED,
    growth: "steady",
    cluster: "tools",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: ["roofing", "hvac", "plumbing", "solar"],
    sources: [
      { label: "Google: Email sender guidelines (Gmail Help)", url: "https://support.google.com/mail/answer/81126" },
      { label: "Google: Email sender guidelines FAQ", url: "https://support.google.com/mail/answer/14229414" },
      { label: "FTC: CAN-SPAM Act, a compliance guide for business", url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business" },
    ],
    directAnswer:
      "Buying a contractor email list is quick, but the data is a snapshot that starts ageing the day it is compiled, owner names are often missing, and old addresses raise your bounce rate. Building a list from live data for your exact trade and area costs a little more effort but gives fresher contacts, owner names and verified emails. Buy only for one-off, broad uses such as market sizing or direct mail; build for cold email.",
    summary:
      "A side-by-side comparison of bought and built contractor email lists, the hidden costs of stale data, and a checklist for judging any list vendor.",
    faqs: [
      {
        q: "Is it legal to buy a contractor email list?",
        a: "Buying business contact data is legal in the US, and CAN-SPAM allows business cold email if you follow its rules. The risk is practical: stale lists bounce, and some email providers forbid sending to purchased lists in their terms. In the EU, UK and Canada, consent rules are stricter.",
      },
      {
        q: "Why do bought email lists bounce so much?",
        a: "Business contact data decays constantly as people change jobs, companies close and domains change. A list compiled months ago will contain addresses that no longer exist, and each bounce tells mailbox providers your sending is careless, which pushes later emails toward spam.",
      },
      {
        q: "How much does it cost to build a contractor email list?",
        a: "With Contractor Leads your first 10 leads are free, and paid plans start at $19.99 a month for 500 credits, where one credit is one lead. Larger plans bring the cost down to about 2 cents per lead, and email verification is included.",
      },
      {
        q: "When does buying a list make sense?",
        a: "When you need broad coverage quickly and will not cold email it: estimating market size, planning territories, or a direct-mail campaign where addresses change less often than email. Even then, check how recently the data was compiled and verified.",
      },
      {
        q: "Can I clean a list I already bought?",
        a: "Yes. Run it through an email verifier before sending and remove invalid addresses. Contractor Leads can also enrich an existing list through the bulk email finder, adding owner names and re-checking emails for the businesses it can match.",
      },
    ],
    sections: [
      {
        heading: "The short answer",
        body: "If you are going to cold email contractors, build the list. If you need a rough count of contractors in a region or a direct-mail file, a bought list can be fine. The difference comes down to how fast contractor data changes and how hard mailbox providers punish bounces.",
      },
      {
        heading: "Bought vs built, side by side",
        body: "Here is how the two approaches compare on the things that decide whether a campaign works.",
        table: {
          headers: ["", "Bought list", "Built from live data"],
          rows: [
            ["Freshness", "A snapshot from when it was compiled", "Pulled when you search"],
            ["Targeting", "Seller's categories and regions", "Your exact trade, city, county or radius"],
            ["Owner names", "Often missing or generic", "Added where they can be confirmed"],
            ["Email verification", "Varies; often not re-checked", "Checked before export"],
            ["Bounce risk", "Higher, rises as the list ages", "Lower when you send to verified emails"],
            ["Speed to first send", "Immediate", "Minutes per city-sized list"],
            ["Exclusivity", "Sold to many buyers", "Built for you"],
          ],
        },
      },
      {
        heading: "The hidden cost of a stale list",
        body: "A cheap list is expensive if it damages your sender reputation. Mailbox providers watch bounce and spam-complaint rates; Google's bulk-sender rules, for example, ask senders to keep reported spam below 0.3%. A burst of bounces from old addresses can push a new domain into spam folders for weeks, which costs far more in lost replies than the list saved. Our [email warmup guide](/blog/email-warmup-for-cold-email) explains how to protect a mailbox.",
        callout: {
          title: "Rule of thumb",
          text: "If a list cannot tell you when each email was last verified, treat every address as unverified and check it before you send.",
        },
      },
      {
        heading: "Contractors are a special case",
        body: "Contractor data goes stale faster than most B2B data. Many contractors are small, owner-run firms that open, close, rebrand or change hands often, and many use Gmail or Outlook addresses instead of a company domain, which general B2B databases cover poorly. Starting from the businesses currently listed on Google avoids most of these gaps.",
      },
      {
        heading: "Checklist for any list vendor",
        body: "If you do buy, ask these questions first.",
        bullets: [
          "When was each record compiled, and when was each email last verified?",
          "What share of records include a named owner or decision-maker?",
          "Where does the data come from, and can you see a free sample from your target area?",
          "Is the list sold to other buyers, and how many?",
          "What happens to bounced records: refunds, credits or nothing?",
          "Does the vendor's data sourcing comply with the laws of the markets you will email?",
        ],
      },
      {
        heading: "How to build one in Contractor Leads",
        body: "Pick a trade and an area, filter by rating and AI scores, run owner enrichment and export only safe emails. Each trade has its own page with segments and state links: start with the [contractor email lists](/email-lists) hub, or go straight to the [roofing](/email-lists/roofing), [HVAC](/email-lists/hvac) or [plumbing](/email-lists/plumbing) lists.",
      },
    ],
  },

  // 3. CAN-SPAM for contractor outreach
  {
    slug: "can-spam-cold-email-contractors",
    type: "cluster",
    title: "CAN-SPAM and Cold Email to Contractors: A 2026 Compliance Checklist",
    titleTag: "CAN-SPAM Cold Email Checklist for Contractor Outreach",
    metaDescription:
      "What CAN-SPAM requires when you cold email contractors: sender details, subject lines, postal address, opt-outs, penalties and a checklist.",
    primaryKeyword: "can-spam cold email",
    secondaryKeywords: [
      "is cold email legal",
      "can-spam requirements b2b",
      "cold email compliance",
      "can-spam opt out 10 days",
      "cold email to contractors legal",
    ],
    searchVolume: NOT_MEASURED,
    growth: "steady",
    cluster: "agency-growth",
    publishedDate: PUBLISHED,
    updatedDate: PUBLISHED,
    readingMinutes: 8,
    author: AUTHOR,
    relatedIndustries: [],
    sources: [
      { label: "FTC: CAN-SPAM Act, a compliance guide for business", url: "https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business" },
      { label: "Google: Email sender guidelines (Gmail Help)", url: "https://support.google.com/mail/answer/81126" },
      { label: "Google: Email sender guidelines FAQ", url: "https://support.google.com/mail/answer/14229414" },
    ],
    directAnswer:
      "Cold email to contractors is legal in the US under the CAN-SPAM Act, which has no business-to-business exemption but does not require prior consent. Every email must use accurate sender and header information, an honest subject line, a disclosure that it is commercial, a valid postal address and a clear way to opt out, and you must honour opt-outs within 10 business days. Canada, the UK and the EU have stricter consent rules.",
    summary:
      "The CAN-SPAM requirements that apply to every cold email you send to contractors, how penalties work, the mailbox-provider rules that matter just as much, and a checklist.",
    faqs: [
      {
        q: "Does CAN-SPAM apply to B2B cold email?",
        a: "Yes. The FTC is explicit that the law makes no exception for business-to-business email: it covers any email whose main purpose is to advertise or promote a commercial product or service, including cold outreach to contractors.",
      },
      {
        q: "Do I need permission to cold email a contractor?",
        a: "Not under CAN-SPAM, which is an opt-out law: you may send the first email without consent as long as you follow its rules and stop when someone opts out. Canada's CASL, the UK's PECR and the EU's GDPR set stricter conditions, so check the rules for each country you email.",
      },
      {
        q: "How fast must I honour an unsubscribe?",
        a: "Within 10 business days. Your opt-out method must keep working for at least 30 days after you send, you cannot charge a fee or ask for more than an email address and simple choices, and you cannot sell or transfer the address once someone has opted out.",
      },
      {
        q: "What are the penalties for breaking CAN-SPAM?",
        a: "Each email that breaks the law can bring a penalty of more than $50,000, a figure the FTC adjusts for inflation each year, and more than one party can be responsible: both the company whose product is promoted and the company that sends the email can be held liable.",
      },
      {
        q: "Is a P.O. box enough as my postal address?",
        a: "Yes. The FTC accepts your current street address, a post office box registered with the US Postal Service, or a private mailbox registered with a commercial mail receiving agency under Postal Service rules.",
      },
    ],
    sections: [
      {
        heading: "Who this applies to",
        body: "If you email contractors to sell marketing, software, supplies, financing or anything else, your emails are commercial messages under CAN-SPAM. It does not matter that the recipient is a business, that you found the address publicly, or that you send one email at a time. The rules apply to each message.",
      },
      {
        heading: "The seven CAN-SPAM requirements",
        body: "The FTC's compliance guide sets out these rules for commercial email.",
        bullets: [
          "Do not use false or misleading header information: the From name, reply-to and routing must identify you accurately",
          "Do not use deceptive subject lines: the subject must reflect what the email is about",
          "Identify the message as an advertisement, clearly and conspicuously (unless the recipient has given prior consent)",
          "Tell recipients where you are located: include a valid physical postal address",
          "Tell recipients how to opt out of future email, in a way that is easy to spot and use",
          "Honour opt-out requests promptly: within 10 business days, with no fee and no extra hoops",
          "Monitor what others do on your behalf: you remain responsible if an agency or tool sends for you",
        ],
      },
      {
        heading: "Rules from mailbox providers matter just as much",
        body: "CAN-SPAM sets the legal floor; Gmail, Yahoo and Microsoft decide whether you reach the inbox. Google's sender guidelines ask all senders to authenticate with SPF or DKIM, ask bulk senders to add DMARC and one-click unsubscribe, and set a spam-complaint threshold of 0.3%. Small, relevant sends to verified addresses from a warmed-up mailbox are the safest pattern.",
        table: {
          headers: ["Rule", "Who sets it", "What to do"],
          rows: [
            ["Postal address and opt-out", "CAN-SPAM (law)", "Add both to every email template"],
            ["Opt-outs within 10 business days", "CAN-SPAM (law)", "Suppress opt-outs automatically, across all mailboxes"],
            ["SPF, DKIM and DMARC", "Mailbox providers", "Set up DNS records before sending"],
            ["Spam complaints below 0.3%", "Google sender guidelines", "Send relevant emails in small batches"],
            ["Low bounce rate", "Mailbox providers", "Send only to verified emails"],
          ],
        },
      },
      {
        heading: "A compliant cold email footer",
        body: "A short footer covers the address and opt-out rules without hurting the tone of a personal email. For example: \"Contractor Growth Co, 123 Main St, Suite 4, Austin, TX 78701. Not interested? Reply 'no thanks' or click here and we will not email you again.\" Make sure every reply that asks to stop is treated as an opt-out, even without the exact words.",
        callout: {
          title: "Opt-outs follow the person, not the campaign",
          text: "If a contractor unsubscribes from one campaign, suppress them across all campaigns and mailboxes you send from, including ones run by your agency or tools.",
        },
      },
      {
        heading: "Calls and texts are different",
        body: "CAN-SPAM covers email. Calling or texting mobile numbers falls under the Telephone Consumer Protection Act (TCPA) and state rules, which are stricter about automated calls and texts. If your list includes owner mobile numbers, check those rules before dialling or texting; our [SMS marketing for contractors](/sms-marketing-for-contractors) page explains the basics.",
      },
      {
        heading: "Checklist before every campaign",
        body: "Run through this list before you press send.",
        bullets: [
          "From name and address identify a real person or company",
          "Subject line describes the email honestly",
          "Postal address in the footer",
          "Clear opt-out link or instruction, working for at least 30 days",
          "Opt-out list synced across every mailbox and tool",
          "Only verified emails in the list (see [contractor email lists](/email-lists))",
          "SPF, DKIM and DMARC records in place for the sending domain",
          "Recipients outside the US checked against CASL, PECR or GDPR",
        ],
      },
      {
        heading: "This is not legal advice",
        body: "This guide summarises the FTC's CAN-SPAM compliance guide and mailbox-provider sender guidelines as of November 2026. Rules and penalty amounts change, so check the FTC's current guidance and take legal advice before large campaigns, especially outside the US.",
      },
    ],
  },
];
