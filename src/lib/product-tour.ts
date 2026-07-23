import {
  HiOutlineAcademicCap,
  HiOutlineBookmark,
  HiOutlineEnvelope,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineViewColumns,
} from "react-icons/hi2";
import type { IconType } from "react-icons";

export type ProductTourStep = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  href?: string;
  hrefLabel?: string;
  icon: IconType;
};

export const PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to your workspace",
    body: "Your workspace is ready. This short tour shows the daily loop agencies use to find and close contractor leads.",
    bullets: [
      "Search markets in Lead Finder",
      "Work Hot leads first",
      "Email, track pipeline, learn in Academy",
    ],
    icon: HiOutlineSparkles,
  },
  {
    id: "lead-finder",
    title: "Lead Finder — find contractors",
    body: "Pick an industry, Tier‑1 country, and location scope. Searching is free (up to 1,000 leads). Unlock a lead for 1.33 credits to see phone, email, and website — or export.",
    bullets: [
      "Entire country for breadth, city/postal for local focus",
      "Scores show Hot / Warm / Nurture",
      "Blank social fields are normal — we never invent data",
    ],
    href: "/leads/search",
    hrefLabel: "Open Lead Finder",
    icon: HiOutlineMagnifyingGlass,
  },
  {
    id: "hot-saved",
    title: "Hot leads & Saved list",
    body: "Hot Leads is your daily dialer — highest scores first. Save keepers so they appear in Saved and Pipeline.",
    bullets: [
      "Call / email Hot leads the same day",
      "Always save before heavy follow-up",
      "Open a lead for phone, website, and outreach angle",
    ],
    href: "/leads/hot",
    hrefLabel: "Open Hot Leads",
    icon: HiOutlineFire,
  },
  {
    id: "pipeline",
    title: "Pipeline CRM",
    body: "Move deals New → Contacted → Qualified → Closed. Sending email can auto-move New to Contacted. Leave notes so your team stays aligned.",
    href: "/leads/pipeline",
    hrefLabel: "Open Pipeline",
    icon: HiOutlineViewColumns,
  },
  {
    id: "email",
    title: "Email & inbox",
    body: "Connect SMTP under Setup, send from a lead, and read replies in Email inbox. Optional Day 1–3 sequences pause when a lead replies.",
    bullets: [
      "Gmail needs an app password",
      "Test the connection before live outreach",
      "Inbox needs inbound webhook for replies",
    ],
    href: "/setup/email",
    hrefLabel: "Connect Email",
    icon: HiOutlineEnvelope,
  },
  {
    id: "academy",
    title: "Academy — learn without asking admin",
    body: "Guides, FAQs, and playbooks cover Lead Finder, credits, SMTP, referrals, and more. Search any topic when you are stuck.",
    href: "/academy",
    hrefLabel: "Open Academy",
    icon: HiOutlineAcademicCap,
  },
  {
    id: "done",
    title: "You’re ready to sell",
    body: "Suggested first hour: run one Lead Finder search → save Hot keepers → connect SMTP → send one test email. Replay this tour anytime from Academy.",
    bullets: [
      "Credits live under Billing",
      "Ask Expert is for marketing copy (uses credits)",
      "Support chat helps with product how‑tos",
    ],
    href: "/leads/search",
    hrefLabel: "Start with Lead Finder",
    icon: HiOutlineBookmark,
  },
];
