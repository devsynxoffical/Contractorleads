"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiStar,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES, US_STATES } from "@/lib/constants";

type Lead = {
  id: string;
  businessName: string;
  address: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  leadScore: number;
  qualityTier: string | null;
  city: string | null;
  state: string | null;
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
  "HVAC contractors in Miami FL",
  "Plumbing in Phoenix AZ",
  "Solar companies in Dallas TX",
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

export function QuickLeadSearch({ embedded = true }: { embedded?: boolean }) {
  const [open, setOpen] = useState(embedded);
  const [input, setInput] = useState("");
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]);
  const [state, setState] = useState("TX");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Tell me what leads you need — e.g. “Roofing in Austin TX” — or use the filters below.",
    },
  ]);

  async function runSearch(params: {
    industry: string;
    state: string;
    city?: string;
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
        radius: 25,
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
          text: "I need an industry and state — try “Roofing in Austin TX” or fill the filters and hit Search.",
        },
      ]);
      return;
    }

    setIndustry(parsed.industry);
    setState(parsed.state);
    setCity(parsed.city);
    await runSearch(parsed);
  }

  async function handleFilterSearch(e: React.FormEvent) {
    e.preventDefault();
    const label = `${industry} in ${city ? `${city}, ` : ""}${state}`;
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", text: label },
    ]);
    await runSearch({ industry, state, city });
  }

  const panel = (
    <div
      className={
        embedded
          ? "overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-card)]"
          : "relative flex h-[min(640px,92dvh)] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-white shadow-2xl sm:rounded-2xl"
      }
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: LOGO_GRADIENT }}
          >
            <HiOutlineChatBubbleLeftEllipsis className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Search Leads</p>
            <p className="text-[11px] text-ink-faint">
              Chat or filters — search without leaving the dashboard
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-ink-faint hover:bg-brand-50 hover:text-ink"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        )}
      </div>

      <div
        className={`space-y-3 overflow-y-auto px-4 py-4 sm:px-5 ${
          embedded ? "max-h-[280px]" : "flex-1"
        }`}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-md text-white"
                  : "rounded-bl-md bg-[#faf8fb] text-ink"
              }`}
              style={
                msg.role === "user" ? { background: LOGO_GRADIENT } : undefined
              }
            >
              {msg.text}
            </div>
          </div>
        ))}

        {!messages.some((m) => m.role === "user") && (
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loading}
                onClick={() => {
                  setInput(p);
                  setMessages((m) => [
                    ...m,
                    { id: crypto.randomUUID(), role: "user", text: p },
                  ]);
                  const parsed = parseLeadQuery(p);
                  if (parsed) {
                    setIndustry(parsed.industry);
                    setState(parsed.state);
                    setCity(parsed.city);
                    void runSearch(parsed);
                  }
                }}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-ink-muted transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="flex items-center gap-2 text-[13px] text-ink-muted">
            <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
            Searching verified leads…
          </p>
        )}

        {leads.length > 0 && (
          <div className="space-y-2 pt-1">
            {leads.slice(0, embedded ? 5 : 8).map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-white px-3 py-3 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">
                    {lead.businessName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-faint">
                    <HiOutlineMapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {lead.city || lead.state || lead.address || "—"}
                    </span>
                  </p>
                  {lead.googleRating != null && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-muted">
                      <HiStar className="h-3 w-3 text-amber-400" />
                      {lead.googleRating} ({lead.reviewCount ?? 0})
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <Badge
                    variant={
                      lead.qualityTier === "hot"
                        ? "hot"
                        : lead.qualityTier === "warm"
                          ? "warm"
                          : "nurture"
                    }
                  >
                    {lead.qualityTier ?? "nurture"}
                  </Badge>
                  <p className="mt-1 text-[11px] font-semibold tabular-nums text-brand-600">
                    Score {lead.leadScore}
                  </p>
                </div>
              </Link>
            ))}
            {leads.length > (embedded ? 5 : 8) && (
              <Link
                href="/leads/search"
                className="block text-center text-[12px] font-semibold text-brand-600 hover:underline"
              >
                View all in Lead Finder →
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-[#faf8fb] px-4 py-3 sm:px-5">
        <form
          onSubmit={handleFilterSearch}
          className="mb-3 grid gap-2 sm:grid-cols-4"
        >
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="h-9 rounded-lg border border-border bg-white px-2 text-[12px] text-ink outline-none focus:border-brand-400"
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="h-9 rounded-lg border border-border bg-white px-2 text-[12px] text-ink outline-none focus:border-brand-400"
          >
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="h-9 rounded-lg border border-border bg-white px-2 text-[12px] text-ink outline-none placeholder:text-ink-faint focus:border-brand-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            style={{ background: LOGO_GRADIENT }}
          >
            <HiOutlineMagnifyingGlass className="h-3.5 w-3.5" />
            Search
          </button>
        </form>

        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineSparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Chat: "HVAC in Miami FL"'
              disabled={loading}
              className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-brand-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition hover:opacity-95 disabled:opacity-50"
            style={{ background: LOGO_GRADIENT }}
            aria-label="Send"
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
          </button>
        </form>
        {error && (
          <p className="mt-2 text-[12px] text-red-600">{error}</p>
        )}
      </div>
    </div>
  );

  if (embedded) return panel;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 flex h-12 items-center gap-2 rounded-full px-4 text-sm font-medium text-white shadow-lg transition hover:opacity-95 sm:px-5"
        style={{
          background: LOGO_GRADIENT,
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          right: "max(1rem, calc(env(safe-area-inset-right) + 8.5rem))",
        }}
        aria-label="Search leads"
      >
        <HiOutlineMagnifyingGlass className="h-4 w-4" />
        <span className="hidden sm:inline">Search Leads</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-end sm:justify-end sm:p-4 md:p-6">
          <div
            className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          {panel}
        </div>
      )}
    </>
  );
}
