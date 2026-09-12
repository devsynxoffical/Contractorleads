"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-shell";
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
import { CUSTOM_INDUSTRY_VALUE } from "@/lib/search-criteria";
import { Button } from "@/components/ui/button";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";
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
} from "react-icons/hi2";
import {
  FaLinkedin,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";

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

export default function BulkContactsPage() {
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

  // Mode: "live" (Run fresh scraper/finder) or "database" (Explore stored database contacts)
  const [mode, setMode] = useState<"live" | "database">("live");

  // Data & Execution State
  const [loading, setLoading] = useState(false);
  const [loadingPool, setLoadingPool] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [niches, setNiches] = useState<NicheRow[]>([]);
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      const res = await fetch("/api/admin/bulk-contacts");
      const data = await res.json();
      if (res.ok && Array.isArray(data.niches)) {
        setNiches(data.niches);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadDatabaseLeads = useCallback(
    async (nicheName: string) => {
      if (!nicheName.trim()) return;
      setLoadingPool(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          industry: nicheName,
          take: "500",
        });
        const res = await fetch(`/api/admin/bulk-contacts?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load contacts");
        setLeads(data.leads ?? []);
        setSelectedIds(new Set());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load database contacts");
      } finally {
        setLoadingPool(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadNiches();
  }, [loadNiches]);

  // When switching to database mode or selecting a known niche in database mode
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
      const res = await fetch("/api/admin/bulk-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...industryPayloadForApi(industrySelect, customIndustry),
          country,
          locationScope,
          state: locationScope === "local" ? state : undefined,
          city: locationScope === "local" ? city : undefined,
          zip: locationScope === "local" ? zip : undefined,
          radius: locationScope === "local" ? radius : undefined,
          targetLeadCount: resolvedTargetCount,
        }),
        signal: AbortSignal.timeout(300000),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Contact search failed");

      const fetchedLeads = (data.leads ?? []) as ContactLead[];
      setLeads(fetchedLeads);

      const emailCount = fetchedLeads.filter((l) => Boolean(l.email)).length;
      const phoneCount = fetchedLeads.filter((l) => Boolean(l.phone)).length;
      const ownerCount = fetchedLeads.filter((l) => Boolean(l.ownerName)).length;

      setResultMessage(
        `Successfully extracted ${fetchedLeads.length} contacts for ${industry}: ${emailCount} emails, ${phoneCount} phones, ${ownerCount} owner names found.`,
      );

      // Promote custom niche into select list
      if (industrySelect === CUSTOM_INDUSTRY_VALUE && industry) {
        setIndustrySelect(industry);
        setCustomIndustry("");
      }

      void loadNiches();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Contact discovery failed");
    } finally {
      setLoading(false);
      stopNavigationProgress();
    }
  }

  // Filter and search logic
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Filter tab check
      if (activeFilter === "has_email" && !lead.email) return false;
      if (activeFilter === "has_phone" && !lead.phone) return false;
      if (activeFilter === "has_name" && !lead.ownerName) return false;
      if (
        activeFilter === "has_social" &&
        !lead.linkedinUrl &&
        !lead.linkedinOwnerUrl &&
        !lead.linkedinCompanyUrl &&
        !lead.facebook &&
        !lead.instagram
      ) {
        return false;
      }

      // Search text check
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase().trim();
        const matchName = lead.ownerName?.toLowerCase().includes(query);
        const matchBiz = lead.businessName?.toLowerCase().includes(query);
        const matchEmail = lead.email?.toLowerCase().includes(query);
        const matchPhone = lead.phone?.toLowerCase().includes(query);
        const matchCity = lead.city?.toLowerCase().includes(query);
        const matchState = lead.state?.toLowerCase().includes(query);
        return matchName || matchBiz || matchEmail || matchPhone || matchCity || matchState;
      }

      return true;
    });
  }, [leads, activeFilter, tableSearch]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = leads.length;
    const withEmail = leads.filter((l) => Boolean(l.email)).length;
    const withPhone = leads.filter((l) => Boolean(l.phone)).length;
    const withOwner = leads.filter((l) => Boolean(l.ownerName)).length;
    const withSocial = leads.filter(
      (l) =>
        Boolean(l.linkedinUrl) ||
        Boolean(l.linkedinOwnerUrl) ||
        Boolean(l.linkedinCompanyUrl) ||
        Boolean(l.facebook) ||
        Boolean(l.instagram),
    ).length;

    return { total, withEmail, withPhone, withOwner, withSocial };
  }, [leads]);

  // Copy Helpers
  const triggerCopyFeedback = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 3500);
  };

  const copyToClipboard = async (text: string, idForIcon?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (idForIcon) {
        setCopiedItemId(idForIcon);
        setTimeout(() => setCopiedItemId(null), 2000);
      }
    } catch {
      /* fallback */
    }
  };

  const copyAllEmails = (selectedOnly = false) => {
    const targetPool = selectedOnly
      ? leads.filter((l) => selectedIds.has(l.id))
      : filteredLeads;
    const emails = targetPool
      .map((l) => l.email?.trim())
      .filter((e): e is string => Boolean(e));
    const unique = Array.from(new Set(emails));
    if (!unique.length) {
      triggerCopyFeedback("No emails found to copy");
      return;
    }
    void copyToClipboard(unique.join(", "));
    triggerCopyFeedback(`Copied ${unique.length} emails to clipboard (comma separated)`);
  };

  const copyAllPhones = (selectedOnly = false) => {
    const targetPool = selectedOnly
      ? leads.filter((l) => selectedIds.has(l.id))
      : filteredLeads;
    const phones = targetPool
      .map((l) => l.phone?.trim())
      .filter((p): p is string => Boolean(p));
    const unique = Array.from(new Set(phones));
    if (!unique.length) {
      triggerCopyFeedback("No phone numbers found to copy");
      return;
    }
    void copyToClipboard(unique.join("\n"));
    triggerCopyFeedback(`Copied ${unique.length} phone numbers to clipboard`);
  };

  // CSV Export Helper
  const exportCsv = (selectedOnly = false) => {
    const targetPool = selectedOnly
      ? leads.filter((l) => selectedIds.has(l.id))
      : filteredLeads;
    if (!targetPool.length) {
      triggerCopyFeedback("No contacts to export");
      return;
    }

    const headers = [
      "Decision Maker Name",
      "Title / Role",
      "Direct Email",
      "Phone Number",
      "Business Name",
      "Website",
      "Industry / Niche",
      "Address",
      "City",
      "State",
      "Zip",
      "Country",
      "Google Rating",
      "Review Count",
      "LinkedIn Profile",
      "Facebook",
      "Instagram",
    ];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = targetPool.map((lead) => [
      escapeCsv(lead.ownerName || ""),
      escapeCsv(lead.ownerTitle || ""),
      escapeCsv(lead.email || ""),
      escapeCsv(lead.phone || ""),
      escapeCsv(lead.businessName || ""),
      escapeCsv(lead.website || ""),
      escapeCsv(lead.industry || ""),
      escapeCsv(lead.address || ""),
      escapeCsv(lead.city || ""),
      escapeCsv(lead.state || ""),
      escapeCsv(lead.zip || ""),
      escapeCsv(lead.country || ""),
      escapeCsv(lead.googleRating ?? ""),
      escapeCsv(lead.reviewCount ?? ""),
      escapeCsv(lead.linkedinOwnerUrl || lead.linkedinUrl || lead.linkedinCompanyUrl || ""),
      escapeCsv(lead.facebook || ""),
      escapeCsv(lead.instagram || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `bulk-contacts-${(activeIndustry || "niche").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerCopyFeedback(`Exported ${targetPool.length} contacts to CSV`);
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-[13px] font-medium text-white shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-3">
          <HiOutlineCheck className="h-4 w-4 text-emerald-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Bulk Email, Phone & Name Finder"
        description="Search any niche to extract bulk verified emails, direct phone numbers, and decision maker names with 1-click export and copy tools."
      />

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setMode("live")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "live"
              ? "bg-brand-500 text-white shadow-sm"
              : "bg-surface-elevated text-ink-muted hover:bg-brand-50 hover:text-ink"
          }`}
        >
          <HiOutlineSparkles className="h-4 w-4" />
          Live Niche Finder & Scraper
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("database");
            if (activeIndustry) void loadDatabaseLeads(activeIndustry);
          }}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            mode === "database"
              ? "bg-brand-500 text-white shadow-sm"
              : "bg-surface-elevated text-ink-muted hover:bg-brand-50 hover:text-ink"
          }`}
        >
          <HiOutlineGlobeAlt className="h-4 w-4" />
          Saved Database Contacts Pool
          {niches.length > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {niches.length} Niches
            </span>
          )}
        </button>
      </div>

      {/* Main Grid: Control Form + Results */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Left Form: Search & Extraction Criteria */}
        <div className="space-y-4 rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="border-b border-border/80 pb-3">
            <h2 className="text-base font-semibold text-ink">
              {mode === "live" ? "Extract Fresh Contacts" : "Filter Database Contacts"}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {mode === "live"
                ? "Discovers businesses and extracts owner names, emails & phones."
                : "Browse all previously enriched contacts stored in your database."}
            </p>
          </div>

          <AdminIndustryField
            label="Target Service / Niche"
            selectValue={industrySelect}
            customValue={customIndustry}
            onSelectChange={(v) => {
              setIndustrySelect(v);
              if (v !== CUSTOM_INDUSTRY_VALUE) {
                setCustomIndustry("");
                if (mode === "database" && v) void loadDatabaseLeads(v);
              }
            }}
            onCustomChange={setCustomIndustry}
            knownNiches={knownNicheNames}
          />

          {mode === "live" && (
            <>
              {/* Country Selection */}
              <label className="block text-[12px]">
                <span className="font-medium text-ink-muted">Country</span>
                <select
                  value={country}
                  onChange={(e) => {
                    const c = e.target.value;
                    setCountry(c);
                    setState("");
                  }}
                  className="mt-1 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand-500"
                >
                  {TIER_ONE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </label>

              {/* Location Scope */}
              <div className="space-y-2">
                <span className="text-[12px] font-medium text-ink-muted">
                  Location Scope
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationScope("local")}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      locationScope === "local"
                        ? "border-brand-500 bg-brand-500/10 text-brand-500"
                        : "border-border bg-surface-elevated text-ink-muted hover:text-ink"
                    }`}
                  >
                    City / State Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationScope("country")}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      locationScope === "country"
                        ? "border-brand-500 bg-brand-500/10 text-brand-500"
                        : "border-border bg-surface-elevated text-ink-muted hover:text-ink"
                    }`}
                  >
                    Country-Wide Hubs
                  </button>
                </div>
              </div>

              {locationScope === "local" && (
                <div className="space-y-3 rounded-xl border border-border/70 bg-surface-elevated/50 p-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[11px]">
                      <span className="font-medium text-ink-muted">
                        {countryMeta?.regionLabel || "State / Region"}
                      </span>
                      {getRegionsForCountry(country).length > 0 ? (
                        <select
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand-500"
                        >
                          <option value="">{getRegionAnyLabel(country)}</option>
                          {getRegionsForCountry(country).map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="e.g. TX or CA"
                          className="mt-1 w-full rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand-500"
                        />
                      )}
                    </label>

                    <label className="block text-[11px]">
                      <span className="font-medium text-ink-muted">City</span>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Austin"
                        className="mt-1 w-full rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand-500"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[11px]">
                      <span className="font-medium text-ink-muted">Postal / Zip</span>
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="e.g. 78701"
                        className="mt-1 w-full rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand-500"
                      />
                    </label>

                    <label className="block text-[11px]">
                      <span className="font-medium text-ink-muted">
                        Radius: {radius} miles
                      </span>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="mt-2 w-full accent-brand-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Target Contacts Count */}
              <div className="space-y-1.5">
                <span className="text-[12px] font-medium text-ink-muted">
                  Target Contacts Count
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[25, 50, 100, 200, 500].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setTargetCount(count);
                        setCustomCount("");
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        targetCount === count
                          ? "border-brand-500 bg-brand-500/15 text-brand-500 font-bold"
                          : "border-border bg-surface-elevated text-ink-muted hover:text-ink"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTargetCount(-1)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      targetCount === -1
                        ? "border-brand-500 bg-brand-500/15 text-brand-500 font-bold"
                        : "border-border bg-surface-elevated text-ink-muted hover:text-ink"
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {targetCount === -1 && (
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={customCount}
                    onChange={(e) => setCustomCount(e.target.value)}
                    placeholder="Enter count (1 - 1000)"
                    className="mt-1 w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-ink outline-none focus:border-brand-500"
                  />
                )}
              </div>

              {/* Action Button */}
              <Button
                type="button"
                disabled={loading}
                onClick={runFinder}
                className="w-full bg-brand-500 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                    Extracting Contacts...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <HiOutlineSparkles className="h-4 w-4" />
                    Extract Bulk Contacts ({resolvedTargetCount})
                  </span>
                )}
              </Button>
            </>
          )}

          {mode === "database" && (
            <div className="space-y-2">
              <Button
                type="button"
                disabled={loadingPool || !activeIndustry}
                onClick={() => void loadDatabaseLeads(activeIndustry)}
                className="w-full bg-brand-500 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600"
              >
                {loadingPool ? (
                  <span className="flex items-center gap-2">
                    <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                    Loading Database Contacts...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <HiOutlineArrowPath className="h-4 w-4" />
                    Load Database Contacts for {activeIndustry || "Niche"}
                  </span>
                )}
              </Button>

              {niches.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    Available Niches in Database
                  </p>
                  <div className="scrollbar-thin max-h-48 space-y-1 overflow-y-auto pr-1">
                    {niches.map((n) => (
                      <button
                        key={n.name}
                        type="button"
                        onClick={() => {
                          setIndustrySelect(n.name);
                          setCustomIndustry("");
                          void loadDatabaseLeads(n.name);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition ${
                          activeIndustry === n.name
                            ? "bg-brand-500/15 font-semibold text-brand-500"
                            : "text-ink-muted hover:bg-brand-50 hover:text-ink"
                        }`}
                      >
                        <span className="truncate">{n.name}</span>
                        <span className="ml-2 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] tabular-nums text-ink-muted">
                          {n.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {resultMessage && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
              {resultMessage}
            </div>
          )}
        </div>

        {/* Right Section: Contacts Dashboard & Results */}
        <div className="space-y-4">
          {/* Top Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <AdminStatCard
              label="Total Contacts"
              value={stats.total}
              hint={`${filteredLeads.length} currently shown`}
              compact
            />
            <AdminStatCard
              label="Direct Emails"
              value={stats.withEmail}
              hint={
                stats.total > 0
                  ? `${Math.round((stats.withEmail / stats.total) * 100)}% match rate`
                  : undefined
              }
              compact
            />
            <AdminStatCard
              label="Direct Phones"
              value={stats.withPhone}
              hint={
                stats.total > 0
                  ? `${Math.round((stats.withPhone / stats.total) * 100)}% match rate`
                  : undefined
              }
              compact
            />
            <AdminStatCard
              label="Owner / Decision Maker"
              value={stats.withOwner}
              hint={
                stats.total > 0
                  ? `${Math.round((stats.withOwner / stats.total) * 100)}% identified`
                  : undefined
              }
              compact
            />
          </div>

          {/* Action Toolbar & Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1">
                {[
                  { key: "all", label: `All (${stats.total})` },
                  { key: "has_email", label: `With Email (${stats.withEmail})` },
                  { key: "has_phone", label: `With Phone (${stats.withPhone})` },
                  { key: "has_name", label: `With Name (${stats.withOwner})` },
                  { key: "has_social", label: `With Social (${stats.withSocial})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key as FilterTab)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      activeFilter === tab.key
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-surface-elevated text-ink-muted hover:bg-brand-50 hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-elevated p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`rounded-md p-1.5 text-xs ${
                    viewMode === "table"
                      ? "bg-[var(--surface)] text-brand-500 shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  title="Table View"
                >
                  <HiOutlineTableCells className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`rounded-md p-1.5 text-xs ${
                    viewMode === "cards"
                      ? "bg-[var(--surface)] text-brand-500 shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  }`}
                  title="Card View"
                >
                  <HiOutlineSquares2X2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Search + Bulk Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
              {/* Search within leads */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Search name, email, phone, city..."
                  className="w-full rounded-lg border border-border bg-surface-elevated pl-8 pr-3 py-1.5 text-xs text-ink outline-none focus:border-brand-500"
                />
              </div>

              {/* Bulk Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyAllEmails(false)}
                  disabled={!filteredLeads.length}
                  className="h-8 gap-1.5 text-xs"
                >
                  <HiOutlineEnvelope className="h-3.5 w-3.5 text-brand-500" />
                  Copy All Emails
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyAllPhones(false)}
                  disabled={!filteredLeads.length}
                  className="h-8 gap-1.5 text-xs"
                >
                  <HiOutlinePhone className="h-3.5 w-3.5 text-emerald-500" />
                  Copy All Phones
                </Button>

                <Button
                  type="button"
                  onClick={() => exportCsv(false)}
                  disabled={!filteredLeads.length}
                  className="h-8 gap-1.5 bg-brand-500 text-xs font-semibold text-white shadow-sm hover:bg-brand-600"
                >
                  <HiOutlineDocumentArrowDown className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Selected Count Banner */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-brand-500/10 px-3.5 py-2 text-xs font-medium text-brand-500 animate-in fade-in">
                <span>{selectedIds.size} contacts selected</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyAllEmails(true)}
                    className="font-semibold underline hover:text-brand-600"
                  >
                    Copy Selected Emails
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => copyAllPhones(true)}
                    className="font-semibold underline hover:text-brand-600"
                  >
                    Copy Selected Phones
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => exportCsv(true)}
                    className="font-semibold underline hover:text-brand-600"
                  >
                    Export Selected CSV
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Display */}
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-[var(--surface)] p-12 text-center">
              <HiOutlineUser className="h-10 w-10 text-ink-muted/50" />
              <p className="mt-3 text-sm font-semibold text-ink">
                No contacts found
              </p>
              <p className="mt-1 max-w-sm text-xs text-ink-muted">
                {mode === "live"
                  ? "Select a niche on the left and click 'Extract Bulk Contacts' to run search."
                  : "Pick a niche or load database contacts to browse saved leads."}
              </p>
            </div>
          ) : viewMode === "table" ? (
            /* Table View */
            <div className="overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-[var(--shadow-card)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface-elevated/70 text-[11px] font-semibold text-ink-muted">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.size === filteredLeads.length &&
                            filteredLeads.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded border-border accent-brand-500"
                        />
                      </th>
                      <th className="p-3 min-w-[180px]">Contact Person / Owner</th>
                      <th className="p-3 min-w-[200px]">Direct Email</th>
                      <th className="p-3 min-w-[150px]">Phone Number</th>
                      <th className="p-3 min-w-[200px]">Company & Website</th>
                      <th className="p-3 min-w-[140px]">Location</th>
                      <th className="p-3 min-w-[100px] text-center">Socials</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLeads.map((lead) => {
                      const isSelected = selectedIds.has(lead.id);
                      const emailCopied = copiedItemId === `email-${lead.id}`;
                      const phoneCopied = copiedItemId === `phone-${lead.id}`;

                      return (
                        <tr
                          key={lead.id}
                          className={`transition hover:bg-brand-50/50 ${
                            isSelected ? "bg-brand-500/5" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(lead.id)}
                              className="h-3.5 w-3.5 rounded border-border accent-brand-500"
                            />
                          </td>

                          {/* Contact Person */}
                          <td className="p-3">
                            {lead.ownerName ? (
                              <div>
                                <p className="font-semibold text-ink">
                                  {lead.ownerName}
                                </p>
                                <p className="text-[11px] text-ink-muted">
                                  {lead.ownerTitle || "Decision Maker"}
                                  {lead.ownerConfidence ? (
                                    <span className="ml-1 text-[10px] text-brand-500">
                                      ({lead.ownerConfidence}%)
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                            ) : (
                              <span className="italic text-ink-muted/60">
                                Unspecified
                              </span>
                            )}
                          </td>

                          {/* Email */}
                          <td className="p-3">
                            {lead.email ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="truncate font-medium text-brand-500 hover:underline"
                                  title={lead.email}
                                >
                                  {lead.email}
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyToClipboard(
                                      lead.email || "",
                                      `email-${lead.id}`,
                                    )
                                  }
                                  className="shrink-0 rounded p-1 text-ink-muted hover:bg-brand-50 hover:text-ink"
                                  title="Copy Email"
                                >
                                  {emailCopied ? (
                                    <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <HiOutlineClipboardDocument className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="italic text-ink-muted/50">—</span>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="p-3">
                            {lead.phone ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${lead.phone}`}
                                  className="truncate tabular-nums text-ink font-medium hover:text-brand-500"
                                >
                                  {lead.phone}
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void copyToClipboard(
                                      lead.phone || "",
                                      `phone-${lead.id}`,
                                    )
                                  }
                                  className="shrink-0 rounded p-1 text-ink-muted hover:bg-brand-50 hover:text-ink"
                                  title="Copy Phone"
                                >
                                  {phoneCopied ? (
                                    <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <HiOutlineClipboardDocument className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="italic text-ink-muted/50">—</span>
                            )}
                          </td>

                          {/* Company & Website */}
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-ink">
                                {lead.businessName}
                              </p>
                              {lead.website ? (
                                <a
                                  href={
                                    lead.website.startsWith("http")
                                      ? lead.website
                                      : `https://${lead.website}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-brand-500"
                                >
                                  <HiOutlineGlobeAlt className="h-3 w-3" />
                                  <span className="truncate max-w-[160px]">
                                    {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                                  </span>
                                </a>
                              ) : null}
                            </div>
                          </td>

                          {/* Location */}
                          <td className="p-3 text-ink-muted">
                            {[lead.city, lead.state, lead.country]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>

                          {/* Socials */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 text-ink-muted">
                              {(lead.linkedinOwnerUrl ||
                                lead.linkedinUrl ||
                                lead.linkedinCompanyUrl) && (
                                <a
                                  href={
                                    lead.linkedinOwnerUrl ||
                                    lead.linkedinUrl ||
                                    lead.linkedinCompanyUrl ||
                                    "#"
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:opacity-80"
                                  title="LinkedIn"
                                >
                                  <FaLinkedin className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {lead.facebook && (
                                <a
                                  href={lead.facebook}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-500 hover:opacity-80"
                                  title="Facebook"
                                >
                                  <FaFacebook className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {lead.instagram && (
                                <a
                                  href={lead.instagram}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-pink-600 hover:opacity-80"
                                  title="Instagram"
                                >
                                  <FaInstagram className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card Grid View */
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredLeads.map((lead) => {
                const isSelected = selectedIds.has(lead.id);
                const emailCopied = copiedItemId === `email-${lead.id}`;
                const phoneCopied = copiedItemId === `phone-${lead.id}`;

                return (
                  <div
                    key={lead.id}
                    className={`relative rounded-2xl border p-4 shadow-[var(--shadow-card)] transition ${
                      isSelected
                        ? "border-brand-500 bg-brand-500/5 ring-1 ring-brand-500"
                        : "border-border bg-[var(--surface)] hover:border-brand-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                          {lead.industry || "Contact"}
                        </span>
                        <h3 className="truncate text-sm font-semibold text-ink">
                          {lead.businessName}
                        </h3>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(lead.id)}
                        className="mt-1 h-4 w-4 rounded border-border accent-brand-500"
                      />
                    </div>

                    {/* Owner / Decision Maker */}
                    <div className="mt-3 rounded-xl border border-border/70 bg-surface-elevated/50 p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                        Decision Maker
                      </p>
                      {lead.ownerName ? (
                        <p className="mt-0.5 font-semibold text-ink">
                          {lead.ownerName}{" "}
                          <span className="text-xs font-normal text-ink-muted">
                            ({lead.ownerTitle || "Owner"})
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs italic text-ink-muted/60">
                          Not identified
                        </p>
                      )}
                    </div>

                    {/* Contact Channels */}
                    <div className="mt-3 space-y-2 text-xs">
                      {/* Email */}
                      <div className="flex items-center justify-between rounded-lg bg-surface-elevated px-2.5 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <HiOutlineEnvelope className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="truncate text-ink font-medium hover:underline"
                            >
                              {lead.email}
                            </a>
                          ) : (
                            <span className="italic text-ink-muted/50">
                              No email
                            </span>
                          )}
                        </div>
                        {lead.email && (
                          <button
                            type="button"
                            onClick={() =>
                              void copyToClipboard(
                                lead.email || "",
                                `email-${lead.id}`,
                              )
                            }
                            className="p-1 text-ink-muted hover:text-ink"
                          >
                            {emailCopied ? (
                              <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <HiOutlineClipboardDocument className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="flex items-center justify-between rounded-lg bg-surface-elevated px-2.5 py-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <HiOutlinePhone className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="truncate tabular-nums text-ink font-medium"
                            >
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="italic text-ink-muted/50">
                              No phone
                            </span>
                          )}
                        </div>
                        {lead.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              void copyToClipboard(
                                lead.phone || "",
                                `phone-${lead.id}`,
                              )
                            }
                            className="p-1 text-ink-muted hover:text-ink"
                          >
                            {phoneCopied ? (
                              <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <HiOutlineClipboardDocument className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Footer with location & socials */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2 text-[11px] text-ink-muted">
                      <span className="truncate">
                        {[lead.city, lead.state].filter(Boolean).join(", ") ||
                          lead.country ||
                          "—"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(lead.linkedinOwnerUrl ||
                          lead.linkedinUrl ||
                          lead.linkedinCompanyUrl) && (
                          <a
                            href={
                              lead.linkedinOwnerUrl ||
                              lead.linkedinUrl ||
                              lead.linkedinCompanyUrl ||
                              "#"
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:opacity-80"
                          >
                            <FaLinkedin className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {lead.facebook && (
                          <a
                            href={lead.facebook}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:opacity-80"
                          >
                            <FaFacebook className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {lead.website && (
                          <a
                            href={
                              lead.website.startsWith("http")
                                ? lead.website
                                : `https://${lead.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink-muted hover:text-brand-500"
                          >
                            <HiOutlineGlobeAlt className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
