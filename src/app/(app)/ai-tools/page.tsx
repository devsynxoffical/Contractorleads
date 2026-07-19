import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineEnvelope,
  HiOutlineMegaphone,
  HiOutlineSparkles,
  HiOutlineUserGroup,
} from "react-icons/hi2";

const TOOLS = [
  {
    href: "/ask-expert",
    title: "Ask Contractor Leads",
    desc: "Multi-turn growth expert with your full account + lead context.",
    icon: HiOutlineChatBubbleLeftRight,
  },
  {
    href: "/home",
    title: "Home AI workspace",
    desc: "Compact assistant on Home with chat history.",
    icon: HiOutlineSparkles,
  },
  {
    href: "/scripts",
    title: "My Scripts",
    desc: "Saved outreach emails, SMS, and sales scripts.",
    icon: HiOutlineDocumentText,
  },
  {
    href: "/settings",
    title: "Day 1–3 email automation",
    desc: "SMTP + nurture sequences for scraped lead emails.",
    icon: HiOutlineEnvelope,
  },
  {
    href: "/leads/search",
    title: "AI lead scoring",
    desc: "Hot / Warm / Nurture built into every Lead Finder run.",
    icon: HiOutlineMegaphone,
  },
  {
    href: "/leads/pipeline",
    title: "Pipeline CRM",
    desc: "Move scored leads New → Contacted → Qualified → Closed.",
    icon: HiOutlineUserGroup,
  },
];

export default function AiToolsPage() {
  return (
    <div className="page-pad page-enter space-y-5">
      <PageHeader
        title="AI Tools"
        description="Every AI surface in Contractor Leads — connected to your agency profile and live lead data."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href + t.title} href={t.href} className="block">
              <Card className="h-full transition hover:border-brand-300">
                <CardContent className="flex gap-3 py-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{t.title}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                      {t.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
