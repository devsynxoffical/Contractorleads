import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageHeader,
  PrimaryActionLink,
  LOGO_GRADIENT,
} from "@/components/layout/page-header";
import { SectionLabel } from "@/components/ui/section";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
} from "react-icons/hi2";

export function PlaceholderPage({
  title,
  description,
  module,
  features = [],
}: {
  title: string;
  description: string;
  module?: string;
  features?: string[];
}) {
  const defaults = features.length
    ? features
    : [
        "UI shell and navigation are live now",
        "Backend integrations unlock in the next release",
        "Lead Finder + Ask Expert work today once API keys are set",
      ];

  return (
    <div className="page-pad page-enter">
      <div className="mesh-bg -mx-4 -mt-4 mb-6 rounded-b-2xl px-4 pb-6 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <PageHeader
          title={title}
          description={description}
          actions={
            <PrimaryActionLink href="/leads/search">
              <HiOutlineSparkles className="h-4 w-4" />
              Generate Leads
            </PrimaryActionLink>
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="animate-slide-left overflow-hidden border-border shadow-[var(--shadow-card)]">
          <div className="px-6 py-6 text-white" style={{ background: LOGO_GRADIENT }}>
            <SectionLabel className="text-white/70">Roadmap</SectionLabel>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
              Coming in the next release
            </h2>
            <p className="mt-2 max-w-lg text-[14px] text-white/90">
              This module is wired in navigation and unlocks once backend
              integrations are connected
              {module ? ` (${module})` : ""}.
            </p>
          </div>
          <CardContent className="space-y-4 py-6">
            <ul className="stagger space-y-3">
              {defaults.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border bg-[#faf8fb] px-3 py-2.5 text-sm text-ink-muted"
                >
                  <HiOutlineClock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="inline-flex text-[13px] font-semibold text-brand-600 hover:underline"
            >
              Back to Business Insights →
            </Link>
          </CardContent>
        </Card>

        <div className="animate-slide-right space-y-3">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            Use these now
          </p>
          {[
            {
              href: "/leads/search",
              icon: HiOutlineMagnifyingGlass,
              label: "Lead Finder",
              hint: "Search verified contractors",
            },
            {
              href: "/leads/hot",
              icon: HiOutlineFire,
              label: "Hot Leads",
              hint: "Highest AI scores first",
            },
            {
              href: "/ask-expert",
              icon: HiOutlineChatBubbleLeftRight,
              label: "Ask Expert",
              hint: "Scripts, offers & funnels",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Card className="hover-lift border-border shadow-[var(--shadow-card)]">
                <CardContent className="flex items-center gap-3 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <p className="text-[12px] text-ink-muted">{item.hint}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
