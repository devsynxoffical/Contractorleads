/**
 * Free tools (/tools/[slug]). Each works without signing up and answers something an
 * agency searches for before it needs Contractor Leads.
 */
export type ToolSection = { heading: string; body: string; bullets?: string[] };

export type FreeTool = {
  slug: "email-deliverability-checker" | "cold-email-subject-line-tester" | "contractor-lead-cost-calculator";
  name: string;
  h1: string;
  titleTag: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intro: string;
  howTo: string[];
  sections: ToolSection[];
  faqs: Array<{ q: string; a: string }>;
  services: Array<{ href: string; label: string }>;
  guides: Array<{ href: string; label: string }>;
};

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "email-deliverability-checker",
    name: "Email Deliverability Checker",
    h1: "Free SPF, DKIM and DMARC checker",
    titleTag: "Free SPF, DKIM & DMARC Checker for Cold Email",
    metaDescription: "Check SPF, DKIM, DMARC and MX records for any domain in seconds. Free, no sign-up. See what to fix before you send cold email to contractors.",
    primaryKeyword: "spf dkim dmarc checker",
    secondaryKeywords: ["email deliverability checker", "dmarc checker", "spf record checker", "check email authentication"],
    intro: "Enter a domain or email address to check the four DNS records that decide whether your cold emails reach the inbox: SPF, DKIM, DMARC and MX. The check runs live DNS lookups, takes a few seconds and stores nothing.",
    howTo: [
      "Type the domain you send from (or any email address on it).",
      "Press Check domain and wait a few seconds for the live DNS lookups.",
      "Read each result: Pass, Warning, Missing or Could not check.",
      "Copy the suggested record into your DNS host for anything marked Missing, then check again.",
    ],
    sections: [
      {
        heading: "What the results mean",
        body: "Each record does a different job, and inbox providers look at all of them together.",
        bullets: [
          "SPF lists the servers allowed to send for your domain. You need exactly one SPF record.",
          "DKIM signs every email so inboxes can tell it was not changed in transit.",
          "DMARC tells inboxes what to do when SPF or DKIM fail, and where to send reports. Google and Yahoo require it for bulk senders.",
          "MX shows where the domain receives email; a sending domain with no MX looks suspicious to spam filters.",
        ],
      },
      {
        heading: "How to fix common issues",
        body: "Most problems take a few minutes in your DNS settings. If DKIM shows a warning, your email host may use a selector the checker does not test; turn DKIM on in the host's settings and copy the record it gives you. After fixing DNS, warm up a new mailbox slowly before sending at volume: our email warmup guide explains the schedule, and Contractor Leads checks these records for every connected mailbox automatically.",
      },
    ],
    faqs: [
      { q: "Is this SPF, DKIM and DMARC checker free?", a: "Yes. It is free with no sign-up and no limit beyond a few checks per minute to prevent abuse. It only reads public DNS records and does not store the domains you check." },
      { q: "Why does DKIM show a warning when I set it up?", a: "DKIM lives under a selector name that only your email host knows. The checker tests the selectors used by Google Workspace, Microsoft 365, Hostinger and other common hosts. If yours uses a different one, DKIM may still be working; check your host's DNS page to confirm." },
      { q: "Which DMARC policy should I use for cold email?", a: "Start with p=none and a reporting address so you can see who sends as your domain without blocking anything. Once reports show only your own services, move to p=quarantine. Google's sender guidelines require at least p=none for bulk senders." },
      { q: "Do I need these records to send cold email?", a: "Yes. Without SPF and DKIM, Gmail and Outlook treat mail as unauthenticated and are much more likely to send it to spam or reject it. DMARC is required by Google and Yahoo for senders of 5,000 or more messages a day and is good practice for everyone." },
    ],
    services: [
      { href: "/features", label: "Contractor Leads features" },
      { href: "/contractor-email-finder", label: "Contractor email finder" },
    ],
    guides: [
      { href: "/blog/email-warmup-for-cold-email", label: "Email warmup for cold email" },
      { href: "/blog/can-spam-cold-email-contractors", label: "CAN-SPAM checklist" },
    ],
  },
  {
    slug: "cold-email-subject-line-tester",
    name: "Cold Email Subject Line Tester",
    h1: "Free cold email subject line tester",
    titleTag: "Free Cold Email Subject Line Tester",
    metaDescription: "Test a cold email subject line for length, spam-trigger words, caps, punctuation and fake Re: in one click. Free, no sign-up, nothing stored.",
    primaryKeyword: "cold email subject line tester",
    secondaryKeywords: ["subject line tester", "email subject line checker", "spam word checker"],
    intro: "Type a subject line and get an instant score with a checklist of what to change. It checks the things that make cold email look like a mass campaign: length, spam-trigger words, capitals, exclamation marks, emoji and a fake Re: on a first email. It runs in your browser and stores nothing.",
    howTo: [
      "Type or paste your subject line; the score updates as you type.",
      "Fix anything marked with an exclamation mark.",
      "Aim for 80 or more, then test two versions in a small send and keep the one with more replies.",
    ],
    sections: [
      {
        heading: "What the score means",
        body: "The score is a checklist, not a prediction: each passed check adds points. 80 or more means the subject line avoids the common signs of mass marketing. Reply rate still depends most on whether the email is relevant to the person reading it.",
      },
      {
        heading: "How to write subject lines contractors open",
        body: "Short, specific and about them works best: their company, their city or one thing you noticed. Avoid hype words and capitals, and never fake a reply with Re: on a first email. Our guide to cold email subject lines for contractors has examples by trade.",
        bullets: [
          "Quick question about {{company}}'s Google reviews",
          "Roof repair searches in {{city}}",
          "Idea for {{company}}'s storm season",
        ],
      },
    ],
    faqs: [
      { q: "How long should a cold email subject line be?", a: "Between about 15 and 50 characters. Most people read email on a phone, where longer subject lines are cut off, and short lines look more like a message from a person than a campaign." },
      { q: "Do spam words really hurt deliverability?", a: "Modern filters rely mostly on sender reputation and engagement, but hype words like free, guarantee and act now still make an email look like marketing to the reader, which lowers replies and raises spam reports. Removing them costs nothing." },
      { q: "Is it OK to start a cold email subject with Re:?", a: "No. A Re: or Fwd: on a first email implies an earlier conversation that never happened. It misleads the reader and can breach the CAN-SPAM rule against deceptive subject lines." },
    ],
    services: [
      { href: "/features", label: "Outreach tools in Contractor Leads" },
      { href: "/contractor-email-finder", label: "Contractor email finder" },
    ],
    guides: [
      { href: "/blog/cold-email-subject-lines-for-contractors", label: "Subject lines for contractors" },
      { href: "/blog/cold-email-follow-up", label: "Cold email follow-up guide" },
    ],
  },
  {
    slug: "contractor-lead-cost-calculator",
    name: "Contractor Lead Cost Calculator",
    h1: "Free contractor lead cost and ROI calculator",
    titleTag: "Contractor Lead Cost & ROI Calculator (Free)",
    metaDescription: "Work out cost per lead, cost per job won and ROI for any contractor marketing channel. Free calculator for agencies and contractors, no sign-up.",
    primaryKeyword: "contractor lead cost calculator",
    secondaryKeywords: ["cost per lead calculator", "contractor marketing roi calculator", "cost per job calculator"],
    intro: "Enter a contractor's monthly marketing spend, leads, close rate, average job value and margin to see cost per lead, cost per job won, gross profit and return on spend. Agencies use it on sales calls to show what a channel is really worth; contractors use it to compare lead sources.",
    howTo: [
      "Enter the monthly spend for one channel (ads, lead vendor or agency retainer).",
      "Enter how many leads it produced and the share that became jobs.",
      "Add the average job value and gross margin.",
      "Read cost per job and the break-even close rate: the channel pays for itself above that rate.",
    ],
    sections: [
      {
        heading: "What the results mean",
        body: "Cost per lead is what most vendors quote, but cost per job won is what matters: a cheap lead that never closes is expensive. Return on spend uses gross profit, not revenue, so it shows whether the channel actually makes money. The break-even close rate is the lowest close rate at which the spend pays for itself.",
      },
      {
        heading: "How agencies use it",
        body: "Run the contractor's current lead source through the calculator, then the channel you are proposing, using the same job value and margin. The difference in cost per job won is the clearest pitch you can make. Our guide to what contractor leads cost has typical ranges by channel, and pay-per-lead pricing is explained in its own guide.",
      },
    ],
    faqs: [
      { q: "What is a good cost per lead for contractors?", a: "It depends on the trade and job size: high-ticket trades such as roofing and solar can afford far more per lead than handyman work. Judge a channel by cost per job won against the gross profit per job rather than by cost per lead alone." },
      { q: "Why use gross margin instead of revenue?", a: "Revenue includes materials and labour. Return on spend should compare marketing cost with the profit the jobs leave after those costs; otherwise a channel can look profitable while losing money." },
      { q: "Is anything I enter saved?", a: "No. The calculator runs in your browser and nothing you type is sent or stored." },
    ],
    services: [
      { href: "/contractor-lead-generation-software", label: "Contractor lead generation software" },
      { href: "/pricing", label: "Contractor Leads pricing" },
    ],
    guides: [
      { href: "/blog/how-much-do-contractor-leads-cost", label: "How much contractor leads cost" },
      { href: "/blog/pay-per-lead-for-contractors", label: "Pay-per-lead for contractors" },
    ],
  },
];

export function getFreeTool(slug: string): FreeTool | undefined {
  return FREE_TOOLS.find((t) => t.slug === slug);
}
