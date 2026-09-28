"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiOutlineBookmark, HiOutlinePaperAirplane, HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type Segment = {
  id: string;
  name: string;
  industry: string | null;
  when: string | null;
  tier: string | null;
  strength: string | null;
  q: string | null;
  sort: string | null;
};

/** Read a URL param, return null if missing or equal to defaultVal */
function p(params: URLSearchParams, key: string, defaultVal = "all") {
  const v = params.get(key);
  return !v || v === defaultVal ? null : v;
}

export function LeadSegmentBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/segments");
      const data = await res.json();
      if (res.ok) setSegments(data.segments ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (showDialog) setTimeout(() => inputRef.current?.focus(), 50);
  }, [showDialog]);

  /* Current filter state (null means default/all) */
  const industry = p(searchParams, "category");
  const when = p(searchParams, "when");
  const tier = p(searchParams, "tier");
  const strength = p(searchParams, "strength");
  const q = searchParams.get("q") || null;
  const sort = p(searchParams, "sort", "newest");

  const hasFilters = !!(industry || when || tier || strength || q || sort);

  const [segIndustry, setSegIndustry] = useState("");
  const [segCountry, setSegCountry] = useState("US");
  const [segState, setSegState] = useState("");
  const [segCity, setSegCity] = useState("");

  const openSaveDialog = () => {
    const todayStr = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(new Date());
    const ind = industry || "General Contractors";
    const loc = q || "United States";
    setName(`${todayStr} – ${ind} – ${loc}`);
    setSegIndustry(industry || "");
    setSegCountry("US");
    setSegState("");
    setSegCity(q || "");
    setErr(null);
    setShowDialog(true);
  };

  async function save(andLaunchCampaign = false) {
    if (!name.trim()) { setErr("Enter a segment name."); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry: segIndustry.trim() || industry || null,
          country: segCountry || "US",
          state: segState.trim() || null,
          city: segCity.trim() || null,
          when,
          tier,
          strength,
          q,
          sort,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Save failed"); return; }
      setSegments((prev) => [...prev, data.segment]);
      setShowDialog(false);
      setName("");
      if (andLaunchCampaign && data.segment?.id) {
        router.push(`/campaigns/new?segmentId=${data.segment.id}`);
      }
    } catch {
      setErr("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSegment(id: string) {
    setSegments((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/segments?id=${id}`, { method: "DELETE" });
  }

  function applySegment(seg: Segment) {
    const next = new URLSearchParams();
    if (seg.industry) next.set("category", seg.industry);
    if (seg.when && seg.when !== "all") next.set("when", seg.when);
    if (seg.tier && seg.tier !== "all") next.set("tier", seg.tier);
    if (seg.strength && seg.strength !== "all") next.set("strength", seg.strength);
    if (seg.q) next.set("q", seg.q);
    if (seg.sort && seg.sort !== "newest") next.set("sort", seg.sort);
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function segmentLabel(seg: Segment) {
    const parts: string[] = [];
    if (seg.industry) parts.push(seg.industry);
    if (seg.when && seg.when !== "all") {
      const map: Record<string, string> = {
        today: "Today",
        yesterday: "Yesterday",
        week: "Last 7d",
        month: "Last 30d",
        "90days": "Last 90d",
      };
      parts.push(map[seg.when] ?? seg.when);
    }
    if (seg.tier && seg.tier !== "all") parts.push(seg.tier);
    return parts.length ? parts.join(" · ") : seg.name;
  }

  if (loading) return null;

  const isAllActive = !hasFilters;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-[var(--surface)] p-3 shadow-xs">
        <span className="text-[12px] font-bold text-ink flex items-center gap-1.5 mr-1">
          <HiOutlineBookmark className="h-4 w-4 text-brand-600" />
          Segments:
        </span>

        {/* All Leads default chip */}
        <button
          type="button"
          onClick={() => {
            startTransition(() => {
              router.push(pathname);
            });
          }}
          className={cn(
            "rounded-full px-3 py-1.5 text-[12px] font-bold transition",
            isAllActive
              ? "bg-[#1a1930] text-white shadow-xs dark:bg-brand-600"
              : "border border-border bg-[var(--input-bg)] text-ink-muted hover:bg-[var(--surface)] hover:text-ink"
          )}
        >
          All Leads
        </button>

        {/* Saved segment pills */}
        {segments.map((seg) => {
          const isSelected =
            (seg.industry ? industry === seg.industry : true) &&
            (seg.when && seg.when !== "all" ? when === seg.when : true) &&
            (seg.tier && seg.tier !== "all" ? tier === seg.tier : true) &&
            (seg.strength && seg.strength !== "all" ? strength === seg.strength : true) &&
            (seg.q ? q === seg.q : true) &&
            hasFilters;

          return (
            <div
              key={seg.id}
              className={cn(
                "group inline-flex items-center overflow-hidden rounded-full border shadow-xs transition",
                isSelected
                  ? "border-brand-500 bg-brand-50 text-brand-900 font-bold dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-500/50"
                  : "border-border bg-[var(--surface)] text-ink hover:border-brand-300"
              )}
            >
              <button
                type="button"
                onClick={() => applySegment(seg)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition"
              >
                <span>🎯 {seg.name}</span>
                {segmentLabel(seg) !== seg.name && (
                  <span className="text-[11px] text-ink-muted font-normal">({segmentLabel(seg)})</span>
                )}
              </button>
              <Link
                href={`/campaigns/new?segmentId=${seg.id}`}
                className="border-l border-border px-2.5 py-1.5 text-brand-600 opacity-80 transition hover:bg-brand-100 hover:opacity-100 dark:hover:bg-brand-900"
                title="Launch Email Outreach Campaign"
              >
                <HiOutlinePaperAirplane className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => deleteSegment(seg.id)}
                className="border-l border-border px-1.5 py-1.5 text-ink-muted opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
                title="Delete segment"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* Save as segment button (Always visible) */}
        <button
          type="button"
          onClick={openSaveDialog}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand-400 bg-brand-50/60 px-3 py-1.5 text-[12px] font-bold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-500/40"
        >
          <HiOutlineBookmark className="h-3.5 w-3.5" />
          Save as segment
        </button>

        {/* Manage Segments link */}
        <Link
          href="/segments"
          className="ml-auto text-[11px] font-semibold text-brand-600 hover:underline px-2 py-1"
        >
          Manage All Segments ({segments.length}) →
        </Link>
      </div>

      {/* Save dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-2xl animate-scale-up"
            role="dialog"
            aria-modal="true"
            aria-label="Save segment"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-[15px] font-bold text-ink">Save as Lead Segment</h3>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  Organize leads into targeted lists with automated duplicate detection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[12px] font-bold text-ink mb-1">
                  Custom List Name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 29 Sep – Roofing – Florida"
                  maxLength={100}
                  className="saas-input w-full font-semibold text-xs"
                  disabled={saving}
                />
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Industry / Trade
                  </label>
                  <input
                    type="text"
                    value={segIndustry}
                    onChange={(e) => setSegIndustry(e.target.value)}
                    placeholder="e.g. Roofing, HVAC"
                    className="saas-input w-full text-xs"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    Country
                  </label>
                  <select
                    value={segCountry}
                    onChange={(e) => setSegCountry(e.target.value)}
                    className="saas-input w-full text-xs font-medium"
                    disabled={saving}
                  >
                    <option value="US">United States (US)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="GB">United Kingdom (UK)</option>
                    <option value="AU">Australia (AU)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={segState}
                    onChange={(e) => setSegState(e.target.value)}
                    placeholder="e.g. Florida, Texas"
                    className="saas-input w-full text-xs"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={segCity}
                    onChange={(e) => setSegCity(e.target.value)}
                    placeholder="e.g. Miami, Dallas"
                    className="saas-input w-full text-xs"
                    disabled={saving}
                  />
                </div>
              </div>

              {err && (
                <p className="rounded-lg bg-rose-500/10 p-2 text-[12px] font-semibold text-rose-600 dark:text-rose-400">
                  {err}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3.5 bg-[var(--surface)]">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="rounded-xl border border-border px-3.5 py-2 text-[12px] font-semibold text-ink transition hover:bg-[var(--input-bg)]"
                disabled={saving}
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void save(false)}
                  disabled={saving || !name.trim()}
                  className="rounded-xl border border-border bg-[var(--input-bg)] px-3.5 py-2 text-[12px] font-semibold text-ink transition hover:bg-[var(--surface)] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Segment"}
                </button>
                <button
                  type="button"
                  onClick={() => void save(true)}
                  disabled={saving || !name.trim()}
                  className="rounded-xl bg-brand-600 px-3.5 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                >
                  🚀 Save &amp; Launch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
