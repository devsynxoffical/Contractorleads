"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AdminIndustryField,
  industryPayloadForApi,
  resolvedIndustryForQuery,
} from "@/components/admin/admin-industry-field";
import {
  INDUSTRIES,
  TIER_ONE_COUNTRIES,
  getTierOneCountry,
  getRegionAnyLabel,
  getRegionsForCountry,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
import { cn } from "@/lib/utils";
import {
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineGlobeAlt,
  HiOutlineDocumentArrowDown,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineTableCells,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineBookmark,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { FaLinkedin, FaFacebook, FaInstagram } from "react-icons/fa";

type ContactLead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  ownerTitle: string | null;
  ownerConfidence?: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  industry: string | null;
  googleRating?: number | null;
  reviewCount?: number | null;
  googleMapsLink?: string | null;
  linkedinUrl?: string | null;
  linkedinOwnerUrl?: string | null;
  linkedinCompanyUrl?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  leadScore?: number | null;
  qualityTier?: string | null;
  createdAt?: string;
};

type NicheRow = { name: string; count: number };
type FilterTab = "all" | "has_email" | "has_phone" | "has_name" | "has_social";

export function BulkEmailFinderView() {
  const router = useRouter();

  // Form State
  const [industrySelect, setIndustrySelect] = useState<string>(INDUSTRIES[0]);
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("US");
  const [locationScope, setLocationScope] = useState<"local" | "country">("local");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(25);
  const [targetCount, setTargetCount] = useState(50);
  const [customCount, setCustomCount] = useState("");

  // Mode: "live" (Real-time live finder) or "database" (Database lead pool)
  const [mode, setMode] = useState<"live" | "database">("live");

  // Data State
  const [loading, setLoading] = useState(false);
  const [loadingPool, setLoadingPool] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [niches, setNiches] = useState<NicheRow[]>([]);
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Saving state
  const [savingLeads, setSavingLeads] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  // UI / View State
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [tableSearch, setTableSearch] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  const countryMeta = getTierOneCountry(country);
  const knownNicheNames = useMemo(() => niches.map((n) => n.name), [niches]);
  const activeIndustry = resolvedIndustryForQuery(industrySelect, customIndustry);

  const resolvedTargetCount = (() => {
    if (targetCount === -1) {
      const n = Number(customCount);
      if (!Number.isFinite(n)) return 50;
      return Math.max(1, Math.min(1000, Math.floor(n)));
    }
    return targetCount;
  })();

  const loadNiches = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/bulk-finder");
      const data = await res.json();
      if (res.ok && Array.isArray(data.niches)) {
        setNiches(data.niches);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadDatabaseLeads = useCallback(async (nicheName: string) => {
    if (!nicheName.trim()) return;
    setLoadingPool(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        industry: nicheName,
        take: "500",
      });
      const res = await fetch(`/api/leads/bulk-finder?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load contacts");
      setLeads(data.leads ?? []);
      setSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load database contacts");
    } finally {
      setLoadingPool(false);
    }
  }, []);

  useEffect(() => {
    void loadNiches();
  }, [loadNiches]);

  useEffect(() => {
    if (mode === "database" && activeIndustry) {
      void loadDatabaseLeads(activeIndustry);
    }
  }, [mode, activeIndustry, loadDatabaseLeads]);

  // Run live contact finder/scraper
  async function runFinder() {
    const industry = resolvedIndustryForQuery(industrySelect, customIndustry);
    if (!industry) {
      setError("Please enter or select a service / niche.");
      return;
    }

    setLoading(true);
    startNavigationProgress();
    setError(null);
    setResultMessage(null);
    setSelectedIds(new Set());

    try {
      const res = await fetch("/api/leads/bulk-finder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
        },
        body: JSON.stringify({
          ...industryPayloadForApi(industrySelect, customIndustry),
          country,
          locationScope,
          state: locationScope === "local" ? state : undefined,
          city: locationScope === "local" ? city : undefined,
          zip: locationScope === "local" ? zip : undefined,
          radius: locationScope === "local" ? radius : undefined,
          targetLeadCount: resolvedTargetCount,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Contact search failed");
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (!part.trim()) continue;
            const eventMatch = part.match(/^event:\s*(\w+)/m);
            const dataMatch = part.match(/^data:\s*(.+)$/m);
            if (!dataMatch) continue;

            const eventType = eventMatch ? eventMatch[1] : "message";
            let payload: any;
            try {
              payload = JSON.parse(dataMatch[1]);
            } catch {
              continue;
            }

            if (eventType === "lead") {
              const newLead = payload.lead as ContactLead;
              setLeads((prev) => {
                const idx = prev.findIndex((l) => l.id === newLead.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = newLead;
                  return copy;
                }
                return [newLead, ...prev];
              });
            } else if (eventType === "done") {
              const fetchedLeads = (payload.leads ?? []) as ContactLead[];
              setLeads(fetchedLeads);
              setResultMessage(payload.message ?? `Found ${fetchedLeads.length} contacts`);
              void loadNiches();
            } else if (eventType === "error") {
              throw new Error(payload.error ?? "Live search encountered an error");
            }
          }
        }
      } else {
        const data = await res.json();
        setLeads(data.leads ?? []);
        setResultMessage(data.message ?? `Discovered ${data.leads?.length ?? 0} contacts`);
        void loadNiches();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
      stopNavigationProgress();
    }
  }

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (activeFilter === "has_email" && !l.email) return false;
      if (activeFilter === "has_phone" && !l.phone) return false;
      if (activeFilter === "has_name" && !l.ownerName) return false;
      if (
        activeFilter === "has_social" &&
        !l.linkedinUrl &&
        !l.linkedinOwnerUrl &&
        !l.linkedinCompanyUrl &&
        !l.facebook &&
        !l.instagram
      ) {
        return false;
      }
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const matchesName = l.businessName.toLowerCase().includes(q);
        const matchesOwner = (l.ownerName ?? "").toLowerCase().includes(q);
        const matchesEmail = (l.email ?? "").toLowerCase().includes(q);
        const matchesPhone = (l.phone ?? "").toLowerCase().includes(q);
        const matchesLocation = `${l.city ?? ""} ${l.state ?? ""}`.toLowerCase().includes(q);
        if (!matchesName && !matchesOwner && !matchesEmail && !matchesPhone && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [leads, activeFilter, tableSearch]);

  // Bulk stats
  const stats = useMemo(() => {
    const total = leads.length;
    const withEmail = leads.filter((l) => l.email).length;
    const withPhone = leads.filter((l) => l.phone).length;
    const withOwner = leads.filter((l) => l.ownerName).length;
    const withSocial = leads.filter(
      (l) => l.linkedinUrl || l.linkedinOwnerUrl || l.facebook || l.instagram,
    ).length;
    return { total, withEmail, withPhone, withOwner, withSocial };
  }, [leads]);

  // Toggle selection
  function toggleLead(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  }

  // Copy helper
  function triggerCopyFeedback(msg: string) {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 2500);
  }

  function copyAllEmails() {
    const target = selectedIds.size > 0
      ? leads.filter((l) => selectedIds.has(l.id))
      : filteredLeads;
    const emails = target.map((l) => l.email).filter(Boolean);
    if (!emails.length) {
      triggerCopyFeedback("No emails found to copy");
      return;
    }
    navigator.clipboard.writeText(emails.join("\n"));
    triggerCopyFeedback(`Copied ${emails.length} email addresses!`);
  }

  function copyAllPhones() {
    const target = selectedIds.size > 0
      ? leads.filter((l) => selectedIds.has(l.id))
      : filteredLeads;
    const phones = target.map((l) => l.phone).filter(Boolean);
    if (!phones.length) {
      triggerCopyFeedback("No phone numbers found");
      return;
    }
    navigator.clipboard.writeText(phones.join("\n"));
    triggerCopyFeedback(`Copied ${phones.length} phone numbers!`);
  }

  // Save selected leads to User's Saved Leads CRM
  async function saveSelectedToCrm() {
    const idsToSave = selectedIds.size > 0
      ? [...selectedIds]
      : filteredLeads.map((l) => l.id);

    if (!idsToSave.length) return;
    setSavingLeads(true);
    try {
      const res = await fetch("/api/leads/bulk-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: idsToSave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save leads");
      setSavedCount(idsToSave.length);
      triggerCopyFeedback(`Saved ${idsToSave.length} leads to CRM!`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save leads");
    } finally {
      setSavingLeads(false);
    }
  }

  // Export to CSV
  function exportCsv() {
    const target = selectedIds.size > 0
      ? leads.filter((l) => selectedIds.has(l.id))
      : filteredLeads;

    if (!target.length) return;

    const headers = [
      "Business Name",
      "Owner Name",
      "Owner Title",
      "Email",
      "Phone",
      "Website",
      "Address",
      "City",
      "State",
      "Zip",
      "Country",
      "Industry",
      "Lead Score",
      "Google Rating",
      "LinkedIn",
      "Facebook",
    ];

    const rows = target.map((l) => [
      `"${(l.businessName || "").replace(/"/g, '""')}"`,
      `"${(l.ownerName || "").replace(/"/g, '""')}"`,
      `"${(l.ownerTitle || "").replace(/"/g, '""')}"`,
      `"${l.email || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.website || ""}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
      `"${l.city || ""}"`,
      `"${l.state || ""}"`,
      `"${l.zip || ""}"`,
      `"${l.country || ""}"`,
      `"${l.industry || ""}"`,
      l.leadScore ?? "",
      l.googleRating ?? "",
      `"${l.linkedinUrl || l.linkedinOwnerUrl || ""}"`,
      `"${l.facebook || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bulk_contacts_${activeIndustry || "leads"}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Mode Switcher & Search Config Card */}
      <Card className="border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <CardContent className="p-6 space-y-6">
          {/* Mode toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex rounded-xl border border-border bg-[var(--input-bg)] p-1">
              <button
                type="button"
                onClick={() => setMode("live")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                  mode === "live"
                    ? "bg-[var(--surface)] text-ink shadow-sm ring-1 ring-border"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <HiOutlineMagnifyingGlass className="h-3.5 w-3.5 text-brand-600" />
                Live Email Finder & Scraper
              </button>
              <button
                type="button"
                onClick={() => setMode("database")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition",
                  mode === "database"
                    ? "bg-[var(--surface)] text-ink shadow-sm ring-1 ring-border"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <HiOutlineSparkles className="h-3.5 w-3.5 text-amber-500" />
                Database Verified Pool ({niches.reduce((acc, n) => acc + n.count, 0)} leads)
              </button>
            </div>

            <div className="text-xs text-ink-muted">
              {mode === "live"
                ? "Scrapes live Google places, audits company websites & enriches verified contacts"
                : "Browse and export instant verified contacts already aggregated in your database"}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Industry / Niche Field */}
            <div className="sm:col-span-2">
              <AdminIndustryField
                selectValue={industrySelect}
                customValue={customIndustry}
                onSelectChange={setIndustrySelect}
                onCustomChange={setCustomIndustry}
                knownNiches={knownNicheNames}
                label="Target Service / Niche"
              />
            </div>

            {/* Country Selector */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Country</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setState("");
                }}
                className="h-10 w-full rounded-xl border border-border bg-[var(--surface)] px-3 text-xs font-medium text-ink focus:border-brand-500 focus:outline-none"
              >
                {TIER_ONE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Count */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Batch Size</label>
              <select
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="h-10 w-full rounded-xl border border-border bg-[var(--surface)] px-3 text-xs font-medium text-ink focus:border-brand-500 focus:outline-none"
              >
                <option value={25}>25 Contacts</option>
                <option value={50}>50 Contacts (Recommended)</option>
                <option value={100}>100 Contacts</option>
                <option value={250}>250 Contacts</option>
                <option value={500}>500 Contacts</option>
                <option value={-1}>Custom Count…</option>
              </select>
              {targetCount === -1 && (
                <Input
                  type="number"
                  placeholder="Enter 1–1000"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  className="mt-2 h-9 text-xs"
                />
              )}
            </div>
          </div>

          {/* Location Details (for live mode) */}
          {mode === "live" && (
            <div className="grid gap-3 rounded-xl border border-border bg-[var(--input-bg)] p-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-1">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                  Scope
                </label>
                <select
                  value={locationScope}
                  onChange={(e) => setLocationScope(e.target.value as "local" | "country")}
                  className="h-9 w-full rounded-lg border border-border bg-[var(--surface)] px-2.5 text-xs text-ink"
                >
                  <option value="local">City / Region</option>
                  <option value="country">Anywhere in {countryMeta.name}</option>
                </select>
              </div>

              {locationScope === "local" && (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      {countryMeta.regionLabel}
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-[var(--surface)] px-2.5 text-xs text-ink"
                    >
                      <option value="">{getRegionAnyLabel(country)}</option>
                      {getRegionsForCountry(country).map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      City
                    </label>
                    <Input
                      placeholder="e.g. Austin, Miami"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      Postal / Zip
                    </label>
                    <Input
                      placeholder="e.g. 78701"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      Radius (Miles)
                    </label>
                    <select
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="h-9 w-full rounded-lg border border-border bg-[var(--surface)] px-2.5 text-xs text-ink"
                    >
                      <option value={10}>10 miles</option>
                      <option value={25}>25 miles</option>
                      <option value={50}>50 miles</option>
                      <option value={100}>100 miles</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Button & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-ink-muted">
              {resultMessage && <span className="font-semibold text-emerald-700">{resultMessage}</span>}
              {copyFeedback && <span className="font-semibold text-brand-600 ml-2">{copyFeedback}</span>}
            </div>

            <div className="flex items-center gap-2">
              {mode === "live" ? (
                <Button
                  onClick={runFinder}
                  disabled={loading || !activeIndustry}
                  className="h-11 px-6 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-semibold shadow-sm"
                >
                  {loading ? (
                    <>
                      <HiOutlineArrowPath className="mr-2 h-4 w-4 animate-spin" />
                      Discovering & Enriching Contacts…
                    </>
                  ) : (
                    <>
                      <HiOutlineMagnifyingGlass className="mr-2 h-4 w-4" />
                      Find Bulk Emails ({resolvedTargetCount} leads)
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => activeIndustry && loadDatabaseLeads(activeIndustry)}
                  disabled={loadingPool || !activeIndustry}
                  className="h-11 px-6 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-semibold shadow-sm"
                >
                  {loadingPool ? (
                    <>
                      <HiOutlineArrowPath className="mr-2 h-4 w-4 animate-spin" />
                      Loading Pool…
                    </>
                  ) : (
                    <>
                      <HiOutlineSparkles className="mr-2 h-4 w-4" />
                      Load Database Contacts
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-[13px] text-rose-900">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {leads.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* KPI Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                Total Contacts
              </p>
              <p className="mt-1 text-2xl font-bold text-ink">{stats.total}</p>
              <p className="mt-0.5 text-xs text-ink-muted">Discovered leads</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Verified Emails
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{stats.withEmail}</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                {stats.total > 0 ? Math.round((stats.withEmail / stats.total) * 100) : 0}% email rate
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                Direct Phones
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-900">{stats.withPhone}</p>
              <p className="mt-0.5 text-xs text-blue-700">Callable numbers</p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                Owner Names
              </p>
              <p className="mt-1 text-2xl font-bold text-purple-900">{stats.withOwner}</p>
              <p className="mt-0.5 text-xs text-purple-700">Decision makers</p>
            </div>

            <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-900">
                Social Profiles
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-900">{stats.withSocial}</p>
              <p className="mt-0.5 text-xs text-brand-700">LinkedIn & Facebook</p>
            </div>
          </div>

          {/* Quick Action & Filter Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "all", label: `All (${stats.total})` },
                    { id: "has_email", label: `Has Email (${stats.withEmail})` },
                    { id: "has_phone", label: `Has Phone (${stats.withPhone})` },
                    { id: "has_name", label: `Has Owner (${stats.withOwner})` },
                    { id: "has_social", label: `Socials (${stats.withSocial})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                      activeFilter === tab.id
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-[var(--input-bg)] text-ink-muted hover:text-ink",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View Switcher & Search */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Filter table…"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="h-8 text-xs w-44 rounded-lg"
                />
                <div className="flex rounded-lg border border-border bg-[var(--input-bg)] p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "p-1.5 rounded-md",
                      viewMode === "table" ? "bg-[var(--surface)] text-ink shadow-sm" : "text-ink-muted",
                    )}
                    title="Table view"
                  >
                    <HiOutlineTableCells className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={cn(
                      "p-1.5 rounded-md",
                      viewMode === "cards" ? "bg-[var(--surface)] text-ink shadow-sm" : "text-ink-muted",
                    )}
                    title="Cards view"
                  >
                    <HiOutlineSquares2X2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleAll}
                  />
                  <span>
                    {selectedIds.size > 0
                      ? `${selectedIds.size} of ${filteredLeads.length} selected`
                      : "Select all"}
                  </span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={copyAllEmails}
                  className="h-8 text-xs font-semibold"
                >
                  <HiOutlineClipboardDocument className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Copy All Emails
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={copyAllPhones}
                  className="h-8 text-xs font-semibold"
                >
                  <HiOutlinePhone className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                  Copy Phones
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={exportCsv}
                  className="h-8 text-xs font-semibold"
                >
                  <HiOutlineDocumentArrowDown className="mr-1.5 h-3.5 w-3.5" />
                  Export CSV
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={saveSelectedToCrm}
                  disabled={savingLeads}
                  className="h-8 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <HiOutlineBookmark className="mr-1.5 h-3.5 w-3.5" />
                  {savingLeads ? "Saving…" : "Save to My Leads"}
                </Button>

                <Link
                  href="/inbox?tab=bulk"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                >
                  <HiOutlinePaperAirplane className="h-3.5 w-3.5" />
                  Send Bulk Email
                </Link>
              </div>
            </div>
          </div>

          {/* Results Table View */}
          {viewMode === "table" ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-border bg-[var(--input-bg)] text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                    <tr>
                      <th className="w-10 py-3 px-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-600"
                          checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                          onChange={toggleAll}
                        />
                      </th>
                      <th className="py-3 px-4">Company & Niche</th>
                      <th className="py-3 px-4">Decision Maker</th>
                      <th className="py-3 px-4">Verified Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Socials</th>
                      <th className="py-3 px-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLeads.map((l) => {
                      const selected = selectedIds.has(l.id);
                      return (
                        <tr
                          key={l.id}
                          onClick={() => toggleLead(l.id)}
                          className={cn(
                            "cursor-pointer transition hover:bg-brand-50/40",
                            selected && "bg-brand-50/60",
                          )}
                        >
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-brand-600"
                              checked={selected}
                              onChange={() => toggleLead(l.id)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-ink">{l.businessName}</div>
                            <div className="text-[11.5px] text-ink-muted">
                              {l.industry || "Contractor"}
                              {l.website && (
                                <a
                                  href={l.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="ml-2 text-brand-600 hover:underline"
                                >
                                  website
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {l.ownerName ? (
                              <div>
                                <span className="font-medium text-ink">{l.ownerName}</span>
                                {l.ownerTitle && (
                                  <span className="block text-[11px] text-ink-muted">
                                    {l.ownerTitle}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-ink-faint text-xs">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono text-[12px]">
                            {l.email ? (
                              <span className="text-emerald-700 font-semibold">{l.email}</span>
                            ) : (
                              <span className="text-ink-faint">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono text-[12px]">
                            {l.phone ? (
                              <span className="text-ink">{l.phone}</span>
                            ) : (
                              <span className="text-ink-faint">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-xs text-ink-muted">
                            {[l.city, l.state].filter(Boolean).join(", ") || l.country || "—"}
                          </td>

                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 text-ink-muted">
                              {l.linkedinOwnerUrl || l.linkedinUrl ? (
                                <a
                                  href={l.linkedinOwnerUrl || l.linkedinUrl || ""}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#0a66c2] hover:opacity-80"
                                  title="LinkedIn"
                                >
                                  <FaLinkedin className="h-4 w-4" />
                                </a>
                              ) : null}
                              {l.facebook ? (
                                <a
                                  href={l.facebook}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#1877f2] hover:opacity-80"
                                  title="Facebook"
                                >
                                  <FaFacebook className="h-4 w-4" />
                                </a>
                              ) : null}
                              {l.instagram ? (
                                <a
                                  href={l.instagram}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#e4405f] hover:opacity-80"
                                  title="Instagram"
                                >
                                  <FaInstagram className="h-4 w-4" />
                                </a>
                              ) : null}
                              {!l.linkedinUrl && !l.facebook && !l.instagram && (
                                <span className="text-ink-faint text-xs">—</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <span className="text-xs font-bold tabular-nums text-brand-600">
                              {l.leadScore ?? 80}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredLeads.map((l) => {
                const selected = selectedIds.has(l.id);
                return (
                  <Card
                    key={l.id}
                    onClick={() => toggleLead(l.id)}
                    className={cn(
                      "cursor-pointer border-border transition hover:border-brand-300 hover:shadow-md",
                      selected && "border-brand-400 ring-2 ring-brand-200 bg-brand-50/30",
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-ink leading-tight">{l.businessName}</h4>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {[l.industry, l.city, l.state].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-600 mt-1"
                          checked={selected}
                          onChange={() => toggleLead(l.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {l.ownerName && (
                          <div className="flex items-center gap-2 text-ink">
                            <HiOutlineUser className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                            <span>
                              {l.ownerName} {l.ownerTitle ? `(${l.ownerTitle})` : ""}
                            </span>
                          </div>
                        )}

                        {l.email && (
                          <div className="flex items-center gap-2 font-mono text-emerald-700">
                            <HiOutlineEnvelope className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{l.email}</span>
                          </div>
                        )}

                        {l.phone && (
                          <div className="flex items-center gap-2 font-mono text-ink">
                            <HiOutlinePhone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span>{l.phone}</span>
                          </div>
                        )}

                        {l.website && (
                          <div className="flex items-center gap-2 text-ink-muted">
                            <HiOutlineGlobeAlt className="h-3.5 w-3.5 shrink-0" />
                            <a
                              href={l.website}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="truncate hover:text-brand-600 hover:underline"
                            >
                              {l.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
