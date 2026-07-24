"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { IconType } from "react-icons";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowTrendingDown,
  HiOutlineArrowUpTray,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlineCreditCard,
  HiOutlineCpuChip,
  HiOutlineEnvelope,
  HiOutlineFire,
  HiOutlineHomeModern,
  HiOutlineKey,
  HiOutlineLink,
  HiOutlineMagnifyingGlass,
  HiOutlineMap,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineUsers,
  HiOutlineUserPlus,
  HiOutlineViewColumns,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { cn, formatCredits } from "@/lib/utils";
import type { SessionUser } from "@/lib/session-user";

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  badge?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: HiOutlineChartBar },
      { href: "/leads/search", label: "Lead Finder", icon: HiOutlineMagnifyingGlass },
      { href: "/leads", label: "All Leads", icon: HiOutlineSquares2X2 },
      { href: "/leads/saved", label: "Saved Leads", icon: HiOutlineStar },
      { href: "/leads/hot", label: "Hot Leads", icon: HiOutlineFire, badge: true },
      { href: "/leads/pipeline", label: "Pipeline CRM", icon: HiOutlineViewColumns },
      { href: "/leads/map", label: "Lead Map", icon: HiOutlineMap },
    ],
  },
  {
    title: "AI Assistant",
    items: [
      { href: "/ask-expert", label: "Ask Contractor Leads", icon: HiOutlineChatBubbleLeftRight },
      { href: "/scripts", label: "My Scripts", icon: HiOutlineBookOpen },
    ],
  },
  {
    title: "Setup",
    items: [
      { href: "/setup", label: "Setup hub", icon: HiOutlineWrenchScrewdriver },
      { href: "/setup/email", label: "Email & SMTP", icon: HiOutlineEnvelope },
      { href: "/setup/api", label: "API · MCP · SSO", icon: HiOutlineKey },
      { href: "/setup/crm", label: "CRM webhooks", icon: HiOutlineLink },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/industries", label: "Industries", icon: HiOutlineHomeModern },
      { href: "/analytics", label: "Analytics", icon: HiOutlineArrowTrendingDown },
      { href: "/ai-tools", label: "AI Tools", icon: HiOutlineCpuChip },
      { href: "/workspaces", label: "Workspaces", icon: HiOutlineUsers },
      { href: "/reports", label: "Client Reports", icon: HiOutlineArrowUpTray },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/referrals", label: "Referrals", icon: HiOutlineUserPlus },
      { href: "/billing", label: "Plans & Billing", icon: HiOutlineCreditCard },
      { href: "/settings", label: "Business profile", icon: HiOutlineCog6Tooth },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/leads") {
    return pathname === "/leads";
  }
  if (href === "/setup") {
    return pathname === "/setup";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-[252px] shrink-0 flex-col border-r border-[#26253c] bg-[#1a1930] shadow-[2px_0_20px_rgba(0,0,0,0.1)]">
      <div className="flex items-center px-6 py-6 border-b border-[#26253c]">
        <p className="text-[15px] font-semibold leading-tight tracking-tight text-white">
          Contractor Leads
        </p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pt-6 pb-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#6c6e8e]">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 text-[13.5px] transition-all duration-200 rounded-xl",
                      active
                        ? "bg-[#7c3aed] text-white font-medium"
                        : "text-[#8f8fb1] hover:bg-[#26253c] hover:text-white font-medium"
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-[#8f8fb1]")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#db2777]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#26253c] p-5">
        <div className="rounded-xl bg-[#26253c] p-4 ring-1 ring-[#3b3a5a]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8f8fb1]">
            Credits Left
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <p className="text-2xl font-bold tabular-nums text-white">
              {formatCredits(user.creditsRemaining)}
            </p>
            <span className="text-xs font-medium text-[#22c03c]">Live</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-transparent border border-[#3b3a5a] px-3 py-2.5 text-[13px] font-medium text-[#8f8fb1] transition hover:bg-[#3b3a5a] hover:text-white"
        >
          <HiOutlineArrowRightOnRectangle className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
