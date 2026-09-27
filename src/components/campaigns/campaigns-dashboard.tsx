"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowPath,
  HiOutlineBookmark,
  HiOutlineChartBar,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineDocumentDuplicate,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineFire,
  HiOutlineGlobeAmericas,
  HiOutlineMagnifyingGlass,
  HiOutlinePause,
  HiOutlinePencilSquare,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineQueueList,
  HiOutlineSparkles,
  HiOutlineStop,
  HiOutlineTrash,
  HiOutlineUsers,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

type CampaignItem = {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "stopped";
  industry: string | null;
  country: string;
  state: string | null;
  city: string | null;
  timezone: string;
  useRecipientTimezone: boolean;
  scheduledStartDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  leadCount: number;
  uniqueEmailCount: number;
  duplicateDetectedCount: number;
  segment?: { id: string; name: string; industry: string | null } | null;
  stats: {
    total: number;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
    unsubscribed: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
};

export function CampaignsDashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCampaigns();
  }, []);

  async function handleCampaignAction(id: string, action: "launch" | "pause" | "resume" | "stop") {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadCampaigns();
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.campaign?.id) {
        router.push(`/campaigns/${data.campaign.id}`);
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoadingId(null);
    }
  }

  // Filtered campaigns
  const filtered = campaigns.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchIndustry = (c.industry || "").toLowerCase().includes(q);
      const matchCity = (c.city || "").toLowerCase().includes(q);
      const matchState = (c.state || "").toLowerCase().includes(q);
      if (!matchName && !matchIndustry && !matchCity && !matchState) return false;
    }
    return true;
  });

  // Calculate high level totals
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalLeadsEnrolled = campaigns.reduce((sum, c) => sum + (c.uniqueEmailCount || c.stats.total), 0);
  const totalSent = campaigns.reduce((sum, c) => sum + c.stats.sent, 0);
  const totalReplies = campaigns.reduce((sum, c) => sum + c.stats.replied, 0);
  const overallReplyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top High-Level Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Active Campaigns</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <HiOutlineFire className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink">{activeCampaigns}</span>
            <span className="text-xs text-ink-muted">of {totalCampaigns} total</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Prospects Enrolled</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <HiOutlineUsers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink">{totalLeadsEnrolled.toLocaleString()}</span>
            <span className="text-xs text-ink-muted">leads targeted</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Emails Delivered</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <HiOutlineEnvelope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink">{totalSent.toLocaleString()}</span>
            <span className="text-xs text-ink-muted">outreach & follow-ups</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Total Replies</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <HiOutlineChartBar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink">{totalReplies}</span>
            <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              {overallReplyRate}% rate
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search campaigns, industries, cities…"
              className="saas-input w-full pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "scheduled", label: "Scheduled" },
              { id: "paused", label: "Paused" },
              { id: "completed", label: "Completed" },
              { id: "draft", label: "Drafts" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                  filterStatus === st.id
                    ? "bg-[#1a1224] text-white dark:bg-brand-600"
                    : "text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadCampaigns()}
            className="rounded-xl border border-border p-2.5 text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink transition"
            title="Refresh campaigns"
          >
            <HiOutlineArrowPath className="h-4 w-4" />
          </button>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            <HiOutlinePlus className="h-4 w-4" /> Create Campaign
          </Link>
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-12 text-center text-sm text-ink-muted">
          <HiOutlineSparkles className="mx-auto mb-3 h-6 w-6 animate-spin text-brand-600" />
          Loading campaigns…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-[var(--surface)] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <HiOutlineEnvelope className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-ink">No campaigns found</h3>
          <p className="mt-1 text-xs text-ink-muted max-w-md mx-auto">
            {searchTerm || filterStatus !== "all"
              ? "No campaigns match your filter criteria."
              : "Launch an outreach campaign from your saved lead segments with Day 0 multi-hooks and automated follow-ups."}
          </p>
          <Link
            href="/campaigns/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
          >
            <HiOutlinePlus className="h-4 w-4" /> Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => {
            const isLoading = actionLoadingId === c.id;
            const openRate = c.stats.sent > 0 ? Math.round((c.stats.opened / c.stats.sent) * 100) : 0;
            const replyRate = c.stats.sent > 0 ? Math.round((c.stats.replied / c.stats.sent) * 100) : 0;
            const bounceRate = c.stats.sent > 0 ? Math.round((c.stats.bounced / c.stats.sent) * 100) : 0;

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-[var(--shadow-card)] transition hover:border-brand-300 dark:hover:border-brand-500/30"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="font-bold text-base text-ink hover:text-brand-600 transition"
                        >
                          {c.name}
                        </Link>
                        <StatusBadge status={c.status} />
                        {c.segment && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--input-bg)] border border-border px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                            <HiOutlineBookmark className="h-3 w-3 text-brand-600" />
                            {c.segment.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                        <span>Industry: <strong className="text-ink">{c.industry || "All"}</strong></span>
                        <span>•</span>
                        <span>
                          Location: <strong className="text-ink">{c.city ? `${c.city}, ${c.state || c.country}` : c.state || c.country}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Timezone: <strong className="text-ink">{c.useRecipientTimezone ? "Recipient Local Time" : c.timezone.split("/").pop()?.replace(/_/g, " ")}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Controls */}
                    <div className="flex items-center gap-1.5">
                      {c.status === "active" && (
                        <button
                          type="button"
                          onClick={() => handleCampaignAction(c.id, "pause")}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        >
                          <HiOutlinePause className="h-3.5 w-3.5" /> Pause
                        </button>
                      )}

                      {(c.status === "paused" || c.status === "draft" || c.status === "scheduled") && (
                        <button
                          type="button"
                          onClick={() => handleCampaignAction(c.id, "launch")}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <HiOutlinePlay className="h-3.5 w-3.5" /> Launch Now
                        </button>
                      )}

                      <Link
                        href={`/campaigns/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-xl border border-border bg-[var(--input-bg)] px-3 py-1.5 text-xs font-semibold text-ink hover:bg-[var(--surface)] transition"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5" /> Analytics
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDuplicate(c.id)}
                        disabled={isLoading}
                        className="rounded-xl border border-border p-1.5 text-ink-muted hover:text-ink hover:bg-[var(--input-bg)] transition"
                        title="Duplicate Campaign"
                      >
                        <HiOutlineDocumentDuplicate className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={isLoading}
                        className="rounded-xl border border-border p-1.5 text-ink-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Delete Campaign"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Performance Matrix Bar */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 rounded-xl border border-border/70 bg-[var(--input-bg)] p-3">
                    <div>
                      <span className="text-[10px] font-bold text-ink-muted uppercase block">Total Leads</span>
                      <span className="text-xs font-bold text-ink">{c.uniqueEmailCount || c.leadCount}</span>
                      {c.duplicateDetectedCount > 0 && (
                        <span className="text-[10px] text-emerald-600 block">(-{c.duplicateDetectedCount} dupes)</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-ink-muted uppercase block">Sent</span>
                      <span className="text-xs font-bold text-ink">{c.stats.sent}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-ink-muted uppercase block">Opens</span>
                      <span className="text-xs font-bold text-ink">{c.stats.opened} ({openRate}%)</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-ink-muted uppercase block">Clicks</span>
                      <span className="text-xs font-bold text-ink">{c.stats.clicked}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-ink-muted uppercase block">Replies</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {c.stats.replied} ({replyRate}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-ink-muted uppercase block">Bounced</span>
                      <span className={cn("text-xs font-bold", bounceRate > 5 ? "text-rose-600" : "text-ink")}>
                        {c.stats.bounced} ({bounceRate}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Active
        </span>
      );
    case "scheduled":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          <HiOutlineClock className="h-3 w-3" />
          Scheduled
        </span>
      );
    case "paused":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <HiOutlinePause className="h-3 w-3" />
          Paused
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
          <HiOutlineCheckBadge className="h-3 w-3" />
          Completed
        </span>
      );
    case "stopped":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <HiOutlineStop className="h-3 w-3" />
          Stopped
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          Draft
        </span>
      );
  }
}
