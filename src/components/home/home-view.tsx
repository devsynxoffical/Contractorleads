"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineCheckBadge,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineFire,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { INDUSTRIES, US_STATES } from "@/lib/constants";
import {
  LeadResultsHeader,
  LeadResultsList,
} from "@/components/leads/lead-result-card";

type Lead = {
  id: string;
  businessName: string;
  address: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  leadScore: number;
  qualityTier: string | null;
  industry?: string | null;
  serviceCategory?: string | null;
  city: string | null;
  state: string | null;
  zip?: string | null;
  outreachAngle?: string | null;
  revenueRangeEstimate?: string | null;
  yelpRating?: number | null;
  googleMapsLink?: string | null;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const LOGO_GRADIENT =
  "linear-gradient(135deg, #e6007e 0%, #8e24aa 55%, #7b1fa2 100%)";

const QUICK_PROMPTS = [
  "Roofing in Austin TX",
  "HVAC in Miami FL",
  "Plumbing in Phoenix AZ",
  "Solar in Dallas TX",
  "Landscaping in Denver CO",
  "Electrical in Atlanta GA",
];

function parseLeadQuery(input: string): {
  industry: string;
  state: string;
  city: string;
} | null {
  const text = input.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  const industry =
    INDUSTRIES.find((i) => lower.includes(i.toLowerCase())) ??
    INDUSTRIES.find((i) =>
      lower.split(/\s+/).some((w) => i.toLowerCase().startsWith(w))
    );

  let state = "";
  for (const s of US_STATES) {
    if (
      new RegExp(`\\b${s.code}\\b`, "i").test(text) ||
      lower.includes(s.name.toLowerCase())
    ) {
      state = s.code;
      break;
    }
  }

  let city = "";
  const inMatch = text.match(/\bin\s+([A-Za-z.\s]+?)(?:,|\s+[A-Z]{2}\b|$)/i);
  if (inMatch?.[1]) {
    city = inMatch[1]
      .replace(new RegExp(US_STATES.map((s) => s.name).join("|"), "ig"), "")
      .replace(/\b[A-Z]{2}\b/g, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  if (!industry || !state) return null;
  return { industry, state, city };
}

export function HomeView({ userName }: { userName?: string | null }) {
  const [input, setInput] = useState("");
  const [industry, setIndustry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("25");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi${userName ? ` ${userName.split(" ")[0]}` : ""} — describe the leads you need, or set filters below and search.`,
    },
  ]);

  useEffect(() => setMounted(true), []);

  async function runSearch(params: {
    industry: string;
    state: string;
    city?: string;
    zip?: string;
    radius?: string;
  }) {
    setLoading(true);
    setError("");
    setLeads([]);

    const res = await fetch("/api/leads/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industry: params.industry,
        state: params.state,
        city: params.city || undefined,
        zip: params.zip || undefined,
        radius: Number(params.radius || 25),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const msg = data.error || "Search failed";
      setError(msg);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: msg },
      ]);
      return;
    }

    const found = (data.leads ?? []) as Lead[];
    setLeads(found);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: found.length
          ? `Found ${found.length} verified leads for ${params.industry} in ${params.state}${params.city ? ` · ${params.city}` : ""}.`
          : `No leads found for ${params.industry} in ${params.state}. Try another city or industry.`,
      },
    ]);
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: q },
    ]);
    setInput("");

    const parsed = parseLeadQuery(q);
    if (!parsed) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "I need an industry and state — try “Roofing in Austin TX” or fill the filters below.",
        },
      ]);
      return;
    }

    setIndustry(parsed.industry);
    setState(parsed.state);
    setCity(parsed.city);
    await runSearch({ ...parsed, radius });
  }

  async function handleFilterSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!industry || !state) {
      setError("Select industry and state to search.");
      return;
    }
    const label = `${industry} in ${city ? `${city}, ` : ""}${state}${zip ? ` · ${zip}` : ""} · ${radius} mi`;
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: label },
    ]);
    await runSearch({ industry, state, city, zip, radius });
  }

  return (
    <div className="page-pad page-enter">
      <div className="mx-auto max-w-4xl">
        {/* Hero */}
        <div className="animate-fade-up relative overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/70 p-6 shadow-[var(--shadow-elevated)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60 blur-3xl"
            style={{ background: "rgba(230,0,126,0.18)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-50 blur-3xl"
            style={{ background: "rgba(142,36,170,0.16)" }}
          />

          <div className="relative text-center">
            <div className="saas-chip mx-auto mb-4">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-emerald-500" />
              AI-verified · All 50 states
            </div>
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_12px_28px_rgba(123,31,162,0.35)]"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlineChatBubbleLeftEllipsis className="h-7 w-7" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-semibold tracking-tight text-ink sm:text-4xl">
              Find high-quality{" "}
              <span className="gradient-text">contractor leads</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
              Chat in plain English or use precise filters — scored Hot / Warm /
              Nurture, never fabricated data.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[12px] text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineCheckBadge className="h-4 w-4 text-brand-500" />
                Google Places + Yelp
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineSparkles className="h-4 w-4 text-brand-500" />
                AI qualification
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineMapPin className="h-4 w-4 text-brand-500" />
                ZIP + radius
              </span>
            </div>
          </div>

          {/* Chat */}
          <div
            className={`relative mt-8 overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[var(--shadow-card)] transition duration-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <div className="max-h-[280px] space-y-3 overflow-y-auto px-4 py-4 sm:max-h-[320px] sm:px-5 sm:py-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed sm:text-[14px] ${
                      msg.role === "user"
                        ? "rounded-br-md text-white shadow-sm"
                        : "rounded-bl-md border border-border/60 bg-[#faf8fc] text-ink"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: LOGO_GRADIENT }
                        : undefined
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {!messages.some((m) => m.role === "user") && (
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setMessages((m) => [
                          ...m,
                          { id: crypto.randomUUID(), role: "user", text: p },
                        ]);
                        const parsed = parseLeadQuery(p);
                        if (parsed) {
                          setIndustry(parsed.industry);
                          setState(parsed.state);
                          setCity(parsed.city);
                          void runSearch({ ...parsed, radius });
                        }
                      }}
                      className="rounded-full border border-border bg-white px-3.5 py-1.5 text-[12px] font-medium text-ink-muted shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <p className="flex items-center justify-center gap-2 text-[13px] text-ink-muted">
                  <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                  Running verification pipeline…
                </p>
              )}
            </div>

            <form
              onSubmit={handleChatSubmit}
              className="flex gap-2 border-t border-border/80 bg-gradient-to-b from-[#faf8fc] to-white px-4 py-3.5 sm:px-5"
            >
              <div className="relative flex-1">
                <HiOutlineSparkles className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='Try “HVAC in Miami FL”'
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-[14px] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400 focus:ring-4 focus:ring-[var(--ring)]"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_20px_rgba(123,31,162,0.3)] transition hover:opacity-95 disabled:opacity-45"
                style={{ background: LOGO_GRADIENT }}
                aria-label="Send"
              >
                <HiOutlinePaperAirplane className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Filters */}
        <div className="animate-fade-up saas-card mt-5 p-5 sm:p-6" style={{ animationDelay: "0.08s" }}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <HiOutlineMapPin className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-[15px] font-semibold tracking-tight text-ink">
                  Filters & location
                </h2>
                <p className="text-[12px] text-ink-faint">
                  Industry · State · City · ZIP · Radius
                </p>
              </div>
            </div>
            <Link
              href="/leads/search"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
            >
              Advanced Lead Finder →
            </Link>
          </div>

          <form
            onSubmit={handleFilterSearch}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
                className="saas-input"
              >
                <option value="" disabled>
                  Select industry
                </option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                className="saas-input"
              >
                <option value="" disabled>
                  Select state
                </option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                City
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin"
                className="saas-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                ZIP code
              </label>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="78701"
                className="saas-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
                Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="saas-input"
              >
                {[10, 15, 25, 50, 75, 100].map((r) => (
                  <option key={r} value={r}>
                    {r} miles
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white shadow-[0_8px_22px_rgba(123,31,162,0.28)] transition hover:opacity-95 disabled:opacity-55"
                style={{ background: LOGO_GRADIENT }}
              >
                <HiOutlineMagnifyingGlass className="h-4 w-4" />
                Search leads
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
              {error}
            </p>
          )}
        </div>

        {leads.length > 0 && (
          <div className="mt-6 animate-fade-up">
            <LeadResultsHeader
              count={leads.length}
              hotCount={leads.filter((l) => l.qualityTier === "hot").length}
              avgScore={Math.round(
                leads.reduce((s, l) => s + l.leadScore, 0) / leads.length
              )}
              actions={
                <Link
                  href="/leads/hot"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:underline"
                >
                  <HiOutlineFire className="h-3.5 w-3.5" />
                  Hot leads
                </Link>
              }
            />
            <LeadResultsList leads={leads} />
            <p className="mt-4 text-center text-[12px] text-ink-faint">
              Want CSV/Excel export?{" "}
              <Link
                href="/leads/search"
                className="font-semibold text-brand-600 hover:underline"
              >
                Open Lead Finder
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
