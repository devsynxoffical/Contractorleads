"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineBolt,
  HiOutlineSun,
} from "react-icons/hi2";
import { AiAssistantWorkspace } from "@/components/ai/ai-assistant-workspace";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import {
  CREDITS_CHANGED_EVENT,
  type CreditsChangedDetail,
} from "@/lib/client/credits-sync";

type HomeStats = {
  creditsRemaining: number;
  savedCount: number;
  weekLeads: number;
  searchCount: number;
  hotCount: number;
};

type DigestPreview = {
  leadCount: number;
  emailReady: boolean;
  totalActionable: number;
};

export function HomeView({ userName }: { userName?: string | null }) {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [digestPreview, setDigestPreview] = useState<DigestPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    function loadStats() {
      fetch("/api/dashboard/stats", { cache: "no-store" })
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
    }
    loadStats();
    function onCreditsChanged(event: Event) {
      const detail = (event as CustomEvent<CreditsChangedDetail>).detail;
      if (typeof detail?.creditsRemaining === "number") {
        setStats((prev) =>
          prev
            ? { ...prev, creditsRemaining: detail.creditsRemaining! }
            : prev,
        );
      }
      loadStats();
    }
    function onVisibility() {
      if (document.visibilityState === "visible") loadStats();
    }
    window.addEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/digest")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.digest) return;
        setDigestPreview({
          leadCount: data.digest.leads?.length ?? 0,
          emailReady: Boolean(data.digest.emailReady),
          totalActionable: data.digest.totalActionable ?? 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
          <div className="flex flex-wrap gap-2">
            <Link
              href="/digest"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] font-semibold text-amber-900 shadow-sm transition hover:border-amber-300 hover:bg-amber-100/80"
            >
              <HiOutlineSun className="h-4 w-4" />
              Morning digest
              {digestPreview && digestPreview.leadCount > 0 && (
                <span className="rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[11px] tabular-nums">
                  {digestPreview.leadCount}
                </span>
              )}
            </Link>
            <Link
              href="/leads/search"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-fuchsia-500/20"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlineBolt className="h-4 w-4" />
              Open Lead Finder
            </Link>
          </div>
        </div>

        {digestPreview && digestPreview.leadCount > 0 && (
          <Link
            href="/digest"
            className="group block rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/60 p-4 shadow-[var(--shadow-card)] transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition group-hover:scale-105">
                  <HiOutlineSun className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    {digestPreview.leadCount} lead{digestPreview.leadCount === 1 ? "" : "s"} ready for outreach
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">
                    {digestPreview.emailReady
                      ? "Email connected — open your morning digest to review and send intros."
                      : "Connect email in setup, then work through today's top picks."}
                    {digestPreview.totalActionable > digestPreview.leadCount &&
                      ` · ${digestPreview.totalActionable} total in queue`}
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-semibold text-brand-600 group-hover:underline">
                Open digest →
              </span>
            </div>
          </Link>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Credits left",
              value: stats ? String(Math.round(stats.creditsRemaining * 10) / 10) : "—",
              href: "/billing",
            },
            {
              label: "Leads this week",
              value: stats ? String(stats.weekLeads) : "—",
              href: "/leads?when=week",
            },
            {
              label: "Saved leads",
              value: stats ? String(stats.savedCount) : "—",
              href: "/leads/saved",
            },
            {
              label: "Hot in pipeline",
              value: stats ? String(stats.hotCount) : "—",
              href: "/leads/hot",
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-border bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)] transition hover:border-brand-200 hover:shadow-md"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                {card.label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-[26px] font-semibold tabular-nums text-ink">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">
                View →
              </p>
            </Link>
          ))}
        </div>

        <AiAssistantWorkspace userName={userName} compact />
      </div>
    </div>
  );
}
