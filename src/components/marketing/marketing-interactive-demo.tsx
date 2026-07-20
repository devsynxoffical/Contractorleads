"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IconType } from "react-icons";
import {
  HiOutlineArrowRight,
  HiOutlineBell,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineChevronRight,
  HiOutlineCog6Tooth,
  HiOutlineDocumentArrowDown,
  HiOutlineFire,
  HiOutlineHome,
  HiOutlineLink,
  HiOutlineLockClosed,
  HiOutlineMagnifyingGlass,
  HiOutlineMap,
  HiOutlineMegaphone,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineSquares2X2,
  HiOutlineStar,
  HiOutlineUserCircle,
  HiOutlineViewColumns,
  HiOutlineXMark,
} from "react-icons/hi2";
import { LEAD_STATUSES } from "@/lib/constants";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { Reveal } from "./marketing-ui";

type DemoTab = "dashboard" | "pipeline" | "search" | "ai";

type DemoCard = {
  id: string;
  name: string;
  city: string;
  score: number;
  tier: "Hot" | "Warm";
  status: string;
};

type GateCopy = {
  title: string;
  body: string;
  bullets: string[];
};

const GATE: Record<string, GateCopy> = {
  home: {
    title: "Home workspace",
    body: "Your AI assistant, quick search, and daily briefing live on Home — available after you sign in.",
    bullets: ["Multi-turn AI chat", "One-click lead search", "Saved context from onboarding"],
  },
  "all-leads": {
    title: "All leads",
    body: "Browse every lead you’ve generated, filter by score, and open full enrichment in one list.",
    bullets: ["Sort by AI score", "Bulk actions", "Export-ready rows"],
  },
  saved: {
    title: "Saved leads",
    body: "Bookmark high-intent businesses and sync them to your pipeline without re-searching.",
    bullets: ["Star from search", "Owner + phone enrichment", "Pipeline sync"],
  },
  hot: {
    title: "Hot leads",
    body: "Hot tier leads surface automatically so your team dials the highest-opportunity accounts first.",
    bullets: ["AI Hot / Warm / Nurture", "Live score updates", "Priority queue"],
  },
  map: {
    title: "Lead map",
    body: "See pipeline density by metro on an interactive map — spot underserved ZIPs at a glance.",
    bullets: ["World + US HUD", "Geo filters", "Territory planning"],
  },
  scripts: {
    title: "My scripts",
    body: "Save outreach templates and reuse them across leads from Outreach Studio.",
    bullets: ["Email + SMS scripts", "Per-lead personalization", "Version history"],
  },
  meta: {
    title: "Meta ads intel",
    body: "Check the Facebook Ads Library before you pitch — know if they’re already spending.",
    bullets: ["Ad creative snapshots", "Spend signals", "Competitive angles"],
  },
  outreach: {
    title: "Outreach studio",
    body: "Generate cold email, SMS, follow-ups, and call scripts per lead in one click.",
    bullets: ["AI-written copy", "Your SMTP send", "Lead-aware context"],
  },
  integrations: {
    title: "Integrations",
    body: "Connect HubSpot, Zapier, Stripe billing, and more from your workspace settings.",
    bullets: ["CRM sync", "Automation hooks", "Team workflows"],
  },
  settings: {
    title: "Settings",
    body: "Company profile, ICP, SMTP, team seats, and notification preferences.",
    bullets: ["Business context for AI", "Email delivery", "Security"],
  },
  reports: {
    title: "Reports",
    body: "Shareable pipeline snapshots and export summaries for clients.",
    bullets: ["PDF-ready views", "Closed vs open", "Credit usage"],
  },
  billing: {
    title: "Billing & credits",
    body: "Upgrade plans, top up credits, and manage subscription from one place.",
    bullets: ["Transparent credit costs", "Stripe checkout", "Instant top-ups"],
  },
  search: {
    title: "Global search",
    body: "Search leads, deals, and activity across your entire workspace.",
    bullets: ["Instant results", "Keyboard shortcuts", "Deep links"],
  },
  notifications: {
    title: "Notifications",
    body: "Get alerted when searches finish, hot leads appear, or exports are ready.",
    bullets: ["In-app feed", "Email digests", "Team mentions"],
  },
  account: {
    title: "Your account",
    body: "Profile, password, API keys, and team management require a signed-in session.",
    bullets: ["Secure login", "Team invites", "Session control"],
  },
  export: {
    title: "Export leads",
    body: "Download CSV or Excel with full enrichment for your CRM or dialer.",
    bullets: ["CSV + Excel", "Custom columns", "One-click from pipeline"],
  },
  "add-deal": {
    title: "Add to pipeline",
    body: "Create deals from saved leads and track them through Closed.",
    bullets: ["Kanban CRM", "Status history", "Notes per stage"],
  },
  "lead-detail": {
    title: "Lead detail & enrichment",
    body: "Owner name, phone, website scores, PPC/SEO opportunity, and Meta intel on every business.",
    bullets: ["Decision-maker data", "0–100 opportunity scores", "Outreach in one click"],
  },
  "save-lead": {
    title: "Save lead",
    body: "Save to your account to unlock enrichment, outreach, and pipeline moves on real data.",
    bullets: ["Uses search credits", "Persistent CRM record", "Hot tier tracking"],
  },
  "ai-send": {
    title: "Unlimited AI assistant",
    body: "Ask follow-ups, generate funnels, and save chat history with your business context baked in.",
    bullets: ["Multi-turn chat", "Saved history", "Outreach + strategy"],
  },
};

const INITIAL_CARDS: DemoCard[] = [
  { id: "summit", name: "Summit Roofing Co", city: "Austin, TX", score: 92, tier: "Hot", status: "new" },
  { id: "arctic", name: "Arctic Air HVAC", city: "Phoenix, AZ", score: 74, tier: "Warm", status: "new" },
  { id: "vista", name: "Vista Plumbing", city: "Denver, CO", score: 88, tier: "Hot", status: "contacted" },
  { id: "elite", name: "Elite Electric LLC", city: "Miami, FL", score: 91, tier: "Hot", status: "qualified" },
];

const BOTTOM_TABS: { id: DemoTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "pipeline", label: "Pipeline CRM" },
  { id: "search", label: "Lead Finder" },
  { id: "ai", label: "AI Assistant" },
];

type NavEntry =
  | { kind: "tab"; tab: DemoTab; label: string; icon: IconType; badge?: boolean }
  | { kind: "gate"; gate: string; label: string; icon: IconType; badge?: boolean };

const NAV_SECTIONS: { title: string; items: NavEntry[] }[] = [
  {
    title: "Main",
    items: [
      { kind: "gate", gate: "home", label: "Home", icon: HiOutlineHome },
      { kind: "tab", tab: "dashboard", label: "Dashboard", icon: HiOutlineChartBar },
      { kind: "tab", tab: "search", label: "Lead Finder", icon: HiOutlineMagnifyingGlass },
      { kind: "gate", gate: "all-leads", label: "All Leads", icon: HiOutlineSquares2X2 },
      { kind: "gate", gate: "saved", label: "Saved Leads", icon: HiOutlineStar },
      { kind: "gate", gate: "hot", label: "Hot Leads", icon: HiOutlineFire, badge: true },
      { kind: "tab", tab: "pipeline", label: "Pipeline CRM", icon: HiOutlineViewColumns },
      { kind: "gate", gate: "map", label: "Lead Map", icon: HiOutlineMap },
    ],
  },
  {
    title: "AI Assistant",
    items: [
      { kind: "tab", tab: "ai", label: "Ask Contractor Leads", icon: HiOutlineChatBubbleLeftRight },
      { kind: "gate", gate: "scripts", label: "My Scripts", icon: HiOutlineBookOpen },
    ],
  },
  {
    title: "Platform",
    items: [
      { kind: "gate", gate: "outreach", label: "Outreach Studio", icon: HiOutlineMegaphone },
      { kind: "gate", gate: "meta", label: "Meta Ads Intel", icon: HiOutlineSparkles },
      { kind: "gate", gate: "integrations", label: "Integrations", icon: HiOutlineLink },
      { kind: "gate", gate: "reports", label: "Reports", icon: HiOutlineDocumentArrowDown },
      { kind: "gate", gate: "settings", label: "Settings", icon: HiOutlineCog6Tooth },
    ],
  },
];

type TourStep = {
  id: string;
  tab: DemoTab;
  title: string;
  body: string;
  anchor: string;
  advanceOn?: "drag-summit-contacted" | "search-run";
};

const TOUR: TourStep[] = [
  {
    id: "welcome",
    tab: "dashboard",
    title: "Your contractor command center",
    body: "Credits, hot leads, searches, and closed deals — the same live dashboard you get after sign-up. Try sidebar items; locked areas prompt you to log in.",
    anchor: "header",
  },
  {
    id: "pipeline",
    tab: "pipeline",
    title: "Pipeline CRM",
    body: "Drag cards across New → Contacted → Qualified → Closed. Click a card to see what full lead detail unlocks after login.",
    anchor: "pipeline-board",
  },
  {
    id: "drag",
    tab: "pipeline",
    title: "Try dragging a lead",
    body: "Move Summit Roofing Co to Contacted — same motion as your real Kanban board.",
    anchor: "card-summit",
    advanceOn: "drag-summit-contacted",
  },
  {
    id: "search",
    tab: "search",
    title: "Lead Finder",
    body: "Google Places by trade, city, and radius. Results include AI scores; save or open detail requires an account.",
    anchor: "search-panel",
  },
  {
    id: "run-search",
    tab: "search",
    title: "Run a sample search",
    body: "Click Search to load sample businesses. Then try Save or open a row.",
    anchor: "search-btn",
    advanceOn: "search-run",
  },
  {
    id: "ai",
    tab: "ai",
    title: "AI Assistant",
    body: "Preview a reply below. Send a new message to see how unlimited chat works after sign-up.",
    anchor: "ai-panel",
  },
  {
    id: "finish",
    tab: "dashboard",
    title: "Ready for real leads?",
    body: "Create a free account — 20 credits, no card required.",
    anchor: "header",
  },
];

const SEARCH_RESULTS = [
  { name: "Bright Spark Electric", city: "Tampa, FL", score: 89, tier: "Hot" as const },
  { name: "Coastal HVAC Pros", city: "Jacksonville, FL", score: 76, tier: "Warm" as const },
  { name: "Premier Roof Systems", city: "Orlando, FL", score: 94, tier: "Hot" as const },
];

const ACTIVITY = [
  { t: "2m ago", msg: "Lead Finder returned 24 roofing businesses in Tampa" },
  { t: "18m ago", msg: "Summit Roofing Co scored Hot (92)" },
  { t: "1h ago", msg: "Export ready — 48 leads CSV" },
];

function tierClass(tier: "Hot" | "Warm") {
  return tier === "Hot" ? "bg-pink-100 text-pink-700" : "bg-violet-100 text-violet-700";
}

function DemoGateModal({
  copy,
  onClose,
}: {
  copy: GateCopy;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-gate-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-white/10 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.35)]"
      >
        <div className="h-1.5 w-full" style={{ background: LOGO_GRADIENT }} aria-hidden />
        <div className="p-6 sm:p-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <HiOutlineLockClosed className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fuchsia-600">
            Sign in to unlock
          </p>
          <h2
            id="demo-gate-title"
            className="mt-1 pr-8 font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight text-slate-900"
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{copy.body}</p>
          <ul className="mt-4 space-y-2">
            {copy.bullets.map((line) => (
              <li key={line} className="flex items-start gap-2 text-[13px] text-slate-600">
                <HiOutlineCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link
              href="/login"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-[14px] font-semibold text-white"
              style={{ background: LOGO_GRADIENT }}
            >
              Start free trial
            </Link>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2 text-[13px] font-medium text-slate-500 hover:text-slate-800"
          >
            Continue exploring demo
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function MarketingInteractiveDemo() {
  const shellRef = useRef<HTMLDivElement>(null);
  const cardDragMovedRef = useRef(false);
  const [tab, setTab] = useState<DemoTab>("dashboard");
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [tourOpen, setTourOpen] = useState(true);
  const [searchRan, setSearchRan] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [gateCopy, setGateCopy] = useState<GateCopy | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [aiDraft, setAiDraft] = useState("");

  const step = TOUR[tourIndex];
  const tourActive = tourOpen && !!step;
  const viewTab = tourActive ? step.tab : tab;

  const openGate = useCallback((key: keyof typeof GATE | string) => {
    const copy = GATE[key];
    if (copy) setGateCopy(copy);
  }, []);

  const updateTooltip = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tourActive || !step) {
      setTooltipPos(null);
      return;
    }
    const target = shell.querySelector<HTMLElement>(`[data-demo="${step.anchor}"]`);
    if (!target) {
      setTooltipPos({ top: 24, left: 24 });
      return;
    }
    const shellRect = shell.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const pad = 12;
    let top = rect.bottom - shellRect.top + pad;
    let left = rect.left - shellRect.left + rect.width / 2 - 170;
    left = Math.max(pad, Math.min(left, shell.clientWidth - 340 - pad));
    top = Math.min(top, shell.clientHeight - 220);
    setTooltipPos({ top, left });
  }, [step, tourActive]);

  useEffect(() => {
    updateTooltip();
    window.addEventListener("resize", updateTooltip);
    const t = window.setTimeout(updateTooltip, 120);
    return () => {
      window.removeEventListener("resize", updateTooltip);
      window.clearTimeout(t);
    };
  }, [updateTooltip, viewTab, tourIndex, cards, searchRan, searchLoading]);

  useEffect(() => {
    if (!gateCopy) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGateCopy(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gateCopy]);

  const columns = useMemo(
    () =>
      LEAD_STATUSES.map((s) => ({
        ...s,
        items: cards.filter((c) => c.status === s.value),
      })),
    [cards],
  );

  function goNext() {
    if (tourIndex >= TOUR.length - 1) {
      setTourOpen(false);
      setTab(step.tab);
      return;
    }
    const next = tourIndex + 1;
    setTourIndex(next);
    setTab(TOUR[next].tab);
  }

  function selectTab(next: DemoTab) {
    setTab(next);
    if (tourOpen) {
      const idx = TOUR.findIndex((s) => s.tab === next);
      if (idx >= 0) setTourIndex(idx);
    }
  }

  function onNav(entry: NavEntry) {
    if (entry.kind === "tab") selectTab(entry.tab);
    else openGate(entry.gate);
  }

  function moveCard(id: string, status: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    if (
      tourActive &&
      step?.advanceOn === "drag-summit-contacted" &&
      id === "summit" &&
      status === "contacted"
    ) {
      window.setTimeout(() => setTourIndex((i) => i + 1), 400);
    }
  }

  function runSampleSearch() {
    if (searchLoading) return;
    setSearchLoading(true);
    setSearchRan(false);
    window.setTimeout(() => {
      setSearchLoading(false);
      setSearchRan(true);
      if (tourActive && step?.advanceOn === "search-run") {
        window.setTimeout(() => setTourIndex((i) => i + 1), 500);
      }
    }, 900);
  }

  function sendAi() {
    if (!aiDraft.trim()) return;
    openGate("ai-send");
    setAiDraft("");
  }

  return (
    <section
      id="interactive-demo"
      className="relative overflow-hidden bg-[#04050c] px-4 pb-10 pt-5 sm:px-6 sm:pb-12 lg:px-8"
      aria-label="Interactive product demo"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[min(720px,100%)] -translate-x-1/2 opacity-45 blur-[80px]"
        style={{ background: LOGO_GRADIENT }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[920px]">
        <Reveal variant="up" y={20}>
          <div className="mb-4 text-center sm:mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/90">
              Live product preview
            </p>
            <h2 className="mt-1.5 font-[family-name:var(--font-display)] text-[clamp(1.15rem,2.6vw,1.65rem)] font-semibold tracking-tight text-white">
              Try the platform — locked features invite you to sign in
            </h2>
            <p className="mx-auto mt-1.5 max-w-lg text-[13px] leading-relaxed text-white/55">
              Drag pipeline cards, run a sample search, and explore the sidebar. Anything that needs
              real data opens a login prompt.
            </p>
          </div>
        </Reveal>

        <Reveal variant="scale" delay={0.12}>
        <div
          ref={shellRef}
          className="relative overflow-hidden rounded-[18px] border border-white/15 bg-[#ece9f2] shadow-[0_28px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:rounded-[22px]"
        >
          <div className="flex items-center gap-2 border-b border-slate-200/80 bg-[#faf8fb] px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="mx-auto truncate text-[11px] font-medium text-slate-400">
              app.contractorleads.us — interactive demo
            </span>
          </div>

          <div className="flex min-h-[360px] max-h-[min(68vh,480px)] lg:min-h-[400px]">
            <aside className="hidden w-[188px] shrink-0 flex-col border-r border-slate-200/90 bg-[#faf8fb] lg:flex">
              <div className="flex items-center gap-2 border-b border-slate-200/80 px-3 py-2.5">
                <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
                <span className="text-[12px] font-semibold text-slate-800">Contractor Leads</span>
              </div>
              <nav className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-1.5 py-3">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((entry) => {
                        const Icon = entry.icon;
                        const active =
                          entry.kind === "tab" && viewTab === entry.tab;
                        const locked = entry.kind === "gate";
                        return (
                          <button
                            key={entry.label}
                            type="button"
                            onClick={() => onNav(entry)}
                            className={cn(
                              "group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition",
                              active
                                ? "bg-gradient-to-r from-fuchsia-100 to-violet-100 text-violet-900 shadow-sm"
                                : "text-slate-600 hover:bg-white hover:text-slate-900",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-[18px] w-[18px] shrink-0",
                                active ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600",
                              )}
                            />
                            <span className="flex-1 truncate">{entry.label}</span>
                            {entry.badge && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500 shadow-[0_0_6px_#d946ef]" />
                            )}
                            {locked && (
                              <HiOutlineLockClosed className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-violet-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="border-t border-slate-200/80 p-3">
                <button
                  type="button"
                  onClick={() => openGate("billing")}
                  className="w-full rounded-2xl bg-gradient-to-br from-[#fcf2f8] via-white to-[#f3eef8] p-3 text-left ring-1 ring-violet-100"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Credits
                  </p>
                  <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-violet-800">
                    18.40
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-violet-600">Upgrade plan →</p>
                </button>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-[#f4f2f7]">
              <header
                data-demo="header"
                className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur-sm sm:px-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h2 className="truncate text-[14px] font-semibold text-slate-900">
                    {viewTab === "dashboard" && "Dashboard"}
                    {viewTab === "pipeline" && "Pipeline CRM"}
                    {viewTab === "search" && "Lead Finder"}
                    {viewTab === "ai" && "AI Assistant"}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Interactive
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openGate("search")}
                  className="hidden min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-[#faf8fb] px-3 py-2 text-left text-[12px] text-slate-400 sm:flex lg:max-w-xs"
                >
                  <HiOutlineMagnifyingGlass className="h-4 w-4 shrink-0" />
                  Search leads, deals…
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openGate("notifications")}
                    className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Notifications"
                  >
                    <HiOutlineBell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-fuchsia-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openGate("account")}
                    className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100"
                    aria-label="Account"
                  >
                    <HiOutlineUserCircle className="h-6 w-6" />
                  </button>
                  <Link
                    href="/register"
                    className="hidden rounded-xl px-3 py-2 text-[12px] font-semibold text-white sm:inline-flex"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    Start free trial
                  </Link>
                </div>
              </header>

              {viewTab === "pipeline" && (
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 bg-white/70 px-4 py-2 sm:px-5">
                  <button
                    type="button"
                    onClick={() => openGate("add-deal")}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold text-white"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    <HiOutlinePlus className="h-4 w-4" />
                    Add deal
                  </button>
                  <button
                    type="button"
                    onClick={() => openGate("export")}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Export
                  </button>
                  <span className="ml-auto text-[11px] text-slate-400">4 stages · demo data</span>
                </div>
              )}

              <div className="relative flex-1 overflow-auto p-3 sm:p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {viewTab === "dashboard" && (
                      <div className="space-y-4" data-demo="dashboard">
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { label: "Lead Finder", tab: "search" },
                              { label: "Pipeline", tab: "pipeline" },
                              { label: "Lead map", gate: "map" },
                              { label: "Export CSV", gate: "export" },
                            ] as const
                          ).map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => {
                                if ("tab" in action) selectTab(action.tab);
                                else openGate(action.gate);
                              }}
                              className="rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-sm hover:border-violet-200 hover:bg-violet-50/50"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                          {[
                            { l: "Total leads", v: "1,284", d: "+12% wk" },
                            { l: "Hot leads", v: "128", d: "42% of pipe" },
                            { l: "Saved", v: "342", d: "CRM ready" },
                            { l: "Closed", v: "47", d: "This quarter" },
                          ].map((s) => (
                            <div
                              key={s.l}
                              className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-[0_8px_30px_rgba(80,40,120,0.06)]"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {s.l}
                              </p>
                              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-slate-900">
                                {s.v}
                              </p>
                              <p className="mt-0.5 text-[11px] font-medium text-violet-600">{s.d}</p>
                            </div>
                          ))}
                        </div>
                        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <p className="text-[13px] font-semibold text-slate-800">Leads this week</p>
                              <button
                                type="button"
                                onClick={() => openGate("reports")}
                                className="text-[11px] font-semibold text-violet-600 hover:underline"
                              >
                                Full report
                              </button>
                            </div>
                            <div className="mt-3 flex h-20 items-end gap-1.5">
                              {[35, 52, 44, 68, 58, 82, 71].map((h, i) => (
                                <motion.div
                                  key={i}
                                  className="flex-1 rounded-t-md"
                                  style={{ background: LOGO_GRADIENT }}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${h}%` }}
                                  transition={{ delay: 0.05 * i, duration: 0.5 }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                            <p className="text-[13px] font-semibold text-slate-800">Live activity</p>
                            <ul className="mt-3 space-y-2.5">
                              {ACTIVITY.map((a) => (
                                <li key={a.msg} className="border-b border-slate-100 pb-2 last:border-0">
                                  <p className="text-[12px] leading-snug text-slate-700">{a.msg}</p>
                                  <p className="text-[10px] text-slate-400">{a.t}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {viewTab === "pipeline" && (
                      <div
                        data-demo="pipeline-board"
                        className="flex gap-3 overflow-x-auto pb-2"
                      >
                        {columns.map((col) => (
                          <div
                            key={col.value}
                            className="w-[185px] shrink-0 rounded-xl border border-slate-200/90 bg-[#faf8fb] p-2 sm:w-[200px]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const id = e.dataTransfer.getData("text/plain");
                              if (id) moveCard(id, col.value);
                              setDraggingId(null);
                            }}
                          >
                            <div className="mb-2 flex items-center justify-between px-0.5">
                              <p className="text-[12px] font-semibold text-slate-800">{col.label}</p>
                              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-fuchsia-700 shadow-sm">
                                {col.items.length}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {col.items.map((card) => (
                                <div
                                  key={card.id}
                                  data-demo={card.id === "summit" ? "card-summit" : undefined}
                                  draggable
                                  onDragStart={(e) => {
                                    cardDragMovedRef.current = false;
                                    e.dataTransfer.setData("text/plain", card.id);
                                    setDraggingId(card.id);
                                  }}
                                  onDrag={() => {
                                    cardDragMovedRef.current = true;
                                  }}
                                  onDragEnd={() => setDraggingId(null)}
                                  onClick={() => {
                                    if (!cardDragMovedRef.current) openGate("lead-detail");
                                  }}
                                  className={cn(
                                    "cursor-grab rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing",
                                    draggingId === card.id && "opacity-60 ring-2 ring-fuchsia-300",
                                    tourActive &&
                                      step?.anchor === "card-summit" &&
                                      card.id === "summit" &&
                                      "ring-2 ring-fuchsia-500 ring-offset-2",
                                  )}
                                >
                                  <p className="text-[13px] font-semibold text-slate-900">{card.name}</p>
                                  <p className="text-[11px] text-slate-500">{card.city}</p>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", tierClass(card.tier))}>
                                      {card.tier}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-600">{card.score}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {viewTab === "search" && (
                      <div className="mx-auto max-w-xl space-y-4">
                        <div
                          data-demo="search-panel"
                          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_12px_40px_rgba(80,40,120,0.08)]"
                        >
                          <p className="text-[13px] font-semibold text-slate-800">Search businesses</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="text-[10px] font-medium uppercase text-slate-400">Trade</span>
                              <select className="mt-1 w-full rounded-xl border border-slate-200 bg-[#faf8fb] px-3 py-2.5 text-[13px] text-slate-800">
                                <option>Roofing</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="text-[10px] font-medium uppercase text-slate-400">City</span>
                              <input
                                readOnly
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-[#faf8fb] px-3 py-2.5 text-[13px] text-slate-800"
                                defaultValue="Tampa, FL"
                              />
                            </label>
                          </div>
                          <label className="mt-3 block">
                            <span className="text-[10px] font-medium uppercase text-slate-400">Radius</span>
                            <input type="range" defaultValue={25} className="mt-2 w-full accent-violet-600" readOnly />
                          </label>
                          <button
                            type="button"
                            data-demo="search-btn"
                            onClick={runSampleSearch}
                            disabled={searchLoading}
                            className={cn(
                              "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white disabled:opacity-70",
                              tourActive && step?.anchor === "search-btn" && "ring-2 ring-fuchsia-500 ring-offset-2",
                            )}
                            style={{ background: LOGO_GRADIENT }}
                          >
                            {searchLoading ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Searching Google Places…
                              </>
                            ) : (
                              <>
                                Search
                                <HiOutlineArrowRight className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>

                        {searchRan && (
                          <ul className="space-y-2">
                            {SEARCH_RESULTS.map((r) => (
                              <li
                                key={r.name}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm"
                              >
                                <button
                                  type="button"
                                  onClick={() => openGate("lead-detail")}
                                  className="min-w-0 flex-1 text-left hover:opacity-90"
                                >
                                  <p className="text-[13px] font-semibold text-slate-900">{r.name}</p>
                                  <p className="text-[11px] text-slate-500">{r.city}</p>
                                </button>
                                <div className="flex items-center gap-2">
                                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", tierClass(r.tier))}>
                                    {r.tier}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openGate("save-lead")}
                                    className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-100"
                                  >
                                    Save
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {viewTab === "ai" && (
                      <div className="mx-auto flex max-w-lg flex-col gap-4">
                        <div
                          data-demo="ai-panel"
                          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-violet-800">
                              <HiOutlineSparkles className="h-5 w-5" />
                              <p className="text-[13px] font-semibold">Ask Contractor Leads</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openGate("scripts")}
                              className="text-[11px] font-semibold text-violet-600 hover:underline"
                            >
                              My scripts
                            </button>
                          </div>
                          <div className="mt-4 space-y-3">
                            <div className="rounded-2xl bg-[#faf8fb] px-3 py-2.5 text-[13px] text-slate-700">
                              Write a cold SMS for a roofing company with no Meta ads.
                            </div>
                            <div
                              className="rounded-2xl border border-violet-100 px-3 py-2.5 text-[13px] leading-relaxed text-slate-700"
                              style={{ background: "linear-gradient(135deg, #fdf4ff 0%, #faf5ff 100%)" }}
                            >
                              Hi [Owner] — noticed [Business] crushes reviews in Tampa but isn&apos;t running
                              paid search. We help roofers book 8–12 extra jobs/month without Angi fees. Worth a
                              12-min look this week?
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openGate("outreach")}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Send via Outreach
                            </button>
                            <button
                              type="button"
                              onClick={() => openGate("save-lead")}
                              className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Attach to lead
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm">
                          <input
                            value={aiDraft}
                            onChange={(e) => setAiDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendAi()}
                            placeholder="Ask a follow-up…"
                            className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={sendAi}
                            className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold text-white"
                            style={{ background: LOGO_GRADIENT }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <nav
                className="flex gap-1 overflow-x-auto border-t border-slate-200/80 bg-white/90 px-3 py-2.5 backdrop-blur-md lg:hidden"
                aria-label="Demo views (mobile)"
              >
                {BOTTOM_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTab(t.id)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition",
                      viewTab === t.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>

              <div className="hidden border-t border-slate-200/80 bg-gradient-to-r from-white via-[#faf8fb] to-white px-3 py-2 lg:flex">
                {BOTTOM_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTab(t.id)}
                    className={cn(
                      "relative px-4 py-2 text-[12px] font-medium transition",
                      viewTab === t.id ? "text-violet-900" : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    {t.label}
                    {viewTab === t.id && (
                      <motion.span
                        layoutId="demo-tab-indicator"
                        className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full"
                        style={{ background: LOGO_GRADIENT }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {tourActive && (
            <>
              <div className="pointer-events-none absolute inset-0 z-20 bg-slate-900/20" aria-hidden />
              {tooltipPos && (
                <div
                  className="absolute z-30 w-[min(340px,calc(100%-24px))] rounded-2xl border border-white/10 bg-[#2a2a2e] p-4 text-left shadow-2xl ring-1 ring-white/5"
                  style={{ top: tooltipPos.top, left: tooltipPos.left }}
                  role="dialog"
                  aria-labelledby="demo-tour-title"
                >
                  <button
                    type="button"
                    onClick={() => setTourOpen(false)}
                    className="absolute right-3 top-3 rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
                    aria-label="Close tour"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
                    Step {tourIndex + 1} of {TOUR.length}
                  </p>
                  <h3 id="demo-tour-title" className="mt-1 pr-6 text-[16px] font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/78">{step.body}</p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setTourOpen(false)}
                      className="text-[12px] font-medium text-white/50 hover:text-white/80"
                    >
                      Skip tour
                    </button>
                    {!step.advanceOn ? (
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600"
                      >
                        Next
                        <HiOutlineChevronRight className="h-4 w-4" />
                      </button>
                    ) : step.advanceOn === "drag-summit-contacted" ? (
                      <span className="text-[11px] font-medium text-emerald-300">Drag the card to continue</span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-300">Run search to continue</span>
                    )}
                  </div>
                  {step.id === "finish" && (
                    <Link
                      href="/register"
                      className="mt-3 flex w-full items-center justify-center rounded-xl py-2.5 text-[13px] font-semibold text-white"
                      style={{ background: LOGO_GRADIENT }}
                      onClick={() => setTourOpen(false)}
                    >
                      Start free trial
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {!tourOpen && (
            <button
              type="button"
              onClick={() => {
                setTourIndex(0);
                setTab(TOUR[0].tab);
                setTourOpen(true);
              }}
              className="absolute bottom-14 right-4 z-10 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-lg hover:bg-slate-50 lg:bottom-[3.25rem]"
            >
              Restart tour
            </button>
          )}
        </div>
        </Reveal>
      </div>

      <AnimatePresence>
        {gateCopy && <DemoGateModal copy={gateCopy} onClose={() => setGateCopy(null)} />}
      </AnimatePresence>
    </section>
  );
}
