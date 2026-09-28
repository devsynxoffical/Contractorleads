"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineBookmark,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineUsers,
  HiOutlineEnvelope,
  HiOutlineCheck,
  HiOutlineFunnel,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SegmentItem = {
  id: string;
  name: string;
  industry: string | null;
  country: string;
  state: string | null;
  city: string | null;
  leadCount: number;
  when: string | null;
  tier: string | null;
  strength: string | null;
  createdAt: string;
  _count?: {
    campaigns: number;
  };
};

type LeadPickerItem = {
  id: string;
  businessName: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  qualityTier: string | null;
  leadScore: number;
};

const COMMON_INDUSTRIES = [
  "Roofing",
  "HVAC",
  "Plumbing",
  "Solar",
  "Electrical",
  "Landscaping",
  "General Contractor",
  "Painting",
  "Flooring",
  "Remodeling",
];

export function SegmentsDashboard() {
  const router = useRouter();
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");

  // Create Segment Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form Fields
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newIndustry, setNewIndustry] = useState("Roofing");
  const [newCountry, setNewCountry] = useState("US");
  const [newState, setNewState] = useState("");
  const [newCity, setNewCity] = useState("");

  // Lead Selection
  const [availableLeads, setAvailableLeads] = useState<LeadPickerItem[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [onlyWithEmail, setOnlyWithEmail] = useState(true);

  // View Leads in Segment Modal
  const [viewSegment, setViewSegment] = useState<SegmentItem | null>(null);
  const [segmentLeads, setSegmentLeads] = useState<LeadPickerItem[]>([]);
  const [segmentLeadsLoading, setSegmentLeadsLoading] = useState(false);

  // Load segments
  async function loadSegments() {
    setLoading(true);
    try {
      const res = await fetch("/api/segments");
      const data = await res.json();
      if (res.ok && Array.isArray(data.segments)) {
        setSegments(data.segments);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSegments();
  }, []);

  // Fetch leads for lead picker
  async function fetchLeadsForPicker() {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "150",
      });
      if (newIndustry && newIndustry !== "all") params.set("industry", newIndustry);
      if (leadSearch.trim()) params.set("q", leadSearch.trim());

      const res = await fetch(`/api/segments/leads?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.leads)) {
        setAvailableLeads(data.leads);
        // Pre-select all available leads with emails
        const emailable = data.leads.filter((l: LeadPickerItem) => Boolean(l.email)).map((l: LeadPickerItem) => l.id);
        setSelectedLeadIds(new Set(emailable));
      }
    } catch {
      /* ignore */
    } finally {
      setLeadsLoading(false);
    }
  }

  // Open Create Modal
  function handleOpenCreate() {
    const todayStr = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
    }).format(new Date());
    setNewSegmentName(`${todayStr} – ${newIndustry} Leads`);
    setModalStep(1);
    setCreateError(null);
    setCreateOpen(true);
  }

  // Handle proceed to choose leads
  function handleProceedToLeads() {
    if (!newSegmentName.trim()) {
      setCreateError("Please enter a segment name.");
      return;
    }
    setCreateError(null);
    setModalStep(2);
    void fetchLeadsForPicker();
  }

  // Toggle single lead checkbox
  function toggleLead(id: string) {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Toggle all visible leads
  function toggleAllVisible() {
    const visibleIds = filteredPickerLeads.map((l) => l.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedLeadIds.has(id));
    if (allSelected) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(visibleIds));
    }
  }

  // Create Segment API call
  async function handleSaveSegment(andLaunchCampaign: boolean = false) {
    if (!newSegmentName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const leadIds = Array.from(selectedLeadIds);
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSegmentName.trim(),
          industry: newIndustry || null,
          country: newCountry || "US",
          state: newState.trim() || null,
          city: newCity.trim() || null,
          leadCount: leadIds.length,
          leadIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create segment");

      setCreateOpen(false);
      await loadSegments();

      if (andLaunchCampaign && data.segment?.id) {
        router.push(`/campaigns/new?segmentId=${data.segment.id}`);
      }
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create segment");
    } finally {
      setCreating(false);
    }
  }

  // Delete Segment API call
  async function handleDeleteSegment(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete segment "${name}"?`)) return;
    try {
      const res = await fetch(`/api/segments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSegments((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      /* ignore */
    }
  }

  // View leads in segment
  async function handleViewLeads(seg: SegmentItem) {
    setViewSegment(seg);
    setSegmentLeadsLoading(true);
    try {
      const res = await fetch(`/api/segments/leads?segmentId=${encodeURIComponent(seg.id)}&limit=150`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.leads)) {
        setSegmentLeads(data.leads);
      } else {
        setSegmentLeads([]);
      }
    } catch {
      setSegmentLeads([]);
    } finally {
      setSegmentLeadsLoading(false);
    }
  }

  // Filtered segments list
  const filteredSegments = useMemo(() => {
    return segments.filter((s) => {
      if (industryFilter !== "all" && s.industry?.toLowerCase() !== industryFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesIndustry = s.industry?.toLowerCase().includes(q);
        const matchesLocation = (s.city || "").toLowerCase().includes(q) || (s.state || "").toLowerCase().includes(q);
        if (!matchesName && !matchesIndustry && !matchesLocation) return false;
      }
      return true;
    });
  }, [segments, industryFilter, searchQuery]);

  // Filtered leads in picker modal
  const filteredPickerLeads = useMemo(() => {
    return availableLeads.filter((l) => {
      if (onlyWithEmail && (!l.email || !l.email.includes("@"))) return false;
      if (leadSearch.trim()) {
        const q = leadSearch.toLowerCase();
        const match =
          l.businessName.toLowerCase().includes(q) ||
          (l.ownerName || "").toLowerCase().includes(q) ||
          (l.city || "").toLowerCase().includes(q) ||
          (l.state || "").toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [availableLeads, onlyWithEmail, leadSearch]);

  const totalLeadsInSegments = segments.reduce((acc, s) => acc + (s.leadCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
              <HiOutlineBookmark className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Lead Lists &amp; Segments</h1>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            Organize contractor leads into targeted segments, filter lists, and launch multi-hook outreach campaigns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 shadow-sm"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Create New Segment
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Total Segments</div>
          <div className="mt-1.5 text-2xl font-extrabold text-ink">{segments.length}</div>
          <div className="mt-1 text-[11px] text-ink-muted">Saved lead lists</div>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Total Segment Leads</div>
          <div className="mt-1.5 text-2xl font-extrabold text-brand-600">{totalLeadsInSegments.toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-ink-muted">Organized contractor leads</div>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Outreach Ready</div>
          <div className="mt-1.5 text-2xl font-extrabold text-emerald-600">
            {segments.filter((s) => (s.leadCount || 0) > 0).length}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">Ready for multi-hook campaigns</div>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">Active Campaigns</div>
          <div className="mt-1.5 text-2xl font-extrabold text-indigo-600">
            {segments.reduce((acc, s) => acc + (s._count?.campaigns || 0), 0)}
          </div>
          <div className="mt-1 text-[11px] text-ink-muted">Connected email series</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search segments by name, industry, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="saas-input w-full pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="saas-input text-xs font-semibold"
          >
            <option value="all">All Industries ({segments.length})</option>
            {COMMON_INDUSTRIES.map((ind) => (
              <option key={ind} value={ind.toLowerCase()}>
                {ind}
              </option>
            ))}
          </select>

          {(searchQuery || industryFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIndustryFilter("all");
              }}
              className="text-xs font-semibold text-brand-600 hover:underline px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Segments Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-border bg-[var(--surface)] p-5 animate-pulse" />
          ))}
        </div>
      ) : filteredSegments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSegments.map((seg) => {
            const loc = [seg.city, seg.state, seg.country].filter(Boolean).join(", ");
            const hasCampaigns = (seg._count?.campaigns ?? 0) > 0;

            return (
              <div
                key={seg.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-xs transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-500/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🎯</span>
                        <h3 className="font-bold text-ink truncate text-[14px]" title={seg.name}>
                          {seg.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-[11px] text-ink-muted flex items-center gap-1.5">
                        <HiOutlineCalendar className="h-3.5 w-3.5" />
                        Created {new Date(seg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSegment(seg.id, seg.name)}
                      className="rounded-lg p-1.5 text-ink-muted opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete Segment"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Metadata badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {seg.industry && (
                      <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                        🔨 {seg.industry}
                      </span>
                    )}
                    {loc && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--input-bg)] px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                        <HiOutlineMapPin className="h-3 w-3" />
                        {loc}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <HiOutlineUsers className="h-3 w-3" />
                      {seg.leadCount || 0} Leads
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-5 pt-3 border-t border-border/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewLeads(seg)}
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-[var(--input-bg)] px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--surface)] transition"
                  >
                    <HiOutlineEye className="h-3.5 w-3.5 text-ink-muted" />
                    View Leads
                  </button>

                  <Link href={`/campaigns/new?segmentId=${seg.id}`}>
                    <Button size="sm" className="gap-1.5 text-xs">
                      <HiOutlinePaperAirplane className="h-3.5 w-3.5" />
                      Launch Campaign
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 mb-3">
              <HiOutlineBookmark className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-ink">No lead segments found</h3>
            <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
              {searchQuery || industryFilter !== "all"
                ? "No segments match your current filters. Try clearing search criteria."
                : "Create your first segment by selecting leads from your database or saving a lead search."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
                <HiOutlinePlus className="h-4 w-4" />
                Create New Segment
              </Button>
              <Link href="/leads/search">
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <HiOutlineMagnifyingGlass className="h-4 w-4" />
                  Scrape Leads First
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE NEW SEGMENT MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <span>🎯</span>
                  {modalStep === 1 ? "Create Lead List / Segment" : "Select Leads for Segment"}
                </h3>
                <p className="text-xs text-ink-muted">
                  {modalStep === 1
                    ? "Step 1 of 2: Define segment name, trade industry, and location"
                    : "Step 2 of 2: Choose leads to include in this custom outreach list"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {createError && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700 font-semibold">
                  {createError}
                </div>
              )}

              {modalStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Custom List / Segment Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newSegmentName}
                      onChange={(e) => setNewSegmentName(e.target.value)}
                      placeholder="e.g. 28 Sep – Roofing – Florida 100 Leads"
                      className="saas-input w-full font-semibold"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Industry / Trade</label>
                      <select
                        value={newIndustry}
                        onChange={(e) => {
                          setNewIndustry(e.target.value);
                          const todayStr = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(new Date());
                          setNewSegmentName(`${todayStr} – ${e.target.value} Leads`);
                        }}
                        className="saas-input w-full font-medium"
                      >
                        {COMMON_INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Target Country</label>
                      <select
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                        className="saas-input w-full font-medium"
                      >
                        <option value="US">United States (US)</option>
                        <option value="CA">Canada (CA)</option>
                        <option value="GB">United Kingdom (UK)</option>
                        <option value="AU">Australia (AU)</option>
                        <option value="NZ">New Zealand (NZ)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">State / Province (Optional)</label>
                      <input
                        type="text"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        placeholder="e.g. Florida, Texas, California"
                        className="saas-input w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">City / Region (Optional)</label>
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="e.g. Miami, Dallas, Los Angeles"
                        className="saas-input w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                      <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="text"
                        placeholder="Filter leads by business, owner, city..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="saas-input w-full pl-8 text-xs"
                      />
                    </div>

                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyWithEmail}
                        onChange={(e) => setOnlyWithEmail(e.target.checked)}
                        className="rounded border-border accent-brand-600"
                      />
                      <span>Only with Email</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-y border-border py-2 text-xs">
                    <label className="flex items-center gap-2 font-bold text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          filteredPickerLeads.length > 0 &&
                          filteredPickerLeads.every((l) => selectedLeadIds.has(l.id))
                        }
                        onChange={toggleAllVisible}
                        className="rounded border-border accent-brand-600"
                      />
                      <span>Select All Filtered ({filteredPickerLeads.length})</span>
                    </label>

                    <div className="font-bold text-brand-600">
                      {selectedLeadIds.size} leads selected
                    </div>
                  </div>

                  {leadsLoading ? (
                    <div className="py-12 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                      <HiOutlineArrowPath className="h-4 w-4 animate-spin text-brand-600" />
                      Loading leads from database...
                    </div>
                  ) : filteredPickerLeads.length > 0 ? (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {filteredPickerLeads.map((lead) => {
                        const checked = selectedLeadIds.has(lead.id);
                        return (
                          <label
                            key={lead.id}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs cursor-pointer transition",
                              checked
                                ? "border-brand-300 bg-brand-50/60 dark:bg-brand-950/40"
                                : "border-border bg-[var(--surface)] hover:bg-[var(--input-bg)]"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleLead(lead.id)}
                                className="rounded border-border accent-brand-600"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-ink truncate">{lead.businessName}</div>
                                <div className="text-[11px] text-ink-muted truncate">
                                  {[lead.ownerName, lead.city, lead.state].filter(Boolean).join(" · ") || "No location"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {lead.email ? (
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 truncate max-w-[140px]">
                                  ✉️ {lead.email}
                                </span>
                              ) : (
                                <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  No email
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-brand-600">
                                Score {lead.leadScore}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-ink-muted">
                      No leads found matching criteria.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-[var(--surface)]">
              {modalStep === 2 ? (
                <button
                  type="button"
                  onClick={() => setModalStep(1)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
                >
                  Back to Details
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
                >
                  Cancel
                </button>

                {modalStep === 1 ? (
                  <Button size="sm" onClick={handleProceedToLeads}>
                    Choose Leads →
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={creating}
                      disabled={creating || selectedLeadIds.size === 0}
                      onClick={() => handleSaveSegment(false)}
                    >
                      Save Segment ({selectedLeadIds.size})
                    </Button>
                    <Button
                      size="sm"
                      loading={creating}
                      disabled={creating || selectedLeadIds.size === 0}
                      onClick={() => handleSaveSegment(true)}
                    >
                      🚀 Save &amp; Launch Campaign
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW LEADS IN SEGMENT MODAL */}
      {viewSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <span>🎯</span>
                  {viewSegment.name}
                </h3>
                <p className="text-xs text-ink-muted">
                  Showing leads included in this segment ({segmentLeads.length} total)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewSegment(null)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-2">
              {segmentLeadsLoading ? (
                <div className="py-16 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                  <HiOutlineArrowPath className="h-4 w-4 animate-spin text-brand-600" />
                  Loading segment leads...
                </div>
              ) : segmentLeads.length > 0 ? (
                segmentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-[var(--input-bg)] p-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-ink">{lead.businessName}</div>
                      <div className="mt-0.5 text-[11px] text-ink-muted">
                        {[lead.ownerName, lead.city, lead.state].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {lead.email ? (
                        <span className="rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ✉️ {lead.email}
                        </span>
                      ) : (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                          No email
                        </span>
                      )}
                      {lead.phone && (
                        <span className="text-[11px] text-ink-muted">📞 {lead.phone}</span>
                      )}
                      <span className="text-xs font-bold text-brand-600">Score {lead.leadScore}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-ink-muted">
                  No leads found in this segment.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-[var(--surface)]">
              <button
                type="button"
                onClick={() => setViewSegment(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
              >
                Close
              </button>

              <Link href={`/campaigns/new?segmentId=${viewSegment.id}`}>
                <Button size="sm" className="gap-1.5">
                  <HiOutlinePaperAirplane className="h-4 w-4" />
                  Create Campaign from this Segment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
