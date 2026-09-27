"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineBolt,
  HiOutlineBookmark,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineDocumentDuplicate,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineFire,
  HiOutlineGlobeAmericas,
  HiOutlineMagnifyingGlass,
  HiOutlineNoSymbol,
  HiOutlinePaperAirplane,
  HiOutlinePause,
  HiOutlinePencilSquare,
  HiOutlinePlay,
  HiOutlineQueueList,
  HiOutlineSparkles,
  HiOutlineStop,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

type CampaignDetail = {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "active" | "paused" | "completed" | "stopped";
  industry: string | null;
  country: string;
  state: string | null;
  city: string | null;
  timezone: string;
  useRecipientTimezone: boolean;
  sendingDays: string[];
  sendingWindowStart: string;
  sendingWindowEnd: string;
  scheduledStartDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  leadCount: number;
  uniqueEmailCount: number;
  duplicateDetectedCount: number;
  dailyLimitPerMailbox: number;
  minDelayMinutes: number;
  maxDelayMinutes: number;
  hooks: Array<{ id: string; label: string; badge: string; subject: string; body: string; active: boolean }>;
  steps: Array<{ id: string; stepNumber: number; label: string; dayDelay: number; subject: string; body: string; active: boolean }>;
  segment?: { id: string; name: string; industry: string | null; leadCount: number } | null;
};

type Metrics = {
  totalLeads: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  uniqueOpens: number;
  clicked: number;
  replied: number;
  unsubscribed: number;
  pending: number;
  inProgress: number;
  completed: number;
  openRate: number;
  replyRate: number;
  bounceRate: number;
};

type HookPerformance = {
  hookId: string;
  label: string;
  assignedProspects: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
};

type StepPerformance = {
  stepIndex: number;
  label: string;
  sent: number;
  delivered: number;
  opened: number;
  replied: number;
  bounced: number;
  openRate: number;
  replyRate: number;
};

type MailboxPerformance = {
  id: string;
  email: string;
  domain: string;
  label: string;
  enabled: boolean;
  dailyLimit: number;
  sentToday: number;
  totalSent: number;
  delivered: number;
  bounced: number;
  opened: number;
  replied: number;
  bounceRate: number;
  replyRate: number;
  healthStatus: "healthy" | "warning";
};

type ProspectItem = {
  id: string;
  businessName: string;
  ownerName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  timezone: string | null;
  status: string;
  assignedHookId: string | null;
  currentStepIndex: number;
  lastSentAt: string | null;
  lastFromEmail: string | null;
  lastSubject: string | null;
  openedAt: string | null;
  openCount: number;
  clickedAt: string | null;
  clickCount: number;
  repliedAt: string | null;
  bouncedAt: string | null;
  unsubscribedAt: string | null;
  stopReason: string | null;
  createdAt: string;
};

export function CampaignDetailView({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [hookPerformance, setHookPerformance] = useState<HookPerformance[]>([]);
  const [stepPerformance, setStepPerformance] = useState<StepPerformance[]>([]);
  const [mailboxPerformance, setMailboxPerformance] = useState<MailboxPerformance[]>([]);

  // Prospects table state
  const [prospects, setProspects] = useState<ProspectItem[]>([]);
  const [prospectsLoading, setProspectsLoading] = useState(false);
  const [prospectStatusFilter, setProspectStatusFilter] = useState("all");
  const [prospectSearch, setProspectSearch] = useState("");
  const [prospectTotal, setProspectTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [processMsg, setProcessMsg] = useState<string | null>(null);

  // Selected hook preview modal
  const [selectedHookPreview, setSelectedHookPreview] = useState<{ id: string; subject: string; body: string } | null>(null);

  async function loadData() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();
      if (res.ok) {
        setCampaign(data.campaign);
        setMetrics(data.metrics);
        setHookPerformance(data.hookPerformance || []);
        setStepPerformance(data.stepPerformance || []);
        setMailboxPerformance(data.mailboxPerformance || []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function loadProspects(status = prospectStatusFilter, q = prospectSearch) {
    setProspectsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (q) params.set("q", q);
      params.set("limit", "50");

      const res = await fetch(`/api/campaigns/${campaignId}/prospects?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setProspects(data.prospects || []);
        setProspectTotal(data.pagination?.total || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setProspectsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    void loadProspects();
  }, [campaignId]);

  async function handleCampaignAction(action: "launch" | "pause" | "resume" | "stop") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTriggerProcess() {
    setActionLoading(true);
    setProcessMsg(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        const sentCount = (data.results || []).reduce((sum: number, r: any) => sum + (r.sent || 0), 0);
        setProcessMsg(`Processed cycle successfully: ${sentCount} emails dispatched.`);
        await loadData();
        await loadProspects();
        setTimeout(() => setProcessMsg(null), 6000);
      }
    } catch {
      /* ignore */
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStopProspect(prospectId: string) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/prospects/${prospectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      if (res.ok) {
        setProspects((prev) =>
          prev.map((p) => (p.id === prospectId ? { ...p, status: "stopped", stopReason: "manual_stop" } : p))
        );
      }
    } catch {
      /* ignore */
    }
  }

  if (loading || !campaign || !metrics) {
    return (
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-12 text-center text-sm text-ink-muted">
        <HiOutlineSparkles className="mx-auto mb-3 h-6 w-6 animate-spin text-brand-600" />
        Loading campaign analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/campaigns"
                className="rounded-lg p-1 text-ink-muted hover:text-ink hover:bg-[var(--input-bg)] transition"
                title="Back to all campaigns"
              >
                <HiOutlineArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-black text-ink tracking-tight">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
              {campaign.segment && (
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--input-bg)] border border-border px-2.5 py-0.5 text-xs font-semibold text-ink">
                  <HiOutlineBookmark className="h-3.5 w-3.5 text-brand-600" />
                  {campaign.segment.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted pl-8">
              <span>Industry: <strong className="text-ink">{campaign.industry || "All"}</strong></span>
              <span>•</span>
              <span>Location: <strong className="text-ink">{campaign.city ? `${campaign.city}, ${campaign.state || campaign.country}` : campaign.state || campaign.country}</strong></span>
              <span>•</span>
              <span>Timezone: <strong className="text-ink">{campaign.useRecipientTimezone ? "Recipient Local Time (Smart DST)" : campaign.timezone}</strong></span>
              <span>•</span>
              <span>Sending Window: <strong className="text-ink">{campaign.sendingWindowStart} – {campaign.sendingWindowEnd} ({campaign.sendingDays.join(", ")})</strong></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTriggerProcess}
              disabled={actionLoading || campaign.status !== "active"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-sm transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-500/30 dark:bg-brand-950/40 dark:text-brand-300"
              title="Execute an immediate send cycle"
            >
              <HiOutlineBolt className="h-4 w-4 text-brand-600" />
              Send Batch Now
            </button>

            {campaign.status === "active" ? (
              <button
                type="button"
                onClick={() => handleCampaignAction("pause")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <HiOutlinePause className="h-4 w-4" /> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCampaignAction("launch")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <HiOutlinePlay className="h-4 w-4" /> Launch Campaign
              </button>
            )}

            {campaign.status !== "stopped" && (
              <button
                type="button"
                onClick={() => handleCampaignAction("stop")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2 text-xs font-semibold text-ink hover:text-rose-600 transition"
              >
                <HiOutlineStop className="h-4 w-4" /> Stop
              </button>
            )}

            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-xl border border-border p-2 text-ink-muted hover:text-ink hover:bg-[var(--input-bg)] transition"
              title="Refresh metrics"
            >
              <HiOutlineArrowPath className="h-4 w-4" />
            </button>
          </div>
        </div>

        {processMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <HiOutlineCheck className="h-4 w-4" />
            <span>{processMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Metrics Matrix */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Total Leads</span>
          <span className="text-xl font-black text-ink mt-1 block">{metrics.totalLeads.toLocaleString()}</span>
          {campaign.duplicateDetectedCount > 0 && (
            <span className="text-[11px] text-emerald-600 mt-0.5 block">
              ✓ {campaign.duplicateDetectedCount} duplicates removed
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Delivered Sends</span>
          <span className="text-xl font-black text-ink mt-1 block">{metrics.delivered.toLocaleString()}</span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">{metrics.sent} total attempted</span>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Unique Opens</span>
          <span className="text-xl font-black text-brand-600 dark:text-brand-400 mt-1 block">
            {metrics.uniqueOpens.toLocaleString()}
          </span>
          <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300 mt-0.5 block">
            {metrics.openRate}% Open Rate
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Link Clicks</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {metrics.clicked.toLocaleString()}
          </span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            {metrics.delivered > 0 ? Math.round((metrics.clicked / metrics.delivered) * 100) : 0}% CTR
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Replies Received</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {metrics.replied.toLocaleString()}
          </span>
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 mt-0.5 block">
            {metrics.replyRate}% Reply Rate
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Bounced / Unsub</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">{metrics.bounced}</span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">
            {metrics.bounceRate}% bounce rate
          </span>
        </div>
      </div>

      {/* SECTION 1: DAY 0 HOOK-BY-HOOK PERFORMANCE (A/B/C/D TESTING) */}
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Day 0 Outreach — Hook A/B/C/D Performance Comparison</h2>
            <p className="text-xs text-ink-muted">
              Discover which initial hook angle is generating the highest open and conversation rates.
            </p>
          </div>
          <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
            {hookPerformance.length} Hooks Running
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="py-2.5 px-3 font-bold uppercase">Hook Variation</th>
                <th className="py-2.5 px-3 font-bold uppercase">Assigned Leads</th>
                <th className="py-2.5 px-3 font-bold uppercase">Delivered</th>
                <th className="py-2.5 px-3 font-bold uppercase">Opens (%)</th>
                <th className="py-2.5 px-3 font-bold uppercase">Clicks (%)</th>
                <th className="py-2.5 px-3 font-bold uppercase">Replies (%)</th>
                <th className="py-2.5 px-3 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {hookPerformance.map((h) => {
                const hookObj = campaign.hooks.find((hook) => hook.id === h.hookId);
                const isWinner = h.replyRate > 0 && h.replyRate === Math.max(...hookPerformance.map((item) => item.replyRate));
                return (
                  <tr key={h.hookId} className="hover:bg-[var(--input-bg)]/50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
                          {h.hookId}
                        </span>
                        <div>
                          <span className="font-bold text-ink">{h.label}</span>
                          {isWinner && (
                            <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              🏆 Top Performer
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-ink">{h.assignedProspects}</td>
                    <td className="py-3 px-3">{h.delivered}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-brand-600 dark:text-brand-400">{h.opened}</span>{" "}
                      <span className="text-ink-muted">({h.openRate}%)</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{h.clicked}</span>{" "}
                      <span className="text-ink-muted">({h.clickRate}%)</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-purple-600 dark:text-purple-400">{h.replied}</span>{" "}
                      <span className="text-ink-muted">({h.replyRate}%)</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {hookObj && (
                        <button
                          type="button"
                          onClick={() => setSelectedHookPreview(hookObj)}
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          View Copy
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: FOLLOW-UP SEQUENCE BREAKDOWN */}
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Automated Follow-Up Sequence Funnel</h2>
            <p className="text-xs text-ink-muted">
              Sends step-by-step follow-ups automatically. Sequence stops as soon as a lead responds.
            </p>
          </div>
          <span className="text-xs font-semibold text-ink-muted">
            {stepPerformance.length} Total Steps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="py-2.5 px-3 font-bold uppercase">Step</th>
                <th className="py-2.5 px-3 font-bold uppercase">Step Title</th>
                <th className="py-2.5 px-3 font-bold uppercase">Sent</th>
                <th className="py-2.5 px-3 font-bold uppercase">Opens (%)</th>
                <th className="py-2.5 px-3 font-bold uppercase">Replies (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {stepPerformance.map((s) => (
                <tr key={s.stepIndex} className="hover:bg-[var(--input-bg)]/50 transition">
                  <td className="py-3 px-3">
                    <span className="rounded-md bg-[var(--input-bg)] border border-border px-2 py-0.5 font-bold text-ink">
                      {s.stepIndex === 0 ? "Day 0" : `Step ${s.stepIndex}`}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-ink">{s.label}</td>
                  <td className="py-3 px-3 font-bold text-ink">{s.sent}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-brand-600">{s.opened}</span>{" "}
                    <span className="text-ink-muted">({s.openRate}%)</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-purple-600">{s.replied}</span>{" "}
                    <span className="text-ink-muted">({s.replyRate}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: MAILBOX HEALTH & BALANCING */}
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">Mailbox Distribution & Health</h2>
            <p className="text-xs text-ink-muted">
              Even load balancing across mailboxes with daily limits to prevent throttling.
            </p>
          </div>
          <span className="text-xs font-semibold text-ink-muted">
            {mailboxPerformance.length} Mailboxes Connected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="py-2.5 px-3 font-bold uppercase">Mailbox & Domain</th>
                <th className="py-2.5 px-3 font-bold uppercase">Sent Today</th>
                <th className="py-2.5 px-3 font-bold uppercase">Daily Limit</th>
                <th className="py-2.5 px-3 font-bold uppercase">Total Delivered</th>
                <th className="py-2.5 px-3 font-bold uppercase">Bounces (%)</th>
                <th className="py-2.5 px-3 font-bold uppercase">Replies (%)</th>
                <th className="py-2.5 px-3 font-bold uppercase">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {mailboxPerformance.map((mb) => (
                <tr key={mb.id} className="hover:bg-[var(--input-bg)]/50 transition">
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-bold text-ink">{mb.label}</span>
                      <span className="text-[11px] text-ink-muted block">{mb.email}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-ink">{mb.sentToday}</td>
                  <td className="py-3 px-3 text-ink-muted">{mb.dailyLimit} / day</td>
                  <td className="py-3 px-3">{mb.delivered}</td>
                  <td className="py-3 px-3">
                    <span className={cn("font-bold", mb.bounceRate > 5 ? "text-rose-600" : "text-ink")}>
                      {mb.bounced} ({mb.bounceRate}%)
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-purple-600">
                    {mb.replied} ({mb.replyRate}%)
                  </td>
                  <td className="py-3 px-3">
                    {mb.healthStatus === "healthy" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        ✓ Optimal
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        ⚠ High Bounces
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: PROSPECT EXPLORER */}
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Campaign Prospects ({prospectTotal})</h2>
            <p className="text-xs text-ink-muted">
              Inspect individual prospect engagement, assigned hooks, and follow-up timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                type="text"
                value={prospectSearch}
                onChange={(e) => {
                  setProspectSearch(e.target.value);
                  void loadProspects(prospectStatusFilter, e.target.value);
                }}
                placeholder="Search leads…"
                className="saas-input pl-8 py-1 text-xs w-44"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {[
                { id: "all", label: "All" },
                { id: "opened", label: "Opened" },
                { id: "clicked", label: "Clicked" },
                { id: "replied", label: "Replied" },
                { id: "in_progress", label: "In Sequence" },
                { id: "bounced", label: "Bounced" },
                { id: "stopped", label: "Stopped" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setProspectStatusFilter(tab.id);
                    void loadProspects(tab.id, prospectSearch);
                  }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                    prospectStatusFilter === tab.id
                      ? "bg-[#1a1224] text-white dark:bg-brand-600"
                      : "text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prospects List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="py-2.5 px-3 font-bold uppercase">Business & Owner</th>
                <th className="py-2.5 px-3 font-bold uppercase">Email</th>
                <th className="py-2.5 px-3 font-bold uppercase">Location</th>
                <th className="py-2.5 px-3 font-bold uppercase">Hook</th>
                <th className="py-2.5 px-3 font-bold uppercase">Current Step</th>
                <th className="py-2.5 px-3 font-bold uppercase">Activity</th>
                <th className="py-2.5 px-3 font-bold uppercase">Status</th>
                <th className="py-2.5 px-3 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {prospectsLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-ink-muted">
                    Loading prospects…
                  </td>
                </tr>
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-ink-muted">
                    No prospects match the filter.
                  </td>
                </tr>
              ) : (
                prospects.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--input-bg)]/50 transition">
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-bold text-ink">{p.businessName}</span>
                        {p.ownerName && (
                          <span className="text-[11px] text-ink-muted block">{p.ownerName}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-ink-muted">{p.email}</td>
                    <td className="py-3 px-3">
                      {p.city ? `${p.city}, ${p.state || p.country}` : p.state || p.country}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-md bg-brand-50 border border-brand-200 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {p.assignedHookId || "A"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      {p.currentStepIndex === 0 ? "Day 0" : `Follow-Up ${p.currentStepIndex}`}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {p.openCount > 0 && (
                          <span className="rounded bg-brand-100 text-brand-800 px-1.5 py-0.5 font-bold" title={`${p.openCount} opens`}>
                            👁 {p.openCount}
                          </span>
                        )}
                        {p.clickCount > 0 && (
                          <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.5 font-bold" title={`${p.clickCount} clicks`}>
                            🔗 {p.clickCount}
                          </span>
                        )}
                        {p.repliedAt && (
                          <span className="rounded bg-purple-100 text-purple-800 px-1.5 py-0.5 font-bold">
                            💬 Replied
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <ProspectStatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      {p.status !== "stopped" && p.status !== "replied" && (
                        <button
                          type="button"
                          onClick={() => handleStopProspect(p.id)}
                          className="text-[11px] font-semibold text-rose-600 hover:underline"
                          title="Stop further automated follow-ups for this lead"
                        >
                          Stop Follow-Up
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hook Preview Modal */}
      {selectedHookPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-ink">Hook {selectedHookPreview.id} Email Preview</h3>
              <button
                type="button"
                onClick={() => setSelectedHookPreview(null)}
                className="rounded-lg p-1 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
            <div>
              <span className="text-[11px] font-bold text-ink-muted uppercase block">Subject</span>
              <span className="font-semibold text-xs text-ink block mt-0.5">{selectedHookPreview.subject}</span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-ink-muted uppercase block mb-1">Email Body</span>
              <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap text-ink">
                {selectedHookPreview.body}
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedHookPreview(null)}
                className="rounded-xl bg-[#1a1224] px-4 py-2 text-xs font-bold text-white dark:bg-brand-600"
              >
                Close
              </button>
            </div>
          </div>
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

function ProspectStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "replied":
      return <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">💬 Replied</span>;
    case "in_progress":
      return <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">Active</span>;
    case "completed":
      return <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">Finished</span>;
    case "bounced":
      return <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">Bounced</span>;
    case "stopped":
      return <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">Stopped</span>;
    default:
      return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Pending</span>;
  }
}
