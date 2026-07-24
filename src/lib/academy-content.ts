/**
 * In-app Academy content — how-to guides, FAQs, and blog-style explainers.
 * Users self-serve here instead of pinging admin for routine product questions.
 */

export type AcademyCategoryId =
  | "getting-started"
  | "leads"
  | "pipeline"
  | "email"
  | "billing"
  | "integrations"
  | "referrals"
  | "ai";

export type AcademyArticleSection = {
  heading: string;
  body: string;
  bullets?: string[];
  tip?: string;
  href?: string;
  hrefLabel?: string;
};

export type AcademyArticle = {
  slug: string;
  type: "guide" | "blog";
  category: AcademyCategoryId;
  title: string;
  summary: string;
  readingMinutes: number;
  updatedAt: string;
  tags: string[];
  sections: AcademyArticleSection[];
};

export type AcademyFaq = {
  id: string;
  category: AcademyCategoryId;
  question: string;
  answer: string;
  relatedSlugs?: string[];
};

export const ACADEMY_CATEGORIES: Array<{
  id: AcademyCategoryId;
  label: string;
  description: string;
}> = [
  {
    id: "getting-started",
    label: "Getting started",
    description: "First login, workspace setup, and your first search",
  },
  {
    id: "leads",
    label: "Leads & search",
    description: "Lead Finder, scoring, Hot leads, and exports",
  },
  {
    id: "pipeline",
    label: "Pipeline & CRM",
    description: "Statuses, saved leads, and closing deals",
  },
  {
    id: "email",
    label: "Email & outreach",
    description: "SMTP, inbox, replies, and Day 1–3 sequences",
  },
  {
    id: "billing",
    label: "Plans & credits",
    description: "What credits cost and how upgrades work",
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "API, MCP, SSO, and CRM webhooks",
  },
  {
    id: "referrals",
    label: "Referrals",
    description: "Earn cash commission when agencies you refer buy a plan",
  },
  {
    id: "ai",
    label: "AI tools",
    description: "Ask Expert, scripts, and the support assistant",
  },
];

export const ACADEMY_ARTICLES: AcademyArticle[] = [
  {
    slug: "welcome-to-contractor-leads",
    type: "guide",
    category: "getting-started",
    title: "Welcome to Contractor Leads",
    summary:
      "What this product is for, who it serves, and the complete path from signup to your first Hot lead — with every screen explained.",
    readingMinutes: 10,
    updatedAt: "2026-07-23",
    tags: ["onboarding", "overview", "first login"],
    sections: [
      {
        heading: "Who this is for",
        body: "Contractor Leads (LeadFlow USA) is built for marketing agencies, media buyers, appointment setters, and sales teams who sell services to home-service contractors — roofing, HVAC, plumbing, electrical, landscaping, and related trades. You use it to find real businesses, score them, outreach, and track deals.",
        bullets: [
          "Agencies selling SEO, ads, websites, or CRM to contractors",
          "In-house growth teams building local contractor pipelines",
          "SDRs / setters who need a daily call list with context",
        ],
        tip: "This is not a marketplace for homeowners hiring a contractor. Homeowners will not find value here.",
      },
      {
        heading: "What you get in one workspace",
        body: "Live, verified contractor businesses with AI lead scores (Hot / Warm / Nurture), contact signals, outreach angles, and optional enrichment from Google Places, Yelp, and social sources. You search, save, email, map, and move deals through a simple pipeline — without leaving the app for research.",
        bullets: [
          "Lead Finder — industry + geography search that spends credits per lead returned",
          "Hot Leads — highest-score opportunities as your daily dialer list",
          "Saved Leads — your keepers for follow-up",
          "Pipeline CRM — New → Contacted → Qualified → Closed",
          "Lead Map — territory pins (Growth+ plans)",
          "Email inbox — send, receive, and reply via your SMTP",
          "Ask Expert — marketing strategy AI (uses credits)",
          "Academy — this self-serve learning hub",
        ],
      },
      {
        heading: "Main sidebar map",
        body: "After login you land in the app shell. Learn these destinations once:",
        bullets: [
          "Home — credits snapshot, quick links, AI chat history",
          "Lead Finder — run searches",
          "Hot / Saved / Pipeline / Map — work the list",
          "Email inbox — replies and threads",
          "Setup hub — Email, API, CRM webhooks, business profile",
          "Ask Expert + My Scripts + Academy — AI and learning",
          "Workspace settings — teams, billing, security, integrations",
        ],
      },
      {
        heading: "Your first 10 minutes (do this once)",
        body: "Complete these steps in order. After that, your team can sell every day without guessing where things live.",
        bullets: [
          "1. Open Setup hub and mark Email → Business profile as ready",
          "2. Fill company name, services, ICP, and goal on Business profile (AI uses this)",
          "3. Open Lead Finder and run one small search in your best market",
          "4. Open a Hot lead detail page — read score, phone, website, outreach angle",
          "5. Save 3–5 keepers",
          "6. Connect SMTP if you want to email from the app",
          "7. Send one test email to yourself or a known inbox",
        ],
        href: "/setup",
        hrefLabel: "Open Setup hub →",
      },
      {
        heading: "Data integrity rule",
        body: "If a field is empty, enrichment could not confirm it. The product never invents owner names, emails, or social URLs. Blank is honest — treat it as “not verified,” not as a bug.",
        tip: "Prefer phone, website, Google Maps / rating signals that are present. Use Ask Expert only for copy and strategy — not to invent missing contact data.",
      },
      {
        heading: "When to ask admin vs use Academy",
        body: "Use Academy (and the floating support assistant) for how-to and product questions. Contact your site admin only for account suspension, plan assignment, credit top-ups you cannot buy yourself, inbound email webhook secrets, or Google Places API outages on the platform side.",
        href: "/academy",
        hrefLabel: "Stay in Academy →",
      },
    ],
  },
  {
    slug: "setup-hub-complete-walkthrough",
    type: "guide",
    category: "getting-started",
    title: "Setup hub: complete walkthrough",
    summary:
      "Email, API, CRM webhooks, and business profile — what each card means, when it is “Ready,” and the recommended order for agencies.",
    readingMinutes: 9,
    updatedAt: "2026-07-23",
    tags: ["setup", "onboarding", "smtp", "profile"],
    sections: [
      {
        heading: "Open Setup hub",
        body: "Setup hub is the checklist for making the product usable. Each card shows Ready (green) or Needs setup (amber). You can open any card later — nothing is permanent until you save.",
        href: "/setup",
        hrefLabel: "Open Setup hub →",
      },
      {
        heading: "1. Email & SMTP (do this first)",
        body: "Without SMTP you can still search and save leads, but you cannot send outreach or Day 1–3 sequences from the app. Add at least one mailbox (Gmail app password, Outlook, or custom SMTP), then Test connection before live sends.",
        bullets: [
          "Label mailboxes clearly (e.g. “Sales Gmail”, “Setter Outlook”)",
          "Use an app password for Gmail — regular passwords often fail",
          "Keep From name professional — contractors see it",
        ],
        href: "/setup/email",
        hrefLabel: "Open Email & SMTP →",
      },
      {
        heading: "2. Business profile",
        body: "Your company profile personalizes Ask Expert answers and helps the team stay on-message. Fill services you sell, who you sell to (ICP), geography, and primary goal.",
        href: "/settings",
        hrefLabel: "Open Business profile →",
      },
      {
        heading: "3. API · MCP · SSO (Growth+)",
        body: "Only needed if you automate search or plug into external tools. Generate keys here when your plan unlocks API/MCP. Starter and Trial typically keep this locked.",
        href: "/setup/api",
        hrefLabel: "Open API setup →",
      },
      {
        heading: "4. CRM webhooks (Growth+)",
        body: "Push lead.saved and pipeline stage events to Slack, GoHighLevel, Zapier, Make, or HubSpot. Finish email and profile first — most desks need outreach before automation.",
        href: "/setup/crm",
        hrefLabel: "Open CRM webhooks →",
      },
      {
        heading: "Recommended order for most agencies",
        body: "Email → Business profile → (optional) CRM → (optional) API. Skip developer cards until someone on the team owns automation.",
        tip: "If a card stays “Needs setup,” open it and complete the form — the hub status refreshes after a successful save.",
      },
    ],
  },
  {
    slug: "how-to-use-lead-finder",
    type: "guide",
    category: "leads",
    title: "How to use Lead Finder (step by step)",
    summary:
      "Every field on the search form explained: industry, Tier-1 country, location scope, result size, credits, and how to read the results grid.",
    readingMinutes: 12,
    updatedAt: "2026-07-23",
    tags: ["search", "credits", "geography", "lead finder"],
    sections: [
      {
        heading: "Open Lead Finder",
        body: "Go to Lead Finder in the sidebar. This is the only place that generates new leads and spends search credits. Everything else (Hot, Saved, Pipeline, Map) works from leads you already generated or saved.",
        href: "/leads/search",
        hrefLabel: "Open Lead Finder →",
      },
      {
        heading: "Step 1 — Pick an industry / service",
        body: "Choose the contractor trade you sell into (Roofing, HVAC, Plumbing, Electrical, etc.). Match the industry to the offer you actually sell. Searching “General Contractor” when you only sell roofing SEO usually wastes credits on weak ICP fits.",
        tip: "If your niche is thin in a small city, try a related trade or widen geography before switching offers.",
      },
      {
        heading: "Step 2 — Choose a Tier-1 country",
        body: "Supported countries: United States, Canada, United Kingdom, Australia, and New Zealand. Country must match the market you can legally and operationally sell into. Mixing US cities under UK country returns poor or empty results.",
      },
      {
        heading: "Step 3 — Set location scope",
        body: "Two modes:",
        bullets: [
          "Entire country — maximum breadth; good for national offers or first market scans",
          "Specific area — region/state, city, or postal code + radius when you sell locally",
        ],
        tip: "Start local if your case studies are city-based. Use Entire country when you need volume and can dial nationwide.",
      },
      {
        heading: "Step 4 — Result size and credits",
        body: "You can only generate as many leads as your credit balance allows (1.33 credits ≈ 1 lead slot). Unexported leads also count against that limit. Viewing is free; export spends credits. Example: 100 credits ≈ 75 leads — you cannot generate 200 until you export or buy more.",
        bullets: [
          "Credits are spent on returned leads, not on empty curiosity clicks",
          "Re-running the same search again spends credits again — save keepers instead",
          "Out of credits (402) means stop searching until Billing / admin restores balance",
        ],
      },
      {
        heading: "Step 5 — Read the results grid",
        body: "Each row is a business with score tier (Hot / Warm / Nurture), rating signals, and key contacts when available. Open a row for the full detail page before you decide to save or skip.",
        bullets: [
          "Hot — call / email today",
          "Warm — solid follow-up this week",
          "Nurture — keep for later or skip if capacity is low",
        ],
      },
      {
        heading: "When search returns nothing",
        body: "Widen geography, check city spelling, try Entire country, switch to a related industry, or confirm Tier-1 country. Do not burn credits by rapidly retrying the identical empty query.",
        tip: "Platform-side Google Places errors need a site admin to fix GOOGLE_PLACES_API_KEY / billing — Academy cannot unlock that for you.",
      },
      {
        heading: "After a good search",
        body: "Save keepers → open Hot Leads for the daily list → email from detail → move stages in Pipeline. That is the standard desk loop.",
        href: "/leads/hot",
        hrefLabel: "Go to Hot Leads →",
      },
    ],
  },
  {
    slug: "reading-lead-scores-and-enrichment",
    type: "guide",
    category: "leads",
    title: "Reading lead scores and enrichment fields",
    summary:
      "What Hot / Warm / Nurture mean, which fields are verified vs blank, and how to use score + website + rating without guessing.",
    readingMinutes: 9,
    updatedAt: "2026-07-23",
    tags: ["score", "hot", "warm", "enrichment", "yelp"],
    sections: [
      {
        heading: "Score tiers in plain English",
        body: "Every lead gets an AI opportunity score rolled into Hot, Warm, or Nurture. The score is a prioritization tool — not a guarantee the contractor will buy.",
        bullets: [
          "Hot — strongest fit signals; put these first on the dialer",
          "Warm — worth outreach; do not ignore if Hot is thin today",
          "Nurture — lower urgency; park them unless you need volume",
        ],
      },
      {
        heading: "What feeds the score (practical view)",
        body: "Signals typically include business presence, review/rating strength, website quality cues, and opportunity context for your type of offer. Open the lead detail breakdown when available and read the outreach angle before you dial.",
      },
      {
        heading: "Where data comes from",
        body: "Leads are sourced live from Google Places, verified with Yelp where possible, and optionally enriched with LinkedIn, Houzz, Nextdoor, and Facebook/Meta. Enrichment is best-effort.",
        tip: "Blank owner, email, or social fields mean “not verified.” The app never fabricates contact data.",
      },
      {
        heading: "How to work a lead detail page",
        body: "On any lead detail you should:",
        bullets: [
          "Confirm business name, phone, website, and maps link",
          "Read the score tier and outreach angle",
          "Save if it matches ICP",
          "Email or call, then update Pipeline status",
          "Use previous/next to stay inside the current list (Hot / Saved / All)",
        ],
      },
      {
        heading: "Favorites and notes",
        body: "Use favorites for must-call accounts and notes for call outcomes (“left VM”, “booked Tuesday”, “not a fit — commercial only”). Notes keep the next teammate from repeating bad outreach.",
      },
    ],
  },
  {
    slug: "lead-map-and-exports",
    type: "guide",
    category: "leads",
    title: "Lead Map and exports (CSV / Excel)",
    summary:
      "Plan territories with map pins, export dialer files, and know which plan features unlock map and export limits.",
    readingMinutes: 7,
    updatedAt: "2026-07-23",
    tags: ["map", "export", "csv", "excel", "territory"],
    sections: [
      {
        heading: "Lead Map",
        body: "Mapped leads with coordinates or a Google Maps link appear as pins. Filter by quality tier and jump into lead detail from a pin. Map unlocks on Growth and above (not Trial / Starter by default).",
        href: "/leads/map",
        hrefLabel: "Open Lead Map →",
      },
      {
        heading: "When map is locked",
        body: "If you see a lock state, your plan does not include map. Upgrade on Billing or ask an admin to move you to Growth / Agency / Enterprise.",
        href: "/billing",
        hrefLabel: "Open Billing →",
      },
      {
        heading: "Exports",
        body: "Export CSV or Excel from list views when you need a dialer file, client deliverable, or offline review. Exports may be limited by plan — if the action is blocked, check Billing.",
        bullets: [
          "Export after you filter/save — cleaner files, fewer junk rows",
          "Do not treat exports as a substitute for Pipeline — status still lives in-app",
          "Respect client NDAs when sharing contractor contact files",
        ],
      },
      {
        heading: "Desk rhythm with map",
        body: "Search → Hot filter → Map for territory clusters → Save cluster → Email → Pipeline. That loop covers most agency days.",
      },
    ],
  },
  {
    slug: "hot-leads-saved-leads-pipeline",
    type: "guide",
    category: "pipeline",
    title: "Hot leads, Saved leads, and Pipeline CRM",
    summary:
      "How the three lists differ, when to use each, and how to move a contractor from New to Closed without losing context.",
    readingMinutes: 10,
    updatedAt: "2026-07-23",
    tags: ["crm", "status", "saved", "hot", "pipeline"],
    sections: [
      {
        heading: "Three lists, three jobs",
        body: "Confusion here is the #1 reason teams ask admin “where did my lead go?” Memorize the jobs:",
        bullets: [
          "Hot Leads — quality filter: top scores, daily call list",
          "Saved Leads — everything you explicitly kept for follow-up",
          "Pipeline CRM — saved leads organized by deal stage",
        ],
      },
      {
        heading: "Hot Leads",
        body: "A filtered view of top-scoring opportunities from your workspace. Use this as your morning dialer. Opening a Hot lead with ?from=hot keeps sidebar context correct when you navigate previous/next.",
        href: "/leads/hot",
        hrefLabel: "Open Hot Leads →",
      },
      {
        heading: "Saved Leads",
        body: "Anything you save from search or detail lands here. Saving is required before most outreach automation and before reliable pipeline tracking. If you only glance and leave, the lead may not appear in Pipeline later.",
        href: "/leads/saved",
        hrefLabel: "Open Saved Leads →",
      },
      {
        heading: "Pipeline stages (exact meanings)",
        body: "Pipeline CRM uses four stages. Move a lead when reality changes — not when you hope it will.",
        bullets: [
          "New — saved, not contacted yet",
          "Contacted — you emailed or called (sending email can auto-move New → Contacted)",
          "Qualified — real opportunity: meeting booked, budget interest, or clear next step",
          "Closed — won, lost, or finished; keep notes so the outcome is clear",
        ],
        href: "/leads/pipeline",
        hrefLabel: "Open Pipeline →",
      },
      {
        heading: "Lead detail navigation",
        body: "From any list, open a lead for contact cards, notes, favorites, email history, and previous/next within that list. Use notes after every meaningful touch so teammates inherit context.",
      },
      {
        heading: "Suggested weekly cadence",
        body: "Monday: clear New Hot leads. Mid-week: push Contacted → Qualified with follow-ups. Friday: close or recycle stale Qualified cards. Re-search only when the list is genuinely thin — not every day by habit.",
      },
    ],
  },
  {
    slug: "pipeline-playbook-closing-contractors",
    type: "blog",
    category: "pipeline",
    title: "Pipeline playbook: closing contractor deals",
    summary:
      "A practical sales rhythm for agencies — what to say, when to move stages, and how to keep Pipeline honest.",
    readingMinutes: 8,
    updatedAt: "2026-07-23",
    tags: ["playbook", "sales", "crm", "workflow"],
    sections: [
      {
        heading: "Stage New — research before you dial",
        body: "Open the lead, skim website + reviews, note one specific hook (bad mobile site, strong reviews but no ads, missing booking CTA). Save the hook in notes. Then call or email with that hook — never a generic “we do marketing” blast.",
      },
      {
        heading: "Stage Contacted — earn the next step",
        body: "After the first touch, the job is a reply or a booked call — not a 2,000-word pitch. Use Day 2/3 sequence only if you set templates and the lead has not replied. When they reply, stop the sequence and answer in Email inbox.",
      },
      {
        heading: "Stage Qualified — protect the meeting",
        body: "Move here only when there is a clear next step (demo booked, proposal requested, decision-maker confirmed). Put date/time and offer in notes. If the meeting dies, either re-contact with a new angle or Close with a reason.",
      },
      {
        heading: "Stage Closed — win and loss both count",
        body: "Closed is not only “won.” Log losses (“budget”, “in-house”, “not ICP”). That history stops teammates from re-pitching the same dead end next month.",
      },
      {
        heading: "Keep CRM webhooks as a mirror, not the source of truth",
        body: "If you push events to Slack/GHL, still update Pipeline in Contractor Leads. External tools can lag or fail; your in-app stage is what the team should trust.",
        href: "/setup/crm",
        hrefLabel: "CRM webhooks setup →",
      },
    ],
  },
  {
    slug: "email-smtp-inbox-sequences",
    type: "guide",
    category: "email",
    title: "Email: SMTP, inbox, and Day 1–3 sequences",
    summary:
      "Connect mailboxes, send from lead detail, read replies in Email inbox, enroll nurture sequences, and understand why sequences pause.",
    readingMinutes: 12,
    updatedAt: "2026-07-23",
    tags: ["smtp", "inbox", "nurture", "gmail", "outlook"],
    sections: [
      {
        heading: "Connect SMTP",
        body: "Under Setup → Email & SMTP, add Gmail (app password), Outlook, or custom SMTP. You can attach multiple mailboxes and pick which one to send from per lead.",
        bullets: [
          "Gmail: enable 2FA, create an App Password, paste it (not your normal password)",
          "Outlook / Microsoft 365: use SMTP host settings your IT provides",
          "Custom SMTP: host, port, username, password, TLS as required by your provider",
        ],
        href: "/setup/email",
        hrefLabel: "Open Email & SMTP →",
      },
      {
        heading: "Test before live outreach",
        body: "Always Test connection after saving a mailbox. A failed test means outbound will fail too — fix credentials before blasting Hot leads.",
      },
      {
        heading: "Send from a lead",
        body: "Open any lead → Email lead card → choose mailbox → write subject/body → send. Successful first sends can move New leads to Contacted automatically so Pipeline stays honest.",
        tip: "Personalize with one specific observation from the lead detail. Generic templates convert worse on contractors.",
      },
      {
        heading: "Email inbox",
        body: "Received replies appear in Email inbox. Open a thread to read the full conversation and reply from your SMTP mailbox. Unread messages show a badge count in navigation.",
        href: "/inbox",
        hrefLabel: "Open Email inbox →",
      },
      {
        heading: "Why inbox can look empty",
        body: "Inbox only shows inbound replies matched to your leads. You need: SMTP connected, outreach actually sent, and inbound email webhook configured by the platform/admin (INBOUND_EMAIL_SECRET pointing at /api/email/inbound).",
        tip: "If outbound works but replies never appear, it is almost always inbound webhook / provider routing — not a missing “refresh” button.",
      },
      {
        heading: "Day 1–3 sequences",
        body: "On Email & SMTP, edit Day 1 / Day 2 / Day 3 subject + body templates, enable the sequence, then enroll a saved lead. Active sequences pause automatically when a lead replies so you do not send Day 2 after a human conversation starts.",
        bullets: [
          "Day 1 — short intro + specific hook",
          "Day 2 — proof / case snippet + soft CTA",
          "Day 3 — breakup / last nudge",
        ],
      },
      {
        heading: "Email metrics",
        body: "Where available, email dashboards show delivered / received / failed style metrics so you can spot SMTP problems early. Treat spikes in failed sends as a credentials or provider issue — pause enrollment until fixed.",
      },
    ],
  },
  {
    slug: "gmail-app-password-setup",
    type: "guide",
    category: "email",
    title: "Gmail app password setup (detailed)",
    summary:
      "Exact steps to connect a Gmail mailbox safely so Contractor Leads can send without blocking your personal password.",
    readingMinutes: 6,
    updatedAt: "2026-07-23",
    tags: ["gmail", "app password", "smtp", "security"],
    sections: [
      {
        heading: "Why app passwords",
        body: "Google often blocks “less secure” logins. An app password is a 16-character code that lets Contractor Leads SMTP send without storing your real Gmail password.",
      },
      {
        heading: "Steps in Google",
        body: "Do this on the Google account you will send from:",
        bullets: [
          "Turn on 2-Step Verification for the account",
          "Open Google Account → Security → App passwords",
          "Create a mail app password; copy the 16 characters",
          "Paste into Setup → Email & SMTP as the SMTP password",
          "Use your full Gmail address as username",
          "Save and click Test connection",
        ],
        href: "/setup/email",
        hrefLabel: "Open Email & SMTP →",
      },
      {
        heading: "Common Gmail failures",
        body: "Wrong password type (normal password instead of app password), 2FA not enabled, copied password with spaces, or Google temporary lock after too many failed attempts. Wait, regenerate app password, retest.",
      },
      {
        heading: "Sending reputation tip",
        body: "Warm up with small volume. Sudden 100+ cold emails from a brand-new mailbox get filtered. Use contractor-specific subjects and keep Day 1 short.",
      },
    ],
  },
  {
    slug: "plans-credits-billing",
    type: "guide",
    category: "billing",
    title: "Plans, credits, and billing (full breakdown)",
    summary:
      "Credit burn rates, plan ladder (Starter → Growth → Agency → Enterprise), feature unlocks, and what to do when you hit 402.",
    readingMinutes: 10,
    updatedAt: "2026-07-23",
    tags: ["credits", "plans", "upgrade", "billing"],
    sections: [
      {
        heading: "Credit costs",
        body: "Credits power search and AI. Typical costs:",
        bullets: [
          "Lead Finder: capped by credit lead limit; export 1.33 credits per lead",
          "Ask Expert / AI assistant: about 1.59 credits per use",
        ],
        tip: "Product how-tos in Academy and the support bot do not replace Ask Expert for strategy — and they do not burn Ask Expert credits the same way.",
      },
      {
        heading: "Plan ladder and list prices (defaults)",
        body: "Exact prices can be edited by admin, but the product ladder is:",
        bullets: [
          "Starter — 10 free leads on signup, then subscribe (~$19.99/mo) for 1,000 leads/mo; core search & CRM",
          "Growth (~$49/mo) — API, MCP, map, CRM webhooks",
          "Agency (~$99/mo) — teams, SSO, reports, workspaces + Growth features",
          "Enterprise — highest limits; custom pricing",
        ],
        href: "/billing",
        hrefLabel: "Open Billing →",
      },
      {
        heading: "What each plan unlocks (feature map)",
        body: "Remember this when something looks “broken” but is really locked:",
        bullets: [
          "Map: Growth+",
          "API & MCP: Growth+",
          "CRM webhooks: Growth+",
          "SSO, teams, reports, workspaces: Agency+",
        ],
      },
      {
        heading: "API monthly limits (defaults)",
        body: "If you use developer API access, monthly call ceilings scale with plan (approx.): Trial 25 · Starter 100 · Growth 1,500 · Agency 8,000 · Enterprise 50,000. Your Setup → API page shows the live limit.",
      },
      {
        heading: "Team seats (defaults)",
        body: "Trial / Starter / Growth: 1 seat (owner). Agency: up to 5. Enterprise: up to 25. Owner counts as one seat.",
        href: "/team",
        hrefLabel: "Open Users & teams →",
      },
      {
        heading: "Out of credits (402)",
        body: "Upgrade on Billing or ask your admin to top up. Do not keep retrying the same search — it will keep failing and waste time until balance is restored.",
      },
    ],
  },
  {
    slug: "five-mistakes-that-waste-credits",
    type: "blog",
    category: "billing",
    title: "Five mistakes that waste credits",
    summary:
      "Common search and AI habits that burn balance without producing callable leads — and how to fix each one.",
    readingMinutes: 6,
    updatedAt: "2026-07-23",
    tags: ["credits", "tips", "cost control"],
    sections: [
      {
        heading: "1. Huge result counts on the first try",
        body: "Learn the market with a smaller batch, then scale. Oversized pulls burn credits before you validate industry + geo fit.",
      },
      {
        heading: "2. Typo cities and wrong country",
        body: "Confirm Tier-1 country and spelling. Empty results still cost time; repeated retries cost focus and sometimes credits depending on how the run completes.",
      },
      {
        heading: "3. Ignoring Hot / Warm / Nurture",
        body: "Calling every Nurture lead first is expensive in human time. Sort Hot first, then Warm.",
      },
      {
        heading: "4. Re-searching instead of saving",
        body: "Save keepers. Re-running the same search does not improve data quality — it only spends credits.",
      },
      {
        heading: "5. Using Ask Expert for product how-tos",
        body: "Ask Expert costs credits for strategy and copy. Product how-tos belong in Academy or the support bot.",
        href: "/academy",
        hrefLabel: "Back to Academy →",
      },
    ],
  },
  {
    slug: "api-mcp-sso-crm-webhooks",
    type: "guide",
    category: "integrations",
    title: "API, MCP, SSO, and CRM webhooks",
    summary:
      "When to enable developer access, how keys and limits work, and how to push lead events into Slack, GHL, Zapier, or HubSpot.",
    readingMinutes: 9,
    updatedAt: "2026-07-23",
    tags: ["api", "webhooks", "automation", "mcp", "sso"],
    sections: [
      {
        heading: "Who needs this",
        body: "Most sales desks never open API. Use integrations when you automate search, connect AI agents via MCP, or mirror lead events into an external CRM.",
      },
      {
        heading: "API · MCP · SSO",
        body: "On Growth+ plans (subject to admin flags), generate keys and wire REST, MCP, or SSO search into your stack from Setup → API. Store keys like passwords — rotate if leaked.",
        href: "/setup/api",
        hrefLabel: "Open API setup →",
      },
      {
        heading: "CRM webhooks",
        body: "Push lead.saved and pipeline stage events to Slack, GoHighLevel, Zapier, Make, or HubSpot from Setup → CRM webhooks. Confirm the destination URL accepts POST payloads and keep secrets private.",
        href: "/setup/crm",
        hrefLabel: "Open CRM webhooks →",
      },
      {
        heading: "Recommended order",
        body: "Email → Business profile → CRM → API. Finish outreach basics before automation so you are not piping empty processes into Slack.",
        tip: "If a webhook “works in Zapier” but Pipeline looks wrong, fix stages in-app first — webhooks mirror state; they do not replace it.",
        href: "/setup",
        hrefLabel: "Open Setup hub →",
      },
      {
        heading: "Facebook / enrichment integrations",
        body: "Optional Meta and NinjaPear enrichment may be configured at the platform level. LinkedIn discovery uses website + Serper patterns. Blank socials are still normal when enrichment cannot confirm a profile.",
        href: "/facebook-ads",
        hrefLabel: "Open enrichment integrations →",
      },
    ],
  },
  {
    slug: "referral-cash-commission",
    type: "guide",
    category: "referrals",
    title: "Referral program: earn cash, not credits",
    summary:
      "Share your link, understand pending vs paid commission, request withdrawals, and hit milestone bonuses.",
    readingMinutes: 7,
    updatedAt: "2026-07-23",
    tags: ["affiliate", "commission", "withdraw", "paypal"],
    sections: [
      {
        heading: "How attribution works",
        body: "Share your personal referral link from the Referrals page. When an agency signs up with that link, they are attributed to you. Signup alone does not pay cash — it only creates the referral relationship (pending).",
        href: "/referrals",
        hrefLabel: "Open Referrals →",
      },
      {
        heading: "When you earn money",
        body: "Commission pays in cash when the referred agency purchases a paid plan. Amount is a percentage of that plan’s monthly list price (percentage and prices are configurable by admin).",
      },
      {
        heading: "Balance and withdrawals",
        body: "Available balance shows on Referrals. Request PayPal or bank payout above the minimum. Admin marks requests paid or rejected. Rejected amounts return to your balance so you can request again after fixing details.",
      },
      {
        heading: "Milestones",
        body: "Hitting paid-referral milestones can unlock cash bonuses. Progress bars on Referrals show how close you are.",
        tip: "Promote the product to agencies who will actually buy — unpaid signups do not move commission balance.",
      },
    ],
  },
  {
    slug: "ask-expert-vs-support",
    type: "guide",
    category: "ai",
    title: "Ask Expert vs support vs Academy",
    summary:
      "Three help surfaces: Academy for how-to docs, support bot for quick product answers, Ask Expert for paid marketing strategy.",
    readingMinutes: 6,
    updatedAt: "2026-07-23",
    tags: ["ai", "scripts", "support", "academy"],
    sections: [
      {
        heading: "Academy (start here for how-to)",
        body: "Guides, FAQs, and blogs you are reading now. No need to wait on admin for routine product questions. Search by keyword (credits, SMTP, Hot leads, webhooks).",
        href: "/academy",
        hrefLabel: "Academy hub →",
      },
      {
        heading: "Support chat (floating assistant)",
        body: "Quick product navigation help: credits, search errors, setup, blank fields. Not for campaign strategy or long-form copy.",
      },
      {
        heading: "Ask Expert (uses credits)",
        body: "Senior growth / media-buying style answers for offers, ads, funnels, and outreach copy. Personalized with your business profile. Save strong answers under My Scripts.",
        href: "/ask-expert",
        hrefLabel: "Open Ask Expert →",
      },
      {
        heading: "My Scripts",
        body: "Library of saved Ask Expert outputs — ad scripts, email angles, funnel outlines. Reuse instead of regenerating (and re-spending credits).",
        href: "/scripts",
        hrefLabel: "Open My Scripts →",
      },
    ],
  },
  {
    slug: "ask-expert-playbook",
    type: "blog",
    category: "ai",
    title: "Ask Expert playbook: prompts that save credits",
    summary:
      "How to brief Ask Expert so one request produces usable ads, emails, and offers — without burning credits on vague chats.",
    readingMinutes: 7,
    updatedAt: "2026-07-23",
    tags: ["prompts", "copy", "credits", "scripts"],
    sections: [
      {
        heading: "Fill Business profile first",
        body: "Company, services, ICP, and goal make answers specific. Empty profiles produce generic copy you will throw away — after paying credits.",
        href: "/settings",
        hrefLabel: "Open Business profile →",
      },
      {
        heading: "One job per message",
        body: "Ask for one deliverable: “Write a Day 1 cold email for roofing contractors in Dallas who have no booking form.” Multi-topic prompts get muddy answers.",
      },
      {
        heading: "Give constraints",
        body: "Length, tone, offer, CTA, and proof. Example: “80 words, direct, $997 website audit, CTA = book 15-min call.”",
      },
      {
        heading: "Save winners to My Scripts",
        body: "When a reply is good, save it. Iterate from the script later instead of starting from zero.",
        href: "/scripts",
        hrefLabel: "Open My Scripts →",
      },
      {
        heading: "Do not use Ask Expert for",
        body: "“How do I connect SMTP?”, “Why is map locked?”, “What do credits cost?” — those are Academy / support questions and should not spend strategy credits.",
      },
    ],
  },
  {
    slug: "workspace-settings-teams",
    type: "guide",
    category: "getting-started",
    title: "Workspace settings, security, and teams",
    summary:
      "Where profile, security, billing, and Agency-only team seats live — and how to invite people without breaking seat limits.",
    readingMinutes: 7,
    updatedAt: "2026-07-23",
    tags: ["settings", "teams", "security", "workspace"],
    sections: [
      {
        heading: "Workspace settings menu",
        body: "Use the Workspace settings control in the sidebar for Users & teams, Billing, Security, Integrations, and All settings. This is the map when someone says “I can’t find X.”",
      },
      {
        heading: "Business profile",
        body: "Settings holds your company profile used to personalize AI and outreach. Keep services, ICP, and goals filled in and current.",
        href: "/settings",
        hrefLabel: "Open Business profile →",
      },
      {
        heading: "Security",
        body: "Use Security settings for password and account protection habits. Never share SMTP app passwords or API keys in chat or email threads.",
        href: "/settings/security",
        hrefLabel: "Open Security →",
      },
      {
        heading: "Users & teams",
        body: "Team seats unlock on Agency+ plans (defaults: Agency up to 5, Enterprise up to 25; owner counts as 1). Invite members from Users & teams when your plan includes seats.",
        href: "/team",
        hrefLabel: "Open Users & teams →",
      },
      {
        heading: "Light / dark mode",
        body: "Use the moon/sun toggle in the top bar. Preference is saved for your account so every login matches your desk.",
      },
    ],
  },
  {
    slug: "daily-agency-workflow",
    type: "blog",
    category: "getting-started",
    title: "Daily agency workflow (end-to-end)",
    summary:
      "A full-day playbook: morning Hot list, midday outreach, afternoon Pipeline clean-up, and when to search again.",
    readingMinutes: 8,
    updatedAt: "2026-07-23",
    tags: ["workflow", "playbook", "agency", "routine"],
    sections: [
      {
        heading: "Morning (30–45 min) — build the dialer",
        body: "Open Hot Leads. If thin, run one focused Lead Finder search (small batch). Save keepers. Skim map if you sell by territory.",
        bullets: [
          "Hot list first — do not start in Ask Expert",
          "Save before emailing so Pipeline can track",
          "Note one hook per lead before calling",
        ],
      },
      {
        heading: "Midday — outreach block",
        body: "Call / email from lead detail. Use SMTP mailbox. Enroll Day 1–3 only for no-reply leads. Watch Email inbox for replies and answer same day.",
      },
      {
        heading: "Afternoon — Pipeline hygiene",
        body: "Move Contacted → Qualified when meetings book. Close dead deals with reasons. Check webhook destinations only if your ops person owns CRM sync.",
      },
      {
        heading: "End of day — credits check",
        body: "Glance at remaining credits on Home / Billing. Plan tomorrow’s search size so you do not wake up to a 402 mid-campaign.",
        href: "/home",
        hrefLabel: "Open Home →",
      },
    ],
  },
  {
    slug: "troubleshooting-common-errors",
    type: "guide",
    category: "getting-started",
    title: "Troubleshooting: common errors and fixes",
    summary:
      "No leads, credits 402, SMTP failures, empty inbox, locked map/API, blank fields — what each means and what to do.",
    readingMinutes: 9,
    updatedAt: "2026-07-23",
    tags: ["errors", "troubleshooting", "402", "smtp"],
    sections: [
      {
        heading: "No leads found",
        body: "Widen geography, check spelling, try Entire country, switch industry, confirm Tier-1 country. Do not rapid-fire the same empty query.",
        href: "/leads/search",
        hrefLabel: "Open Lead Finder →",
      },
      {
        heading: "Credits / 402 error",
        body: "Balance is empty or too low for the action. Upgrade on Billing or ask admin to top up. Retrying will not invent credits.",
        href: "/billing",
        hrefLabel: "Open Billing →",
      },
      {
        heading: "Google Places / search platform errors",
        body: "If the error mentions Google Places API keys or billing, that is a site-admin configuration issue (GOOGLE_PLACES_API_KEY). Users cannot fix it from Setup hub.",
      },
      {
        heading: "SMTP send failed",
        body: "Retest mailbox. For Gmail, regenerate app password. Check host/port/TLS. Pause sequences until Test connection passes.",
        href: "/setup/email",
        hrefLabel: "Fix Email & SMTP →",
      },
      {
        heading: "Inbox empty but you sent mail",
        body: "Outbound SMTP ≠ inbound routing. Ask admin to confirm inbound webhook (INBOUND_EMAIL_SECRET → /api/email/inbound) and that replies hit that endpoint.",
      },
      {
        heading: "Map / API / teams locked",
        body: "Feature gated by plan. Map/API/CRM = Growth+. Teams/SSO/reports/workspaces = Agency+. Upgrade or ask admin to change plan.",
        href: "/billing",
        hrefLabel: "Compare on Billing →",
      },
      {
        heading: "Blank owner / social fields",
        body: "Not a bug. Enrichment could not verify. Use phone, website, and ratings that are present.",
      },
      {
        heading: "Login / suspended account",
        body: "Check email/password; register at /register if needed. Suspended accounts must contact support / admin — Academy cannot unsuspend.",
      },
    ],
  },
];

export const ACADEMY_FAQS: AcademyFaq[] = [
  {
    id: "what-is-cl",
    category: "getting-started",
    question: "What is Contractor Leads used for?",
    answer:
      "It helps agencies find and work verified home-service contractor prospects — search, score, save, email, and track them in a pipeline. It is not a homeowner hiring marketplace.",
    relatedSlugs: ["welcome-to-contractor-leads"],
  },
  {
    id: "first-steps",
    category: "getting-started",
    question: "I just signed up. What should I do first?",
    answer:
      "Open Setup hub → connect Email & SMTP if you will outreach → fill Business profile → run one small Lead Finder search → save Hot keepers. Full checklist is in the welcome guide and Setup walkthrough.",
    relatedSlugs: [
      "welcome-to-contractor-leads",
      "setup-hub-complete-walkthrough",
      "daily-agency-workflow",
    ],
  },
  {
    id: "where-is-feature",
    category: "getting-started",
    question: "Where do I find Setup, Inbox, Map, or Billing?",
    answer:
      "Sidebar: Lead Finder / Hot / Saved / Pipeline / Map under leads; Email inbox for replies; Setup hub for Email/API/CRM; Workspace settings for Billing, teams, security. Academy search also finds guides by name.",
    relatedSlugs: ["welcome-to-contractor-leads", "workspace-settings-teams"],
  },
  {
    id: "no-leads",
    category: "leads",
    question: "Why did my search return no leads?",
    answer:
      "Widen geography (try Entire country), check city spelling, switch industry, or confirm the Tier-1 country. Empty social fields on a lead are normal and do not mean the search failed.",
    relatedSlugs: ["how-to-use-lead-finder", "troubleshooting-common-errors"],
  },
  {
    id: "credit-cost",
    category: "billing",
    question: "How many credits does a search cost?",
    answer:
      "Lead Finder generation is capped by your remaining credits (and unexported leads already in your account). Viewing is free. Export costs 1.33 credits per lead. Ask Expert uses about 1.59 credits per request. Check Plans & Billing for your balance.",
    relatedSlugs: ["plans-credits-billing", "five-mistakes-that-waste-credits"],
  },
  {
    id: "out-of-credits",
    category: "billing",
    question: "I got a credits / 402 error. What now?",
    answer:
      "Upgrade on Billing or ask an admin to add credits. Retrying the same search will keep failing until balance is restored.",
    relatedSlugs: [
      "plans-credits-billing",
      "five-mistakes-that-waste-credits",
      "troubleshooting-common-errors",
    ],
  },
  {
    id: "plan-features",
    category: "billing",
    question: "Which plan has Map, API, teams, and reports?",
    answer:
      "Map, API, MCP, and CRM webhooks unlock on Growth+. Teams, SSO, reports, and workspaces unlock on Agency+. Trial/Starter stay on core search & pipeline. See the billing guide for the full matrix.",
    relatedSlugs: ["plans-credits-billing"],
  },
  {
    id: "hot-vs-saved",
    category: "pipeline",
    question: "What is the difference between Hot Leads and Saved Leads?",
    answer:
      "Hot Leads is a quality filter for top scores (daily call list). Saved Leads is everything you explicitly saved for follow-up. Pipeline CRM organizes saved leads by status (New → Contacted → Qualified → Closed).",
    relatedSlugs: ["hot-leads-saved-leads-pipeline"],
  },
  {
    id: "pipeline-stages",
    category: "pipeline",
    question: "When should I move a lead to Qualified or Closed?",
    answer:
      "Qualified = real next step (meeting booked, proposal requested). Closed = won or finished/lost — always leave a note with the reason so teammates do not re-pitch dead deals.",
    relatedSlugs: [
      "hot-leads-saved-leads-pipeline",
      "pipeline-playbook-closing-contractors",
    ],
  },
  {
    id: "email-setup",
    category: "email",
    question: "How do I email a lead from the app?",
    answer:
      "Connect SMTP under Setup → Email & SMTP (Gmail app password, Outlook, or custom), Test connection, then open a lead and use the Email lead card. Replies show in Email inbox when inbound email is configured.",
    relatedSlugs: ["email-smtp-inbox-sequences", "gmail-app-password-setup"],
  },
  {
    id: "gmail-steps",
    category: "email",
    question: "Gmail keeps rejecting my password. What do I use?",
    answer:
      "Use a Google App Password after enabling 2-Step Verification — not your normal Gmail password. Paste the 16-character code into SMTP settings and Test connection.",
    relatedSlugs: ["gmail-app-password-setup", "email-smtp-inbox-sequences"],
  },
  {
    id: "inbox-empty",
    category: "email",
    question: "Why is my Email inbox empty?",
    answer:
      "Inbox only shows inbound replies matched to your leads. You need SMTP set up, outreach sent, and the inbound webhook configured so replies can be ingested. Outbound working alone is not enough.",
    relatedSlugs: [
      "email-smtp-inbox-sequences",
      "troubleshooting-common-errors",
    ],
  },
  {
    id: "sequence-paused",
    category: "email",
    question: "Why did my email sequence pause?",
    answer:
      "Sequences pause when a lead replies (inbound email). That protects you from sending Day 2/3 after a conversation starts. Resume or close from enrollment status as needed.",
    relatedSlugs: ["email-smtp-inbox-sequences"],
  },
  {
    id: "fabricated-data",
    category: "leads",
    question: "Why are owner or social fields blank?",
    answer:
      "The product never fabricates data. Blank means enrichment could not verify a value. Use phone, website, or maps links that are present.",
    relatedSlugs: [
      "welcome-to-contractor-leads",
      "reading-lead-scores-and-enrichment",
    ],
  },
  {
    id: "score-meaning",
    category: "leads",
    question: "What do Hot, Warm, and Nurture mean?",
    answer:
      "They are opportunity tiers. Hot = call/email today. Warm = solid follow-up this week. Nurture = lower urgency. Scores prioritize work — they do not guarantee a sale.",
    relatedSlugs: ["reading-lead-scores-and-enrichment", "how-to-use-lead-finder"],
  },
  {
    id: "map-locked",
    category: "leads",
    question: "Lead Map is locked. Why?",
    answer:
      "Map is a Growth+ plan feature. Upgrade on Billing or ask your admin to move you to a plan that includes map access.",
    relatedSlugs: ["lead-map-and-exports", "plans-credits-billing"],
  },
  {
    id: "exports",
    category: "leads",
    question: "Can I export leads to CSV or Excel?",
    answer:
      "Yes from list views when your plan allows it. Filter/save first for cleaner files. Exports complement Pipeline — they do not replace in-app status tracking.",
    relatedSlugs: ["lead-map-and-exports"],
  },
  {
    id: "referral-pay",
    category: "referrals",
    question: "Do referrals pay credits or money?",
    answer:
      "Cash commission when a referred agency buys a paid plan — not signup credits. Signup only attributes the referral (pending). Withdraw from the Referrals page after you have balance.",
    relatedSlugs: ["referral-cash-commission"],
  },
  {
    id: "referral-withdraw",
    category: "referrals",
    question: "How do withdrawals work?",
    answer:
      "Request PayPal or bank payout above the minimum on Referrals. Admin marks paid or rejected; rejected amounts return to your balance.",
    relatedSlugs: ["referral-cash-commission"],
  },
  {
    id: "api-access",
    category: "integrations",
    question: "Where do I get an API key?",
    answer:
      "Setup → API · MCP · SSO on Growth+ plans (subject to admin flags). Generate a key there and respect monthly limits shown on the page. Treat keys like passwords.",
    relatedSlugs: ["api-mcp-sso-crm-webhooks"],
  },
  {
    id: "webhooks",
    category: "integrations",
    question: "How do CRM / Slack webhooks work?",
    answer:
      "From Setup → CRM webhooks, send lead.saved and pipeline stage events to Slack, GHL, Zapier, Make, or HubSpot. Keep Pipeline updated in-app — webhooks mirror state.",
    relatedSlugs: ["api-mcp-sso-crm-webhooks"],
  },
  {
    id: "teams",
    category: "getting-started",
    question: "Can I invite my team?",
    answer:
      "Users & teams unlocks on Agency+ (defaults: Agency up to 5 seats, Enterprise up to 25; owner counts as 1). Use Workspace settings → Users & teams, or open /team.",
    relatedSlugs: ["workspace-settings-teams", "plans-credits-billing"],
  },
  {
    id: "ask-expert-cost",
    category: "ai",
    question: "Does Ask Expert use credits?",
    answer:
      "Yes (~1.59 per use). Use Academy or the support bot for product how-tos. Use Ask Expert for marketing strategy and copy, then save winners to My Scripts.",
    relatedSlugs: ["ask-expert-vs-support", "ask-expert-playbook"],
  },
  {
    id: "scripts",
    category: "ai",
    question: "What are My Scripts?",
    answer:
      "Saved Ask Expert answers — ad scripts, emails, funnel outlines — so you can reuse them without regenerating and re-spending credits.",
    relatedSlugs: ["ask-expert-vs-support", "ask-expert-playbook"],
  },
  {
    id: "dark-mode",
    category: "getting-started",
    question: "How do I switch light / dark mode?",
    answer:
      "Use the moon/sun toggle in the top bar. Theme preference is saved for your account.",
    relatedSlugs: ["workspace-settings-teams"],
  },
  {
    id: "google-places-error",
    category: "leads",
    question: "Search errors mention Google Places. What can I do?",
    answer:
      "That is a platform configuration issue. Your site admin must configure GOOGLE_PLACES_API_KEY with billing enabled. You cannot fix it from agency Setup hub.",
    relatedSlugs: ["troubleshooting-common-errors"],
  },
  {
    id: "who-to-ask",
    category: "getting-started",
    question: "When should I ask admin instead of using Academy?",
    answer:
      "Ask admin for account suspension, plan assignment you cannot buy, credit top-ups, inbound email webhook secrets, and platform API outages. Use Academy for how-to, FAQs, and workflows.",
    relatedSlugs: [
      "welcome-to-contractor-leads",
      "troubleshooting-common-errors",
    ],
  },
];

export function getAcademyArticle(slug: string) {
  return ACADEMY_ARTICLES.find((a) => a.slug === slug) ?? null;
}

export function getArticlesByCategory(category: AcademyCategoryId) {
  return ACADEMY_ARTICLES.filter((a) => a.category === category);
}

export function getFaqsByCategory(category?: AcademyCategoryId) {
  if (!category) return ACADEMY_FAQS;
  return ACADEMY_FAQS.filter((f) => f.category === category);
}

export function categoryLabel(id: AcademyCategoryId) {
  return ACADEMY_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function searchAcademy(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      articles: ACADEMY_ARTICLES,
      faqs: ACADEMY_FAQS,
    };
  }
  const articles = ACADEMY_ARTICLES.filter((a) => {
    const hay = [
      a.title,
      a.summary,
      a.tags.join(" "),
      ...a.sections.map((s) => `${s.heading} ${s.body}`),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
  const faqs = ACADEMY_FAQS.filter((f) =>
    `${f.question} ${f.answer}`.toLowerCase().includes(q),
  );
  return { articles, faqs };
}
