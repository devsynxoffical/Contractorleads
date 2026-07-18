"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

type LeadHit = {
  id: string;
  businessName: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  leadScore: number;
  qualityTier: string | null;
};

type SavedHit = {
  id: string;
  status: string;
  lead: {
    id: string;
    businessName: string;
    industry: string | null;
    city: string | null;
    state: string | null;
    leadScore: number;
  };
};

export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<LeadHit[]>([]);
  const [saved, setSaved] = useState<SavedHit[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setLeads([]);
      setSaved([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setLeads(data.leads ?? []);
        setSaved(data.saved ?? []);
        setOpen(true);
      } catch {
        setLeads([]);
        setSaved([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goSearchPage() {
    const q = query.trim();
    if (q.length < 2) return;
    setOpen(false);
    router.push(`/leads?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={wrapRef} className={className}>
      <form
        className="relative w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          goSearchPage();
        }}
      >
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => (leads.length > 0 || saved.length > 0) && setOpen(true)}
          placeholder="Search leads, industries, cities…"
          className="h-10 w-full rounded-xl border border-border/80 bg-[#faf8fc]/90 pl-10 pr-3 text-[13px] text-ink outline-none transition placeholder:text-ink-faint hover:bg-white focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-[var(--ring)]"
        />
        {open && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-auto rounded-xl border border-border bg-white py-2 shadow-[var(--shadow-elevated)]">
            {loading && (
              <p className="px-3 py-2 text-[12px] text-ink-muted">Searching…</p>
            )}
            {!loading && leads.length === 0 && saved.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-ink-muted">
                No matches. Try another name, city, or industry.
              </p>
            )}
            {leads.length > 0 && (
              <div className="px-2 pb-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Your leads
                </p>
                {leads.map((l) => (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 hover:bg-brand-50"
                  >
                    <p className="text-[13px] font-semibold text-ink">
                      {l.businessName}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {[l.industry, l.city, l.state].filter(Boolean).join(" · ")}
                      {` · Score ${l.leadScore}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
            {saved.length > 0 && (
              <div className="border-t border-border/60 px-2 pt-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
                  Saved
                </p>
                {saved.map((s) => (
                  <Link
                    key={s.id}
                    href={`/leads/${s.lead.id}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-2 py-2 hover:bg-brand-50"
                  >
                    <p className="text-[13px] font-semibold text-ink">
                      {s.lead.businessName}
                    </p>
                    <p className="text-[11px] text-ink-muted capitalize">
                      {s.status}
                      {[s.lead.city, s.lead.state].filter(Boolean).length
                        ? ` · ${[s.lead.city, s.lead.state].filter(Boolean).join(", ")}`
                        : ""}
                    </p>
                  </Link>
                ))}
              </div>
            )}
            <button
              type="submit"
              className="mt-1 w-full border-t border-border/60 px-3 py-2 text-left text-[12px] font-semibold text-brand-600 hover:bg-brand-50"
            >
              View all results for “{query.trim()}”
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
