/**
 * Commercial landing pages from the SEO page plan (week 2).
 *
 * Standard for every page: one primary keyword in the title (< 60 chars), H1, first
 * paragraph and meta description (< 155 chars); a 40-60 word quick answer; detailed,
 * page-specific sections; 5-6 FAQs of 40-70 words; at least 3 related links.
 *
 * Pages whose searchers are contractors looking for homeowner jobs are written as honest,
 * neutral guides: Contractor Leads finds contractors for agencies and does not sell
 * homeowner leads, and the pages say so.
 */

import { EMAIL_LIST_PAGES } from "@/lib/email-list-pages";

export type LandingSection = {
  heading: string;
  body: string;
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  callout?: { title: string; text: string };
};

export type LandingPage = {
  slug: string;
  /** "product": describes what Contractor Leads does (Service schema). "guide": neutral guide. */
  kind: "product" | "guide";
  primaryKeyword: string;
  secondaryKeywords: string[];
  titleTag: string;
  metaDescription: string;
  breadcrumb: string;
  eyebrow: string;
  h1: string;
  heroDescription: string;
  quickAnswer: { q: string; a: string };
  /** First paragraph; must contain the primary keyword. [label](/path) links allowed. */
  intro: string;
  /** Optional note about who the page is for (and what Contractor Leads does not sell). */
  audienceNote?: string;
  sections: LandingSection[];
  faqs: Array<{ q: string; a: string }>;
  related: Array<{ href: string; label: string }>;
  cta: { href: string; label: string };
  ctaBand: { title: string; description: string };
  serviceType?: string;
  /** Parent page for nested pages (breadcrumb), e.g. /email-lists for /email-lists/roofing. */
  parent?: { name: string; path: string };
};

const AGENCY_NOTE =
  "Who this page is for: contractors researching where leads come from. Contractor Leads does not sell homeowner leads. It helps marketing agencies and sales teams find contractors to work with; if that is you, see [contractor lead generation software](/contractor-lead-generation-software).";

export const LANDING_PAGES: LandingPage[] = [
  // 1. Exclusive contractor leads (contractor-intent guide)
  {
    slug: "exclusive-contractor-leads",
    kind: "guide",
    primaryKeyword: "exclusive contractor leads",
    secondaryKeywords: ["exclusive leads for contractors", "exclusive vs shared leads", "exclusive roofing leads", "exclusive home improvement leads"],
    titleTag: "Exclusive Contractor Leads: Cost and How They Work",
    metaDescription: "Exclusive contractor leads explained: how they differ from shared leads, what they cost, where to get them and the questions to ask any lead vendor.",
    breadcrumb: "Exclusive contractor leads",
    eyebrow: "Contractor guide",
    h1: "Exclusive contractor leads: what they are and how to get them",
    heroDescription: "How exclusive leads differ from shared ones, what they really cost, and how to get more of them without overpaying.",
    quickAnswer: {
      q: "What are exclusive contractor leads?",
      a: "Exclusive contractor leads are homeowner enquiries sent to only one contractor, unlike shared leads that several companies receive at once. They cost more per lead but usually close at a higher rate because you are not racing competitors. The most reliable exclusive leads come from your own ads, Local Services Ads, SEO and referrals.",
    },
    intro: "Exclusive contractor leads are the opposite of the shared leads sold by many marketplaces: one homeowner, one contractor, no race to call first. This guide explains how exclusive leads work, what they cost compared with shared leads, where they come from and how to judge any vendor that promises them.",
    audienceNote: AGENCY_NOTE,
    sections: [
      {
        heading: "Exclusive vs shared leads",
        body: "The difference is not the homeowner; it is how many contractors get the same enquiry. That changes your close rate, how fast you must respond, and what each lead is worth.",
        table: {
          headers: ["", "Exclusive leads", "Shared leads"],
          rows: [
            ["Who receives it", "One contractor", "Often three or more contractors"],
            ["Typical price per lead", "Higher", "Lower"],
            ["Speed pressure", "Moderate: still respond fast", "Extreme: first caller usually wins"],
            ["Close rate", "Usually higher", "Usually lower"],
            ["Price competition", "Less", "More, homeowners compare quotes"],
          ],
        },
      },
      {
        heading: "What exclusive leads cost",
        body: "Prices vary by trade, market and source. As a rough guide, exclusive leads cost several times more than shared leads, and high-ticket trades such as roofing, solar and remodeling sit at the top of the range. Compare the real cost per signed job, not per lead: a $120 exclusive lead that closes one time in four costs less per job than a $40 shared lead that closes one time in fifteen. Our [contractor lead cost benchmarks](/blog/how-much-do-contractor-leads-cost) break this down by trade.",
      },
      {
        heading: "Where exclusive leads come from",
        body: "The most dependable exclusive leads are the ones you generate yourself, because nobody else receives them.",
        bullets: [
          "Your own Google Ads and Meta ads, sent to a landing page with a clear offer",
          "[Local Services Ads](/blog/local-service-ads), where you pay per lead and the homeowner contacts you directly",
          "SEO and a strong Google Business Profile, which bring enquiries at no cost per lead",
          "Referrals, past customers and partners such as realtors and suppliers",
          "Lead vendors that guarantee exclusivity in writing (verify before you buy)",
        ],
      },
      {
        heading: "Questions to ask any exclusive lead vendor",
        body: "Some vendors call leads exclusive when they are only exclusive for a few hours, or exclusive within a narrow category. Ask these questions before you sign anything.",
        bullets: [
          "Is the lead sent to anyone else, ever, and is that in the contract?",
          "How are leads generated: ads, forms, call centres or purchased lists?",
          "What is the refund or credit policy for bad numbers and out-of-area leads?",
          "Is there a minimum spend or long contract?",
          "Can I see a sample of recent leads for my trade and area?",
        ],
      },
      {
        heading: "Make exclusive leads pay off",
        body: "Exclusive leads still go cold if nobody calls. Respond within minutes, follow up several times, and track which sources produce signed jobs. A simple [lead tracking](/contractor-lead-tracking) setup and a consistent [lead management](/contractor-lead-management) process usually raise close rates more than switching vendors.",
        callout: {
          title: "Rule of thumb",
          text: "Judge every lead source by cost per signed job and average job value, not by cost per lead.",
        },
      },
    ],
    faqs: [
      {
        q: "Are exclusive contractor leads worth the higher price?",
        a: "Often, yes. Because no other contractor receives the same enquiry, close rates are usually higher and you face less price competition. Whether they are worth it depends on your close rate and job value, so compare the cost per signed job of exclusive and shared sources over a few months.",
      },
      {
        q: "How much do exclusive contractor leads cost?",
        a: "It depends on the trade, the market and the source. Exclusive leads generally cost several times more than shared leads, with roofing, solar and remodeling at the higher end. Leads from your own ads, Local Services Ads and SEO are exclusive by nature and often cheaper per signed job than bought leads.",
      },
      {
        q: "What is the difference between exclusive and shared leads?",
        a: "An exclusive lead goes to one contractor only. A shared lead is sold to several contractors at the same time, so the homeowner gets multiple calls and usually picks the fastest or cheapest. Shared leads are cheaper per lead but typically close at lower rates.",
      },
      {
        q: "How can contractors get exclusive leads without buying them?",
        a: "Run your own Google and Meta ads to a focused landing page, manage Local Services Ads, invest in SEO and your Google Business Profile, and ask every happy customer for referrals and reviews. These channels produce enquiries that no competitor receives.",
      },
      {
        q: "Does Contractor Leads sell exclusive homeowner leads?",
        a: "No. Contractor Leads helps marketing agencies and sales teams find contractors to work with, using live Google data, owner names and AI scores. If you are a contractor, the channels in this guide are the most reliable route to exclusive homeowner leads.",
      },
    ],
    related: [
      { href: "/homeowner-leads", label: "Where contractors get homeowner leads" },
      { href: "/blog/pay-per-lead-for-contractors", label: "Pay per lead for contractors" },
      { href: "/blog/how-much-do-contractor-leads-cost", label: "Contractor lead cost benchmarks" },
      { href: "/contractor-lead-tracking", label: "Lead tracking for contractors" },
      { href: "/storm-damage-leads", label: "Storm damage leads for roofers" },
      { href: "/new-construction-leads", label: "New construction leads" },
    ],
    cta: { href: "/blog/how-to-get-contractor-leads", label: "Read: how to get contractor leads" },
    ctaBand: {
      title: "Run an agency that serves contractors?",
      description: "Find contractors with strong reviews and weak marketing, with owner names and AI scores. Start with 10 free leads.",
    },
  },

  // 2. Lead tracking
  {
    slug: "contractor-lead-tracking",
    kind: "guide",
    primaryKeyword: "lead tracking for contractors",
    secondaryKeywords: ["contractor lead tracking", "contractor lead tracking software", "track leads for contractors", "lead source tracking"],
    titleTag: "Lead Tracking for Contractors: What to Track and How",
    metaDescription: "Lead tracking for contractors: the numbers to track, how to set up call and form tracking, and how to see which sources turn into signed jobs.",
    breadcrumb: "Contractor lead tracking",
    eyebrow: "Contractor guide",
    h1: "Lead tracking for contractors: what to track and how",
    heroDescription: "Know which marketing turns into signed jobs, so you spend more on what works and stop paying for what does not.",
    quickAnswer: {
      q: "What is lead tracking for contractors?",
      a: "Lead tracking for contractors means recording every enquiry with its source, response time, status and final job value, so you can see which marketing produces signed work. The basics are call tracking numbers, tagged web forms and a CRM or shared sheet that every person updates the same way.",
    },
    intro: "Lead tracking for contractors answers one question: which of your marketing turns into signed jobs? Without it, every source looks equally good, so budgets go to whoever shouts loudest. This guide covers what to track, how to capture it from calls and forms, and the reports that actually change decisions.",
    sections: [
      {
        heading: "The numbers worth tracking",
        body: "Track a small set of fields consistently rather than many fields badly. These eight cover almost every decision a contractor needs to make.",
        table: {
          headers: ["Field", "Why it matters"],
          rows: [
            ["Lead source", "Shows which channel produced the enquiry"],
            ["Date and time", "Reveals seasonal patterns and busy hours"],
            ["Response time", "Faster responses close more jobs"],
            ["Job type", "Separates repairs from high-ticket work"],
            ["Status", "New, contacted, estimate booked, quoted, won, lost"],
            ["Quote value", "Measures pipeline, not just lead count"],
            ["Won value", "Revenue each source actually produced"],
            ["Lost reason", "Price, timing, no response or went elsewhere"],
          ],
        },
      },
      {
        heading: "How to capture leads automatically",
        body: "Most contractor leads arrive by phone, so call tracking matters most. Give each channel its own tracking number, tag every web form with its source, and record missed calls so nobody falls through the cracks.",
        bullets: [
          "Call tracking: a separate number per channel (Google Ads, Local Services Ads, your website, print)",
          "Form tracking: hidden fields that save the page and campaign each form came from",
          "Missed-call alerts and text-back so unanswered calls still get a reply",
          "One place to log everything, such as a [contractor CRM](/contractor-crm) or a shared sheet",
        ],
      },
      {
        heading: "Reports that change decisions",
        body: "Review three numbers per source each month: cost per lead, close rate and revenue per lead. A source with expensive leads can still be your best if it closes well and brings bigger jobs. Pair tracking with a clear [lead management](/contractor-lead-management) process so every lead gets the same follow-up.",
        table: {
          headers: ["Report", "Question it answers"],
          rows: [
            ["Revenue by source", "Where should next month's budget go?"],
            ["Response time vs close rate", "How much do slow responses cost us?"],
            ["Lost reasons", "Is it price, timing or follow-up?"],
            ["Pipeline by stage", "How much work is coming in the next 60 days?"],
          ],
        },
      },
      {
        heading: "For agencies: tracking your own prospecting",
        body: "Agencies that sell marketing to contractors need the same discipline for their own sales. Contractor Leads includes a pipeline CRM that tracks each contractor prospect from first email to closed client, alongside [campaign](/blog/cold-email-for-agencies) results.",
      },
    ],
    faqs: [
      {
        q: "What is the most important thing for a contractor to track?",
        a: "Lead source tied to revenue. Knowing that a channel produced leads is not enough; you need to know how many of those leads became signed jobs and what they were worth. That single view shows where to put the next dollar of marketing.",
      },
      {
        q: "Do contractors need special software to track leads?",
        a: "Not at first. A shared spreadsheet with consistent columns works for small teams. As volume grows, a CRM or field service platform with call tracking saves time and reduces missed follow-ups, because leads are logged automatically instead of typed in by hand.",
      },
      {
        q: "How does call tracking work for contractors?",
        a: "Each marketing channel gets its own phone number that forwards to your main line. The call tracking service records which number was called, so every phone lead is attributed to its source. Many services also record calls and send missed-call alerts.",
      },
      {
        q: "How often should contractors review lead tracking reports?",
        a: "Monthly for budget decisions and weekly for follow-up. A weekly check of open leads catches estimates that went quiet, and a monthly review of revenue by source shows which channels to scale or cut. If a source shows a falling close rate for two months in a row, look at lead quality and response times before cutting it.",
      },
      {
        q: "Why does response time matter so much?",
        a: "Homeowners often contact several contractors and book whoever responds first and professionally. Tracking response time shows how many leads you lose by being slow and makes the case for missed-call text-back or a dedicated person to answer enquiries. Missed-call text-back alone often recovers jobs that would otherwise go to a competitor.",
      },
    ],
    related: [
      { href: "/contractor-lead-management", label: "Contractor lead management" },
      { href: "/contractor-crm", label: "CRM for contractors" },
      { href: "/blog/cold-email-follow-up", label: "Follow-up timing and templates" },
      { href: "/exclusive-contractor-leads", label: "Exclusive contractor leads" },
      { href: "/sms-marketing-for-contractors", label: "SMS marketing for contractors" },
      { href: "/features", label: "Contractor Leads features" },
    ],
    cta: { href: "/contractor-lead-management", label: "Next: lead management" },
    ctaBand: {
      title: "Agencies: track every contractor prospect",
      description: "Find contractors, score them and track each one in a built-in pipeline. Start with 10 free leads.",
    },
  },

  // 3. Lead management
  {
    slug: "contractor-lead-management",
    kind: "guide",
    primaryKeyword: "contractor lead management",
    secondaryKeywords: ["lead management for contractors", "contractor lead follow up", "speed to lead contractors", "lead management process"],
    titleTag: "Contractor Lead Management: A Process That Closes",
    metaDescription: "Contractor lead management step by step: respond fast, qualify, book estimates, follow up and close, with response targets and simple automation.",
    breadcrumb: "Contractor lead management",
    eyebrow: "Contractor guide",
    h1: "Contractor lead management: a process that closes more jobs",
    heroDescription: "A simple, repeatable process from first call to signed job, with response targets and automation that keeps leads from going cold.",
    quickAnswer: {
      q: "What is contractor lead management?",
      a: "Contractor lead management is the process of handling every enquiry the same way, from first response to signed job. It covers how fast you reply, how you qualify the job, how you book and run estimates, and how you follow up. A consistent process usually closes more jobs than buying more leads.",
    },
    intro: "Contractor lead management decides how many of the leads you already pay for turn into work. Most contractors lose jobs not to price but to slow replies and quotes that nobody follows up. This guide lays out a seven-step process, the response targets to aim for and the parts worth automating.",
    sections: [
      {
        heading: "The seven-step process",
        body: "Write the process down and make it the same for every person who answers the phone.",
        bullets: [
          "Capture: log every call, form and message in one place with its source",
          "Respond: reply within minutes during business hours, and same evening at the latest",
          "Qualify: confirm job type, location, timing and budget range",
          "Book: schedule the estimate or site visit before ending the first call",
          "Quote: send a clear written estimate within 24 to 48 hours",
          "Follow up: check in two, five and ten days after the quote",
          "Close and review: confirm the job, then ask for a review once it is finished",
        ],
      },
      {
        heading: "Response time targets",
        body: "Speed is the cheapest way to win more jobs. Set targets your team can meet and measure them with [lead tracking](/contractor-lead-tracking).",
        table: {
          headers: ["Lead type", "Target first response", "Why"],
          rows: [
            ["Emergency call", "Answer live", "The homeowner calls the next company"],
            ["Web form", "Within 5 to 15 minutes", "Interest is highest right after submitting"],
            ["After-hours enquiry", "Text back immediately, call next morning", "Shows you are responsive"],
            ["Quote follow-up", "2, 5 and 10 days after sending", "Most homeowners need a nudge"],
          ],
        },
      },
      {
        heading: "What to automate",
        body: "Automate the reminders, not the relationship. Good automation makes sure nothing is forgotten while people handle the conversations.",
        bullets: [
          "Missed-call text-back so every unanswered call gets an instant reply",
          "Appointment confirmations and reminders to cut no-shows",
          "Quote follow-up messages on a fixed schedule",
          "Review requests after the job is completed",
          "A [CRM](/contractor-crm) that shows every open lead and its next step",
        ],
      },
      {
        heading: "For agencies managing contractor prospects",
        body: "Agencies need the same discipline when selling to contractors: fast replies, consistent [follow-ups](/blog/cold-email-follow-up) and a clear pipeline. Contractor Leads runs follow-up sequences that stop automatically when a prospect replies, bounces or unsubscribes, and tracks each one in a pipeline.",
      },
    ],
    faqs: [
      {
        q: "How fast should a contractor respond to a new lead?",
        a: "As fast as possible: answer emergency calls live, and reply to web forms within five to fifteen minutes during business hours. Homeowners often contact several contractors, and the first professional response usually wins the estimate. After hours, an instant text reply followed by a call the next morning keeps the homeowner from moving on.",
      },
      {
        q: "How many times should I follow up on a quote?",
        a: "Three follow-ups is a good default: around two, five and ten days after sending the quote. Each one should add something useful, such as answering a question, offering a time to talk or mentioning a scheduling window, rather than just asking whether they decided.",
      },
      {
        q: "What is the biggest lead management mistake contractors make?",
        a: "Not following up after sending a quote. Many homeowners are busy rather than uninterested, and a polite follow-up often wins the job. The second biggest mistake is letting calls go to voicemail without a quick reply. A written follow-up schedule and missed-call text-back fix both problems at little cost.",
      },
      {
        q: "Should contractors qualify leads on the first call?",
        a: "Yes, briefly. Confirm the job type, location, timing and rough budget so you do not spend hours on estimates for jobs you cannot win. Keep it friendly and quick, then book the estimate before ending the call. A few standard questions, asked the same way by everyone, keep qualifying fair and fast.",
      },
      {
        q: "Do I need a CRM for lead management?",
        a: "Small teams can start with a shared sheet, but a CRM or field service platform makes follow-up reliable once you handle more than a few leads a week. It shows every open lead, its next step and who owns it, and can send reminders automatically.",
      },
    ],
    related: [
      { href: "/contractor-lead-tracking", label: "Lead tracking for contractors" },
      { href: "/contractor-crm", label: "CRM for contractors" },
      { href: "/sms-marketing-for-contractors", label: "SMS marketing for contractors" },
      { href: "/blog/cold-email-follow-up", label: "Cold email follow-up" },
      { href: "/exclusive-contractor-leads", label: "Exclusive contractor leads" },
      { href: "/blog/cold-calling-contractors-script", label: "Cold calling scripts" },
    ],
    cta: { href: "/contractor-crm", label: "Next: CRM for contractors" },
    ctaBand: {
      title: "Agencies: manage contractor prospects in one place",
      description: "Find, score and follow up with contractors from one workspace. Start with 10 free leads.",
    },
  },

  // 4. Contractor CRM
  {
    slug: "contractor-crm",
    kind: "guide",
    primaryKeyword: "contractor crm",
    secondaryKeywords: ["crm for contractors", "best crm for contractors", "construction crm", "home service crm"],
    titleTag: "Contractor CRM: Features to Look For and Options",
    metaDescription: "Contractor CRM guide: the features that matter, CRM vs field service software, how to choose one, and the pipeline CRM agencies use for prospects.",
    breadcrumb: "Contractor CRM",
    eyebrow: "Contractor guide",
    h1: "Contractor CRM: the features that matter and how to choose",
    heroDescription: "What a CRM should do for a contracting business, how it differs from field service software, and how to pick one your team will use.",
    quickAnswer: {
      q: "What is a contractor CRM?",
      a: "A contractor CRM is software that keeps every lead, customer, estimate and follow-up in one place. It shows where each job stands, reminds you to follow up, and reports which marketing produces signed work. Many contractors use field service platforms that combine a CRM with scheduling, dispatch and invoicing.",
    },
    intro: "A contractor CRM replaces sticky notes, inboxes and memory with one record of every lead and customer. The right one helps you respond faster, follow up on every quote and see which marketing pays. This guide covers the features that matter, the main types of software and how to choose without overbuying.",
    sections: [
      {
        heading: "Features that matter for contractors",
        body: "Contractors need fewer features than large sales teams, but they need the right ones.",
        table: {
          headers: ["Feature", "Why contractors need it"],
          rows: [
            ["Lead capture from calls and forms", "No enquiry is lost or typed in late"],
            ["Pipeline stages", "See every job from lead to signed"],
            ["Follow-up reminders and automation", "Quotes get chased on schedule"],
            ["Estimates and quotes", "Send professional quotes quickly"],
            ["Mobile app", "Crews and owners work from job sites"],
            ["Source reporting", "Know which marketing produces revenue"],
            ["Texting", "Homeowners reply faster to texts than emails"],
          ],
        },
      },
      {
        heading: "CRM vs field service management software",
        body: "Most home-service contractors are best served by field service management software, such as Jobber, Housecall Pro or ServiceTitan, which combines a CRM with scheduling, dispatch, invoicing and payments. Standalone sales CRMs fit contractors with long sales cycles, such as remodelers and builders, who manage many estimates before work starts.",
        bullets: [
          "Service and repair businesses: field service management software",
          "Remodelers and builders: a sales CRM, sometimes alongside project software",
          "Very small teams: a simple CRM or shared sheet until volume grows",
        ],
      },
      {
        heading: "How to choose a contractor CRM",
        body: "Pick the simplest tool your team will actually use every day. A powerful CRM that nobody updates is worse than a spreadsheet everyone trusts.",
        bullets: [
          "List the five things you need it to do, then compare only tools that do them",
          "Check the mobile app with the people who will use it on site",
          "Confirm it connects to your phone system, website forms and accounting",
          "Start a trial with real leads for two weeks before committing",
          "Set up [lead tracking](/contractor-lead-tracking) and [lead management](/contractor-lead-management) rules on day one",
        ],
      },
      {
        heading: "The pipeline CRM in Contractor Leads (for agencies)",
        body: "Contractor Leads is not a field service CRM for running jobs. It includes a pipeline CRM built for agencies and sales teams that sell to contractors: it tracks each contractor prospect from first outreach to signed client, alongside email and SMS outreach and integrations with GoHighLevel, HubSpot, Zapier and webhooks.",
      },
    ],
    faqs: [
      {
        q: "What is the best CRM for contractors?",
        a: "It depends on the business. Service and repair companies usually do best with field service management software that includes a CRM, scheduling and invoicing. Remodelers and builders with long sales cycles often prefer a sales-focused CRM. The best choice is the simplest one your team will use every day.",
      },
      {
        q: "Do small contractors need a CRM?",
        a: "Not always on day one. A shared spreadsheet works for a few leads a week. Once you lose track of quotes, miss follow-ups or cannot tell which marketing works, a CRM pays for itself quickly through jobs that would otherwise slip away.",
      },
      {
        q: "What is the difference between a CRM and field service software?",
        a: "A CRM manages leads, customers and the sales pipeline. Field service management software adds the operations side: scheduling, dispatching crews, invoicing and payments. Many contractor tools combine both, which is why field service platforms are popular in home services. If you mainly run repair and service jobs, a combined platform usually saves the most time.",
      },
      {
        q: "Which CRM features matter most for contractors?",
        a: "Automatic lead capture from calls and forms, clear pipeline stages, follow-up reminders, quick estimates, a good mobile app, texting and reports that show revenue by lead source. Features beyond those are useful only if your team will actually use them.",
      },
      {
        q: "Is Contractor Leads a CRM for contractors?",
        a: "Not for running a contracting business. It includes a pipeline CRM for marketing agencies and sales teams that sell to contractors, used to track contractor prospects from first email to signed client, with outreach and integrations built in. Contractors who need scheduling, dispatch and invoicing should look at field service management software instead.",
      },
    ],
    related: [
      { href: "/contractor-lead-management", label: "Contractor lead management" },
      { href: "/contractor-lead-tracking", label: "Lead tracking for contractors" },
      { href: "/sms-marketing-for-contractors", label: "SMS marketing for contractors" },
      { href: "/features", label: "Pipeline CRM and features" },
      { href: "/contractor-lead-generation-software", label: "Lead generation software" },
      { href: "/commercial-contractor-leads", label: "Commercial contractor leads" },
    ],
    cta: { href: "/features", label: "See the agency pipeline CRM" },
    ctaBand: {
      title: "Selling to contractors? Track every prospect",
      description: "Find contractors, score them and manage your pipeline in one tool. Start with 10 free leads.",
    },
  },

  // 5. SMS marketing for contractors
  {
    slug: "sms-marketing-for-contractors",
    kind: "guide",
    primaryKeyword: "sms marketing for contractors",
    secondaryKeywords: ["text message marketing for contractors", "contractor sms", "sms for home services", "text marketing contractors"],
    titleTag: "SMS Marketing for Contractors: Rules and Templates",
    metaDescription: "SMS marketing for contractors: what to text, consent and 10DLC rules, quiet hours, opt-outs and ready templates for reminders, quotes and reviews.",
    breadcrumb: "SMS marketing for contractors",
    eyebrow: "Contractor guide",
    h1: "SMS marketing for contractors: rules, uses and templates",
    heroDescription: "Text messages get read fast. Here is how contractors use them for reminders, quotes and reviews while staying within the rules.",
    quickAnswer: {
      q: "How should contractors use SMS marketing?",
      a: "Contractors get the most from SMS marketing by texting customers who opted in: appointment reminders, quote follow-ups, review requests and seasonal offers. Get written consent before marketing texts, register business texting numbers for A2P 10DLC in the US, honour STOP replies immediately and keep messages short, useful and within sensible hours.",
    },
    intro: "SMS marketing for contractors works because homeowners read texts within minutes, while emails can sit unopened for days. Used well, texting cuts no-shows, speeds up quote decisions and brings in reviews. Used carelessly, it can break consent rules. This guide covers the uses that pay off, the rules to follow and templates you can adapt.",
    sections: [
      {
        heading: "Texts that pay off",
        body: "The best contractor texts are expected and useful. Start with service messages, then add marketing for customers who have opted in.",
        table: {
          headers: ["Message", "When to send", "Result"],
          rows: [
            ["Appointment reminder", "Day before and morning of", "Fewer no-shows"],
            ["On-the-way alert", "When the tech leaves", "Better customer experience"],
            ["Quote follow-up", "2 to 5 days after the quote", "Faster decisions"],
            ["Review request", "Right after the job", "More Google reviews"],
            ["Seasonal offer", "Before peak season (opted-in customers)", "Repeat business"],
          ],
        },
      },
      {
        heading: "The rules to follow",
        body: "In the US, texting is regulated by the TCPA and carrier rules. This is general guidance, not legal advice, so check the requirements for your situation.",
        bullets: [
          "Get prior express written consent before sending marketing texts",
          "Register business texting numbers for A2P 10DLC so carriers deliver your messages",
          "Identify your business in every message and include opt-out instructions such as Reply STOP",
          "Honour opt-outs immediately and keep a record of consent",
          "Text during reasonable local hours, generally between 8am and 9pm",
          "Keep messages short, specific and relevant to the customer",
        ],
      },
      {
        heading: "Templates contractors can adapt",
        body: "Keep texts under about 160 characters where possible and always say who you are.",
        bullets: [
          "Reminder: \"Hi Sam, this is Peak Roofing. Reminder: your inspection is tomorrow at 10am. Reply C to confirm or R to reschedule.\"",
          "Quote follow-up: \"Hi Sam, Peak Roofing here. Any questions on the estimate we sent? Happy to walk you through it. Reply STOP to opt out.\"",
          "Review request: \"Thanks for choosing Peak Roofing! A quick review helps a lot: [link]. Reply STOP to opt out.\"",
        ],
      },
      {
        heading: "For agencies: SMS outreach to contractors",
        body: "Agencies can text contractor prospects too, but cold texting carries more compliance risk than email, so the same consent rules apply. Contractor Leads includes an SMS add-on for agencies alongside email outreach and [follow-up sequences](/blog/cold-email-follow-up); use it with contacts who have agreed to hear from you, and lead with email for first contact.",
      },
    ],
    faqs: [
      {
        q: "Is SMS marketing legal for contractors?",
        a: "Yes, when you follow the rules. In the US that means getting written consent before sending marketing texts, registering your texting numbers for A2P 10DLC, identifying your business, including opt-out instructions and honouring STOP replies right away. Service messages such as reminders have different rules from promotions, so check your situation.",
      },
      {
        q: "What should contractors text customers about?",
        a: "Appointment reminders, on-the-way alerts, quote follow-ups and review requests are the most valuable because customers expect them. Seasonal offers and maintenance reminders work well for customers who have opted in to marketing texts. Keep each text to one clear purpose and always identify your business by name.",
      },
      {
        q: "What is A2P 10DLC?",
        a: "A2P 10DLC is the US carrier registration system for businesses that send texts from standard local phone numbers. Registering your brand and use case improves deliverability; unregistered business texts are more likely to be filtered or blocked by carriers. Registration is usually handled through your texting provider and can take several days, so start before you need to send.",
      },
      {
        q: "How often can contractors text customers?",
        a: "Text when there is a clear reason: an appointment, a quote, a finished job or a seasonal offer. For marketing texts, a few messages a month at most keeps opt-outs low. Always send during reasonable local hours. Watch opt-out rates: if they rise, send less often or make messages more relevant.",
      },
      {
        q: "Does texting work better than email for contractors?",
        a: "For time-sensitive messages, usually yes, because texts are read within minutes. Email is still better for detailed quotes, documents and longer explanations. Most contractors get the best results by using texts for quick updates and email for detail. Ask customers which they prefer and note it in your CRM, so each person hears from you the way they like.",
      },
    ],
    related: [
      { href: "/contractor-lead-management", label: "Contractor lead management" },
      { href: "/contractor-crm", label: "CRM for contractors" },
      { href: "/blog/cold-email-follow-up", label: "Cold email follow-up" },
      { href: "/contractor-lead-tracking", label: "Lead tracking for contractors" },
      { href: "/blog/email-warmup-for-cold-email", label: "Email warmup guide" },
      { href: "/features", label: "Email and SMS features" },
    ],
    cta: { href: "/features", label: "See email and SMS outreach" },
    ctaBand: {
      title: "Agencies: reach contractors by email and SMS",
      description: "Find contractors with owner contacts and run compliant outreach in one place. Start with 10 free leads.",
    },
  },

  // 6. Contractor email finder (product)
  {
    slug: "contractor-email-finder",
    kind: "product",
    serviceType: "Contractor email finder and verification",
    primaryKeyword: "contractor email finder",
    secondaryKeywords: ["find contractor email addresses", "contractor owner email", "contractor email lookup", "roofer email finder"],
    titleTag: "Contractor Email Finder: Find Owner Emails, Verified",
    metaDescription: "Find owner emails with a contractor email finder: verified emails for roofers, HVAC, plumbers and 15 more trades, for agencies. 10 free leads.",
    breadcrumb: "Contractor email finder",
    eyebrow: "Contractor email finder",
    h1: "Contractor email finder: owner names and verified emails",
    heroDescription: "Find the people who decide at roofing, HVAC, plumbing and other contracting businesses, with emails verified before you send.",
    quickAnswer: {
      q: "How do I find a contractor's email address?",
      a: "Search the business by trade and city in Contractor Leads, or upload a list of companies. It reads the business website and other sources to find the owner's name and email, then verifies each address as safe, catch-all, role-based or invalid, so you only send to emails that are likely to arrive.",
    },
    intro: "The Contractor Leads contractor email finder gives agencies and sales teams the owner's name and a verified email for home-service businesses, not just a generic info@ address. Search 18 trades by city or state with live Google data, or upload your own list, and send outreach to people who can actually say yes.",
    sections: [
      {
        heading: "How the contractor email finder works",
        body: "Three steps take you from a trade and a city to verified owner contacts.",
        bullets: [
          "Search: pick a trade and a market, or upload a CSV of businesses with the bulk email finder",
          "Find: Contractor Leads reads the business website and other public sources for the owner's name and email",
          "Verify: every address is checked and labelled safe, catch-all, role-based or invalid before you export or send",
        ],
      },
      {
        heading: "What you get on every lead",
        body: "Each lead combines contact details with the context you need for a relevant first message.",
        table: {
          headers: ["Field", "What it gives you"],
          rows: [
            ["Owner name", "A real person to address, when it can be verified"],
            ["Email and verification status", "Safe, catch-all, role or invalid"],
            ["Business phone and website", "From live Google data"],
            ["Rating and review count", "Reputation at a glance"],
            ["AI scores (website, SEO, PPC, marketing)", "Which gap to lead with"],
            ["Meta ad status", "Whether they already advertise"],
          ],
        },
      },
      {
        heading: "Why verification matters",
        body: "Sending to invalid addresses raises your bounce rate and hurts the reputation of your sending domain, which pushes future emails toward spam. Verifying first and exporting only safe emails keeps bounces low. Pair it with a warmed-up mailbox; our [email warmup guide](/blog/email-warmup-for-cold-email) explains how.",
        callout: {
          title: "Export only safe emails",
          text: "The export screen can filter to verified-safe emails so your list is ready for cold outreach.",
        },
      },
      {
        heading: "Compared with general email finders",
        body: "General B2B email finders such as Hunter or Prospeo work best when you already know the company and it has its own email domain. Many contractors use Gmail or Outlook, or have no website at all. Contractor Leads starts from the local business, so you find the contractors first and their owners second. See the [Hunter alternative](/alternatives/hunter-alternative) and [Prospeo alternative](/alternatives/prospeo-alternative) comparisons for details.",
      },
    ],
    faqs: [
      {
        q: "How does Contractor Leads find contractor emails?",
        a: "It starts from live Google business data for the trade and area you choose, reads each business's website and other public sources for the owner's name and email, and then verifies the address. Fields that cannot be verified are left blank instead of guessed.",
      },
      {
        q: "Are the contractor emails verified?",
        a: "Yes. Each email is checked and labelled safe, catch-all, role-based or invalid. You can export only safe emails, which keeps bounce rates low and protects the reputation of the mailbox you send from. Catch-all and role-based addresses are labelled clearly, so you can decide whether to include them in a campaign or leave them out.",
      },
      {
        q: "Can I upload my own list of contractors?",
        a: "Yes. The bulk email finder accepts a list of businesses and returns owner names and verified emails where they can be found, so you can enrich a list you already have instead of starting from a search. Upload a CSV or Excel file with business names and websites, and the results can be exported back to CSV or Excel.",
      },
      {
        q: "Which trades does the contractor email finder cover?",
        a: "Eighteen home-service trades, including roofing, HVAC, plumbing, electrical, solar, general contractors, remodeling, landscaping, painting, concrete, fencing, flooring, garage doors, pest control, cleaning and pool services, across the US, Canada, the UK, Australia and New Zealand. You can search by city, state or radius, and filter results by the AI scores to focus on businesses with the clearest marketing gaps.",
      },
      {
        q: "How much does it cost?",
        a: "Every new account gets 10 free leads with no credit card. Paid plans start at $19.99 a month for 500 credits, where one credit equals one lead. Email verification before export is included. Larger plans lower the cost per lead to about 2 cents, and you can upgrade, downgrade or cancel at any time.",
      },
      {
        q: "Is it legal to email contractors I find this way?",
        a: "Business-to-business cold email is legal in many countries when you follow the rules: in the US, CAN-SPAM requires an accurate sender, a physical address and a working unsubscribe. In the EU and UK, outreach needs a legitimate-interest basis. Take legal advice for your market.",
      },
    ],
    related: [
      { href: "/email-lists", label: "Contractor email lists by trade" },
      { href: "/contractor-lead-generation-software", label: "Contractor lead generation software" },
      { href: "/alternatives/hunter-alternative", label: "Hunter.io alternative" },
      { href: "/blog/how-to-find-business-owner-name", label: "How to find a business owner's name" },
      { href: "/blog/email-warmup-for-cold-email", label: "Email warmup guide" },
      { href: "/pricing", label: "Pricing and free leads" },
    ],
    cta: { href: "/register", label: "Find contractor emails free" },
    ctaBand: {
      title: "Find contractor owners and verified emails",
      description: "Search 18 trades by city or upload a list. Your first 10 leads are free, no card needed.",
    },
  },

  // 7. Homeowner leads (contractor-intent guide)
  {
    slug: "homeowner-leads",
    kind: "guide",
    primaryKeyword: "homeowner leads",
    secondaryKeywords: ["homeowner leads for contractors", "buy homeowner leads", "home improvement leads", "homeowner data for contractors"],
    titleTag: "Homeowner Leads for Contractors: Where They Come From",
    metaDescription: "Homeowner leads for contractors: the main sources, what each costs, how to judge quality, and the consent rules for calling and texting homeowners.",
    breadcrumb: "Homeowner leads",
    eyebrow: "Contractor guide",
    h1: "Homeowner leads for contractors: sources, costs and rules",
    heroDescription: "An honest look at where contractors get homeowner leads, what each source really costs, and how to stay on the right side of consent rules.",
    quickAnswer: {
      q: "Where do contractors get homeowner leads?",
      a: "Contractors get homeowner leads from five main sources: lead marketplaces, Local Services Ads, their own Google and Meta ads, SEO and Google Business Profile, and referrals. Marketplace leads are fast but often shared. Leads from your own marketing are exclusive and usually cheaper per signed job once they are running.",
    },
    intro: "Homeowner leads are enquiries from people who want work done on their home. Every contractor needs them, and dozens of companies promise to sell them. This guide compares the main sources honestly, explains how to judge lead quality, and covers the consent rules for calling and texting homeowners.",
    audienceNote: AGENCY_NOTE,
    sections: [
      {
        heading: "The main sources of homeowner leads",
        body: "Each source trades off speed, cost and exclusivity.",
        table: {
          headers: ["Source", "Speed to start", "Exclusive?", "Notes"],
          rows: [
            ["Lead marketplaces", "Fast", "Often shared", "Pay per lead; quality varies"],
            ["Local Services Ads", "Fast", "Yes", "Pay per lead; Google screening required"],
            ["Your own Google and Meta ads", "Weeks to tune", "Yes", "You control targeting and offer"],
            ["SEO and Google Business Profile", "Months", "Yes", "Lowest cost per lead once ranking"],
            ["Referrals and past customers", "Ongoing", "Yes", "Highest close rates"],
          ],
        },
      },
      {
        heading: "How to judge lead quality",
        body: "Cheap leads are expensive if they never answer. Measure each source by what happens after the lead arrives, using simple [lead tracking](/contractor-lead-tracking).",
        bullets: [
          "Contact rate: what share of leads you actually reach",
          "Booking rate: what share book an estimate",
          "Close rate and average job value",
          "Cost per signed job, the number that matters most",
        ],
      },
      {
        heading: "Consent rules for calling and texting homeowners",
        body: "Homeowner leads involve personal data, so consent rules apply. In the US, calling or texting with automated systems for marketing generally requires prior express written consent under the TCPA, and the National Do Not Call Registry applies to telemarketing. Buy only from vendors that can show how consent was collected, keep records, and honour opt-outs. This is general guidance, not legal advice.",
      },
      {
        heading: "Building your own homeowner lead flow",
        body: "Most growing contractors combine a fast paid source with long-term owned channels: [Local Services Ads](/blog/local-service-ads) for immediate demand, a strong Google Business Profile and website for steady organic leads, and referral requests after every job. Over time this reduces dependence on shared marketplace leads. See [exclusive contractor leads](/exclusive-contractor-leads) for the trade-offs.",
      },
    ],
    faqs: [
      {
        q: "What are homeowner leads?",
        a: "Homeowner leads are enquiries from people who want work done on their home, such as a roof replacement, new HVAC system or bathroom remodel. They come from forms, calls and messages generated by ads, marketplaces, websites and referrals, and are sold or delivered to contractors who do that work.",
      },
      {
        q: "Should contractors buy homeowner leads?",
        a: "Bought leads can fill gaps quickly, especially when starting out or entering a new area, but they are often shared with other contractors. Most contractors get the best long-term results by combining a paid source with their own ads, SEO and referrals, which produce exclusive leads.",
      },
      {
        q: "How much do homeowner leads cost?",
        a: "It varies widely by trade and market, from tens of dollars for simple repairs to well over a hundred for roofing, solar and remodeling. Shared leads cost less than exclusive ones. Compare sources by cost per signed job rather than cost per lead.",
      },
      {
        q: "Is it legal to buy homeowner data and call those people?",
        a: "Calling or texting homeowners for marketing has strict rules. In the US, automated calls and texts generally need prior express written consent, and Do Not Call rules apply. Only buy leads where the vendor can document consent, and take legal advice for your situation.",
      },
      {
        q: "Does Contractor Leads sell homeowner leads?",
        a: "No. Contractor Leads helps marketing agencies and sales teams find contractors as clients, with live Google data, owner names and AI scores. Contractors looking for homeowner leads should use the sources compared in this guide. Agencies that generate homeowner leads for contractors can use Contractor Leads to find the contractors who need that service.",
      },
    ],
    related: [
      { href: "/exclusive-contractor-leads", label: "Exclusive contractor leads" },
      { href: "/storm-damage-leads", label: "Storm damage leads" },
      { href: "/new-construction-leads", label: "New construction leads" },
      { href: "/blog/local-service-ads", label: "Local Services Ads guide" },
      { href: "/blog/how-much-do-contractor-leads-cost", label: "Contractor lead costs" },
      { href: "/commercial-contractor-leads", label: "Commercial contractor leads" },
    ],
    cta: { href: "/exclusive-contractor-leads", label: "Read: exclusive vs shared leads" },
    ctaBand: {
      title: "Run an agency that generates leads for contractors?",
      description: "Find contractors who need your service, with owner names and AI scores. Start with 10 free leads.",
    },
  },

  // 8. Commercial contractor leads
  {
    slug: "commercial-contractor-leads",
    kind: "guide",
    primaryKeyword: "commercial contractor leads",
    secondaryKeywords: ["commercial construction leads", "commercial project leads", "bid leads for contractors", "commercial roofing leads"],
    titleTag: "Commercial Contractor Leads: How to Find Projects",
    metaDescription: "Commercial contractor leads: where commercial projects are found, from bid boards and public portals to GCs and property managers, and how to win them.",
    breadcrumb: "Commercial contractor leads",
    eyebrow: "Contractor guide",
    h1: "Commercial contractor leads: where projects come from",
    heroDescription: "Commercial work is won through bids, relationships and prequalification. Here is where those opportunities are and how to compete for them.",
    quickAnswer: {
      q: "How do contractors find commercial leads?",
      a: "Contractors find commercial leads through bid boards and plan rooms, public procurement portals, relationships with general contractors, and direct outreach to property and facility managers. Unlike residential work, commercial jobs are won on prequalification, bonding, references and relationships more than on search ads, so consistent outreach and a strong track record matter most.",
    },
    intro: "Commercial contractor leads look very different from residential ones. Instead of homeowners searching online, you are competing for bid invitations, subcontracts and service agreements. This guide covers where commercial projects are listed, how to get on bid lists, and what helps you win once you are invited.",
    audienceNote: AGENCY_NOTE,
    sections: [
      {
        heading: "Where commercial projects are found",
        body: "Most commercial work comes from a handful of channels. Pick the ones that match the size and type of work you want.",
        table: {
          headers: ["Channel", "Best for", "What it takes"],
          rows: [
            ["Bid boards and plan rooms", "Subcontract work on new projects", "Subscriptions and quick, accurate bids"],
            ["Public procurement portals", "Government and school projects", "Registration, bonding and paperwork"],
            ["General contractor relationships", "Repeat subcontract work", "Prequalification and reliable delivery"],
            ["Property and facility managers", "Service, repair and maintenance contracts", "Direct outreach and responsiveness"],
            ["Industry associations", "Networking and referrals", "Membership and attendance"],
          ],
        },
      },
      {
        heading: "Getting on general contractors' bid lists",
        body: "General contractors invite subcontractors they trust. Make it easy for them to say yes.",
        bullets: [
          "Complete prequalification forms promptly, with insurance, licences and safety records",
          "Show relevant projects with photos, scope and references",
          "Bid accurately and on time, even on jobs you might not win",
          "Follow up after awards to learn how your bid compared",
        ],
      },
      {
        heading: "Public work",
        body: "Federal contract opportunities in the US are listed on SAM.gov, and states, counties, cities and school districts run their own procurement portals. Public work often requires registration, bonding and specific paperwork, but it offers steady, transparent opportunities for contractors who build the process.",
      },
      {
        heading: "What helps you win once invited",
        body: "Being invited to bid is only the start. Commercial buyers compare price, but they also weigh risk: whether you will finish on time, document your work and keep the site safe.",
        bullets: [
          "A one-page capabilities statement with trades, crew size, service area and bonding capacity",
          "Photos and references from similar projects, ideally with the general contractor's contact",
          "Clear inclusions and exclusions in every bid, so there are no surprises later",
          "Up-to-date insurance certificates and safety records ready to send the same day",
        ],
      },
      {
        heading: "Outreach to property and facility managers",
        body: "Service and maintenance contracts with property managers can provide recurring revenue. A short, specific email or call that references their buildings, followed by consistent [follow-ups](/blog/cold-email-follow-up), works better than generic brochures. Many contractors keep a simple [CRM](/contractor-crm) of every property manager they contact.",
      },
    ],
    faqs: [
      {
        q: "Where can contractors find commercial bids?",
        a: "On bid boards and plan rooms that list upcoming projects, on public procurement portals such as SAM.gov for federal work and state or local portals, and directly from general contractors who invite trusted subcontractors to bid. Many contractors combine one paid bid board with direct relationships, because invitations from trusted general contractors convert far better than open bids.",
      },
      {
        q: "How is commercial lead generation different from residential?",
        a: "Residential leads come from homeowners searching and calling. Commercial work is won through bids, prequalification, bonding, references and relationships with general contractors and property managers. Marketing still helps, but reliability, paperwork and track record decide most commercial jobs. A clear capabilities statement and a list of completed projects usually help more than ads.",
      },
      {
        q: "How do I get on a general contractor's bid list?",
        a: "Contact their estimating or preconstruction team, complete their prequalification with insurance, licences and safety records, share relevant project references, and bid accurately and on time when invited. Consistency over several bids builds trust. Ask for feedback after each bid; general contractors remember subcontractors who want to improve and respond quickly.",
      },
      {
        q: "Are property managers good sources of commercial leads?",
        a: "Yes, especially for service, repair and maintenance work. Property and facility managers need reliable contractors who respond quickly. Direct outreach that references their buildings, plus fast service when called, can turn into recurring contracts. Start with smaller service calls; good performance on those is how most contractors win larger maintenance agreements.",
      },
      {
        q: "Does Contractor Leads provide commercial project leads?",
        a: "No. Contractor Leads helps marketing agencies and sales teams find contractors to work with. Contractors seeking commercial projects should use bid boards, procurement portals and relationships covered in this guide. Agencies that sell services to commercial and general contractors can use it to find those businesses, with owner names and AI scores for website, SEO and ad gaps.",
      },
    ],
    related: [
      { href: "/new-construction-leads", label: "New construction leads" },
      { href: "/homeowner-leads", label: "Homeowner leads" },
      { href: "/blog/general-contractor-leads", label: "General contractor leads" },
      { href: "/contractor-crm", label: "CRM for contractors" },
      { href: "/exclusive-contractor-leads", label: "Exclusive contractor leads" },
      { href: "/industries/general-contractors", label: "General contractor industry page" },
    ],
    cta: { href: "/new-construction-leads", label: "Read: new construction leads" },
    ctaBand: {
      title: "Selling services to commercial contractors?",
      description: "Find general and commercial contractors with owner names and AI scores. Start with 10 free leads.",
    },
  },

  // 9. Storm damage leads
  {
    slug: "storm-damage-leads",
    kind: "guide",
    primaryKeyword: "storm damage leads",
    secondaryKeywords: ["storm damage roofing leads", "hail damage leads", "storm restoration leads", "roofing storm leads"],
    titleTag: "Storm Damage Leads for Roofers: Sources and Rules",
    metaDescription: "Storm damage leads for roofers: how storm demand works, where to track storms, how to generate leads ethically, and rules on insurance claims.",
    breadcrumb: "Storm damage leads",
    eyebrow: "Roofing guide",
    h1: "Storm damage leads for roofers: sources and rules",
    heroDescription: "How roofing and restoration companies find storm damage leads after hail and wind events, and how to do it legally and ethically.",
    quickAnswer: {
      q: "How do roofers get storm damage leads?",
      a: "Roofers get storm damage leads by tracking hail and wind events, then reaching affected homeowners quickly through Local Services Ads, Google and Meta ads aimed at the storm area, door-to-door canvassing where allowed, and referrals. Speed matters, but so do licensing, honest inspections and following your state's rules on insurance claims.",
    },
    intro: "Storm damage leads drive a large share of roofing and restoration work in hail and hurricane regions. Demand spikes right after an event, and so does competition. This guide explains how to track storms, generate leads ethically, and avoid the rules that trip up storm-chasing contractors.",
    audienceNote: AGENCY_NOTE,
    sections: [
      {
        heading: "How storm demand works",
        body: "After hail or high winds, many homeowners need inspections at once, often paid for by insurance. Demand is concentrated in specific neighbourhoods for a few weeks, so roofers who respond fast and look trustworthy win most of it. Our state pages show which states sit in the hail belt and on the hurricane coast, such as [roofing in Texas](/industries/roofing/texas) and [roofing in Colorado](/industries/roofing/colorado).",
      },
      {
        heading: "Tracking storms",
        body: "Free public data shows where severe weather hit. NOAA's Storm Prediction Center publishes daily storm reports for hail, wind and tornadoes, and the National Weather Service issues local warnings. Paid hail-tracking services add detailed maps of hail size and paths if you work storms regularly.",
      },
      {
        heading: "Generating storm leads ethically",
        body: "Homeowners are wary after storms because some out-of-town crews do poor work or pressure them. Lead with trust.",
        bullets: [
          "Run [Local Services Ads](/blog/local-service-ads) and search ads for storm and hail repair in the affected area",
          "Use geo-targeted Meta ads with real photos of your local team and work",
          "Canvass only where local rules allow, with clear ID and licensing",
          "Offer honest, documented inspections with photos, even when no repair is needed",
          "Ask satisfied customers for referrals to neighbours",
        ],
      },
      {
        heading: "Rules to know",
        body: "Many states regulate storm-related roofing work. Some restrict contractors from negotiating insurance claims on a homeowner's behalf, require specific contract disclosures or cancellation rights, or limit door-to-door solicitation. Cities may require permits and local licensing. Check your state and local rules before every storm season. This is general guidance, not legal advice.",
        callout: {
          title: "Protect your reputation",
          text: "Never promise a free roof or offer to cover a deductible. Many states prohibit it, and it erodes the trust that wins storm work.",
        },
      },
    ],
    faqs: [
      {
        q: "Where can roofers see where hail hit?",
        a: "NOAA's Storm Prediction Center publishes free daily reports of hail, wind and tornado events, and the National Weather Service issues local warnings. Many roofers also subscribe to hail-tracking services that map hail size and storm paths in more detail. Comparing storm reports with your service area each morning in season helps you plan ads and inspection slots.",
      },
      {
        q: "Are storm damage leads worth buying?",
        a: "They can be, but quality varies and many are shared with several roofers. Leads from your own ads and Local Services Ads in the affected area are exclusive, and responding quickly with an honest inspection usually closes better than bought storm leads.",
      },
      {
        q: "Can roofers help homeowners with insurance claims?",
        a: "Roofers can document damage and meet adjusters, but many states restrict contractors from negotiating claims on a homeowner's behalf, which is the role of a licensed public adjuster. Rules differ by state, so check yours before offering claim help. Clear written estimates and photo documentation help homeowners and adjusters without crossing that line.",
      },
      {
        q: "Is storm chasing legal?",
        a: "Working in storm areas is legal when you hold the required licences and permits and follow state and local rules on solicitation, contracts and insurance claims. Problems come from unlicensed crews, pressure tactics and prohibited practices such as waiving deductibles.",
      },
      {
        q: "How fast should roofers respond after a storm?",
        a: "Within hours if possible. Demand concentrates in the first days after an event, and homeowners often book the first trustworthy roofer who contacts them. Have ads, a storm landing page and inspection slots ready before storm season starts. Pre-built ads, enough inspection capacity and a clear call-handling plan make that speed possible.",
      },
    ],
    related: [
      { href: "/industries/roofing", label: "Roofing contractor leads" },
      { href: "/blog/how-to-get-more-roofing-leads", label: "How to get more roofing leads" },
      { href: "/exclusive-contractor-leads", label: "Exclusive contractor leads" },
      { href: "/homeowner-leads", label: "Homeowner leads" },
      { href: "/blog/roofing-seo", label: "Roofing SEO" },
      { href: "/industries/roofing/oklahoma", label: "Roofing in Oklahoma" },
    ],
    cta: { href: "/industries/roofing", label: "See roofing by state" },
    ctaBand: {
      title: "Agencies: find roofers who need storm-ready marketing",
      description: "Search roofers in hail and hurricane states, with owner names and AI scores. Start with 10 free leads.",
    },
  },

  // 10. New construction leads
  {
    slug: "new-construction-leads",
    kind: "guide",
    primaryKeyword: "new construction leads",
    secondaryKeywords: ["building permit leads", "new construction project leads", "permit data for contractors", "construction leads"],
    titleTag: "New Construction Leads: Permits, Builders and Bids",
    metaDescription: "New construction leads for contractors: using building permit data, builder relationships and bid platforms to find new projects early and win them.",
    breadcrumb: "New construction leads",
    eyebrow: "Contractor guide",
    h1: "New construction leads: permits, builders and bids",
    heroDescription: "How subcontractors and trades find new construction projects early, from permit records to builder relationships.",
    quickAnswer: {
      q: "How do contractors find new construction leads?",
      a: "Contractors find new construction leads through building permit records, which show approved projects early, relationships with home builders and general contractors, bid boards and plan rooms, and local builder associations. Permit data helps you spot active builders, but most new construction work is won by becoming a reliable, prequalified subcontractor.",
    },
    intro: "New construction leads are opportunities to work on homes and buildings that are being built, usually as a subcontractor to a builder or general contractor. Finding them early matters because trades are often chosen well before work starts. This guide covers permit data, builder relationships and the bid channels that matter.",
    audienceNote: AGENCY_NOTE,
    sections: [
      {
        heading: "Using building permit data",
        body: "Building permits are public records in many jurisdictions, and they show who is building what, where and when. Contractors use them to find active builders and new subdivisions early. Access varies: some cities publish permit data online, others require requests, and paid services compile permit data across areas.",
        bullets: [
          "Check your city or county building department for online permit search",
          "Track which builders pull the most permits in your area",
          "Watch new subdivisions and commercial projects as they are approved",
          "Use the US Census Bureau's Building Permits Survey for market-level trends",
        ],
      },
      {
        heading: "Builder and GC relationships",
        body: "Most new construction work goes to subcontractors builders already trust. Getting on their list takes persistence and proof.",
        bullets: [
          "Introduce yourself to purchasing and construction managers, not just the owner",
          "Provide insurance, licences, references and capacity details up front",
          "Price accurately and show up on schedule on the first job",
          "Join local home builder associations to meet builders in person",
        ],
      },
      {
        heading: "Bid boards and plan rooms",
        body: "Larger residential and commercial projects are often listed on bid boards and plan rooms, where general contractors invite subcontractor bids. See our guide to [commercial contractor leads](/commercial-contractor-leads) for how bid platforms and prequalification work.",
      },
      {
        heading: "New construction vs remodeling work",
        body: "New construction offers volume and repeat work from the same builders, but margins can be tight and payment terms long. Remodeling and repair work sold directly to homeowners often pays better per job. Many trades balance both; see [homeowner leads](/homeowner-leads) for the residential side.",
        table: {
          headers: ["", "New construction", "Remodeling and repair"],
          rows: [
            ["Customer", "Builders and general contractors", "Homeowners"],
            ["How work is won", "Relationships and bids", "Marketing, reviews and referrals"],
            ["Volume", "High, repeatable", "Varies"],
            ["Margins", "Often tighter", "Often higher"],
          ],
        },
      },
    ],
    faqs: [
      {
        q: "Can contractors use building permits to find leads?",
        a: "Yes. Building permits are public records in many places and show approved projects, builders and locations. Contractors use them to identify active builders and new developments early. Availability varies by city and county, and paid services compile permit data across larger areas.",
      },
      {
        q: "How do subcontractors get work from home builders?",
        a: "By building relationships with builders' purchasing and construction managers, providing insurance, licences and references, pricing accurately and performing reliably on early jobs. Builders reuse subcontractors they trust, so the first few jobs matter most. Clear communication about schedule and quick fixes on punch lists also keep you on a builder's preferred list.",
      },
      {
        q: "Where can I see how much new construction is happening in my area?",
        a: "The US Census Bureau's Building Permits Survey publishes permit counts by state and metro area, which show market-level trends. Local building departments and builder associations provide more detail about specific projects and active builders. Watching the trend over several months shows whether demand in your market is growing or slowing.",
      },
      {
        q: "Is new construction work better than remodeling?",
        a: "It depends on your business. New construction offers steady volume and repeat customers but often tighter margins and longer payment terms. Remodeling and repair sold to homeowners usually pays better per job but depends on marketing. Many contractors do both.",
      },
      {
        q: "Does Contractor Leads provide permit or new construction leads?",
        a: "No. Contractor Leads helps marketing agencies and sales teams find contractors as clients. Contractors seeking new construction work should use permit data, builder relationships and bid platforms covered in this guide. Agencies that sell services to builders and general contractors can use it to find those companies, with owner names, verified emails and AI scores.",
      },
    ],
    related: [
      { href: "/commercial-contractor-leads", label: "Commercial contractor leads" },
      { href: "/homeowner-leads", label: "Homeowner leads" },
      { href: "/blog/general-contractor-leads", label: "General contractor leads" },
      { href: "/industries/general-contractors", label: "General contractor industry page" },
      { href: "/blog/remodeling-contractor-leads", label: "Remodeling contractor leads" },
      { href: "/storm-damage-leads", label: "Storm damage leads" },
    ],
    cta: { href: "/commercial-contractor-leads", label: "Read: commercial contractor leads" },
    ctaBand: {
      title: "Agencies: find builders and GCs to work with",
      description: "Search general contractors and builders with owner names and AI scores. Start with 10 free leads.",
    },
  },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug) ?? EMAIL_LIST_PAGES.find((p) => p.slug === slug);
}
