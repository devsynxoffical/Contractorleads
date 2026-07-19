"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineBolt,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineBookmark,
  HiOutlineCreditCard,
  HiOutlineSparkles,
  HiOutlineMap,
} from "react-icons/hi2";
import { AiAssistantWorkspace } from "@/components/ai/ai-assistant-workspace";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

type HomeStats = {
  creditsRemaining: number;
  savedCount: number;
  weekLeads: number;
  searchCount: number;
  hotCount: number;
};

export function HomeView({ userName }: { userName?: string | null }) {
  const [stats, setStats] = useState<HomeStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const s = data.stats ?? {};
        const quality = data.qualitySplit ?? {};
        setStats({
          creditsRemaining: s.creditsRemaining ?? 0,
          savedCount: s.savedCount ?? 0,
          weekLeads: s.weekLeads ?? 0,
          searchCount: s.searchCount ?? 0,
          hotCount: quality.hotCount ?? 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const quickLinks = [
    {
      href: "/leads/search",
      label: "Lead Finder",
      desc: "Search Tier‑1 markets",
      icon: HiOutlineMagnifyingGlass,
    },
    {
      href: "/leads/hot",
      label: "Hot leads",
      desc: "Highest scores first",
      icon: HiOutlineFire,
    },
    {
      href: "/leads/saved",
      label: "Saved CRM",
      desc: "Pipeline & notes",
      icon: HiOutlineBookmark,
    },
    {
      href: "/leads/map",
      label: "Lead map",
      desc: "Geo density view",
      icon: HiOutlineMap,
    },
    {
      href: "/ask-expert",
      label: "Ask Expert",
      desc: "Full AI workspace",
      icon: HiOutlineSparkles,
    },
    {
      href: "/billing",
      label: "Credits",
      desc: "Plans & top-ups",
      icon: HiOutlineCreditCard,
    },
  ];

  return (
    <div className="page-pad page-enter">
      <div className="mx-auto w-full max-w-[1100px] space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-600">
              Home
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-[clamp(1.5rem,3vw,1.85rem)] font-semibold tracking-tight text-ink">
              {userName ? `Hey ${userName.split(" ")[0]}` : "Welcome back"}
            </h1>
            <p className="mt-1 text-[14px] text-ink-muted">
              Ask your AI assistant anything — find leads from Lead Finder.
            </p>
          </div>
          <Link
            href="/leads/search"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20"
            style={{ background: LOGO_GRADIENT }}
          >
            <HiOutlineBolt className="h-4 w-4" />
            Open Lead Finder
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Credits left",
              value: stats ? String(Math.round(stats.creditsRemaining * 10) / 10) : "—",
            },
            {
              label: "Leads this week",
              value: stats ? String(stats.weekLeads) : "—",
            },
            {
              label: "Saved leads",
              value: stats ? String(stats.savedCount) : "—",
            },
            {
              label: "Hot in pipeline",
              value: stats ? String(stats.hotCount) : "—",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-white/90 px-4 py-3.5 shadow-[var(--shadow-card)]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                {card.label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] font-semibold tabular-nums text-ink">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <AiAssistantWorkspace userName={userName} compact />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-white/90 p-4 shadow-[var(--shadow-card)] transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{item.label}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
