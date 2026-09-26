"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiOutlineBookmark, HiOutlineXMark } from "react-icons/hi2";
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

  async function save() {
    if (!name.trim()) { setErr("Enter a name."); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry,
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Save button (only when filters are active) */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setShowDialog(true); setErr(null); setName(""); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand-400 bg-brand-50/60 px-3 py-1.5 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            <HiOutlineBookmark className="h-3.5 w-3.5" />
            Save as segment
          </button>
        )}

        {/* Saved segment pills */}
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="group inline-flex items-center overflow-hidden rounded-full border border-border bg-[var(--surface)] shadow-[var(--shadow-soft)] transition hover:border-brand-300"
          >
            <button
              type="button"
              onClick={() => applySegment(seg)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-ink transition group-hover:text-brand-700"
            >
              <span className="font-semibold">{seg.name}</span>
              {segmentLabel(seg) !== seg.name && (
                <span className="text-ink-muted">{segmentLabel(seg)}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => deleteSegment(seg.id)}
              className="border-l border-border px-1.5 py-1.5 text-ink-faint opacity-0 transition hover:text-rose-500 group-hover:opacity-100"
              title="Delete segment"
            >
              <HiOutlineXMark className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {!hasFilters && !segments.length && (
          <p className="text-[12px] text-ink-faint">
            Set filters above then click <strong>Save as segment</strong> to create a one-click shortcut.
          </p>
        )}
      </div>

      {/* Save dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Save segment"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Save filter as segment</h3>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  Give this combination of filters a name so you can jump back to it in one click.
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

            <div className="space-y-3 px-5 py-4">
              {/* Filter summary */}
              <div className="rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2 text-[12px] text-ink-muted">
                {[
                  industry && `Industry: ${industry}`,
                  when && when !== "all" && `When: ${when}`,
                  tier && tier !== "all" && `Tier: ${tier}`,
                  strength && strength !== "all" && `Score: ${strength}`,
                  q && `Search: "${q}"`,
                  sort && sort !== "newest" && `Sort: ${sort}`,
                ]
                  .filter(Boolean)
                  .join("  ·  ") || "All leads (no filters)"}
              </div>

              <label className="block">
                <span className="text-[12px] font-medium text-ink-muted">Segment name</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void save(); }}
                  placeholder={
                    industry
                      ? `${industry}${when && when !== "all" ? ` – ${when}` : ""}`
                      : "My segment"
                  }
                  maxLength={60}
                  className="saas-input mt-1.5 w-full"
                  disabled={saving}
                />
              </label>

              {err && (
                <p className="text-[12px] text-rose-600">{err}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="rounded-xl border border-border px-4 py-2 text-[13px] font-semibold text-ink transition hover:bg-[var(--input-bg)]"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !name.trim()}
                className={cn(
                  "rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition",
                  saving || !name.trim()
                    ? "cursor-not-allowed bg-brand-400 opacity-60"
                    : "bg-[#1a1224] hover:opacity-90",
                )}
              >
                {saving ? "Saving…" : "Save segment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
