"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineBolt,
  HiOutlineBookmark,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineCheck,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineDocumentDuplicate,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineFire,
  HiOutlineGlobeAmericas,
  HiOutlineLink,
  HiOutlineMagnifyingGlass,
  HiOutlineNoSymbol,
  HiOutlinePaperAirplane,
  HiOutlinePaperClip,
  HiOutlinePause,
  HiOutlinePencilSquare,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineQueueList,
  HiOutlineSparkles,
  HiOutlineStop,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DAY0_HOOKS,
  DEFAULT_FOLLOWUP_SEQUENCE,
  renderCampaignTemplate,
  formatEmailBodyToHtml,
  type CampaignAttachment,
  type CampaignHook,
  type CampaignFollowUpStep,
} from "@/lib/campaign-types";

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
  hooks: CampaignHook[];
  steps: CampaignFollowUpStep[];
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
  nextSendDueAt?: string | null;
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

type CopyPreviewModalState = {
  type: "hook" | "step";
  id: string;
  badge: string;
  label: string;
  subject: string;
  body: string;
  dayDelay?: number;
  attachments?: CampaignAttachment[];
  enableUnsubscribe?: boolean;
  unsubscribeText?: string;
  prospect?: {
    businessName: string;
    ownerName?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    email?: string | null;
  };
};

function formatDateTime(val?: string | null): string {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDays(days?: string[]): string {
  if (!days || days.length === 0) return "Mon–Fri";
  if (days.length === 7) return "Every day (Mon–Sun)";
  if (days.length === 5 && !days.includes("sat") && !days.includes("sun")) return "Mon–Fri (Weekdays)";
  return days.map((d) => d.slice(0, 3).toUpperCase()).join(", ");
}

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

  // Selected copy preview & edit modal (Day 0 hooks and Follow-Up steps)
  const [mounted, setMounted] = useState(false);
  const [selectedCopyPreview, setSelectedCopyPreview] = useState<CopyPreviewModalState | null>(null);
  const [previewMode, setPreviewMode] = useState<"rendered" | "raw" | "edit">("rendered");
  const [copied, setCopied] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editDayDelay, setEditDayDelay] = useState(2);
  const [editAttachments, setEditAttachments] = useState<CampaignAttachment[]>([]);
  const [editEnableUnsubscribe, setEditEnableUnsubscribe] = useState(true);
  const [editUnsubscribeText, setEditUnsubscribeText] = useState("Don't want to hear from us? Unsubscribe here.");
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [savingCopy, setSavingCopy] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedCopyPreview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCopyPreview]);

  function openCopyModal(item: CopyPreviewModalState, mode: "rendered" | "raw" | "edit" = "rendered") {
    setSelectedCopyPreview(item);
    setEditLabel(item.label || "");
    setEditSubject(item.subject || "");
    setEditBody(item.body || "");
    setEditDayDelay(item.dayDelay ?? 2);
    setEditAttachments(item.attachments ? [...item.attachments] : []);
    setEditEnableUnsubscribe(item.enableUnsubscribe ?? true);
    setEditUnsubscribeText(item.unsubscribeText || "Don't want to hear from us? Unsubscribe here.");
    setShowAddAttachment(false);
    setNewAttachmentName("");
    setNewAttachmentUrl("");
    setPreviewMode(mode);
    setEditSuccessMsg(null);
  }

  function handleCopyToClipboard(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function insertVariableIntoEdit(varTag: string) {
    const el = document.getElementById("copy-edit-textarea") as HTMLTextAreaElement | null;
    if (!el) {
      setEditBody((prev) => prev + " " + varTag);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + varTag + el.value.slice(end);
    setEditBody(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varTag.length, start + varTag.length);
    }, 0);
  }

  function applyFormattingToEdit(type: "bold" | "italic" | "underline") {
    const el = document.getElementById("copy-edit-textarea") as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.slice(start, end) || "text";
    let wrapped = selected;
    if (type === "bold") wrapped = `**${selected}**`;
    if (type === "italic") wrapped = `*${selected}*`;
    if (type === "underline") wrapped = `<u>${selected}</u>`;

    const next = el.value.slice(0, start) + wrapped + el.value.slice(end);
    setEditBody(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + wrapped.length);
    }, 0);
  }

  function handleInsertLink() {
    const el = document.getElementById("copy-edit-textarea") as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = el.value.slice(start, end) || "link text";
    const formatted = `[${selected}](https://example.com)`;
    const next = el.value.slice(0, start) + formatted + el.value.slice(end);
    setEditBody(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start, start + formatted.length);
    }, 0);
  }

  function handleAddAttachment() {
    if (!newAttachmentName.trim()) return;
    const newAtt: CampaignAttachment = {
      id: "att_" + Date.now(),
      name: newAttachmentName.trim(),
      url: newAttachmentUrl.trim() || undefined,
      placement: "bottom",
    };
    setEditAttachments((prev) => [...prev, newAtt]);
    setNewAttachmentName("");
    setNewAttachmentUrl("");
    setShowAddAttachment(false);
  }

  function handleRemoveAttachment(id: string) {
    setEditAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleAddHook() {
    if (!campaign || addingItem) return;
    setAddingItem(true);
    try {
      const currentHooks = campaign.hooks && campaign.hooks.length > 0 ? [...campaign.hooks] : [...DEFAULT_DAY0_HOOKS];
      const existingIds = new Set(currentHooks.map((h) => h.id.toUpperCase()));
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const nextId = alphabet.find((letter) => !existingIds.has(letter)) || `H${currentHooks.length + 1}`;

      const preset = DEFAULT_DAY0_HOOKS.find((dh) => dh.id.toUpperCase() === nextId.toUpperCase());
      const newHook: CampaignHook = {
        id: nextId,
        badge: `Hook ${nextId}`,
        label: preset ? preset.label : `Hook ${nextId}: Custom Hook Angle`,
        subject: preset ? preset.subject : `Quick inquiry for {{businessName}} in {{city}}`,
        body: preset ? preset.body : `Hi {{firstName}},\n\nI was researching top {{industry}} contractors in {{city}} and wanted to reach out to {{businessName}}.\n\nAre you currently taking on new projects in {{city}}?\n\nBest regards,\n{{fromName}}`,
        active: true,
      };

      const nextHooks = [...currentHooks, newHook];
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hooks: nextHooks }),
      });
      if (res.ok) {
        setCampaign((prev) => (prev ? { ...prev, hooks: nextHooks } : prev));
        await loadData();
        openCopyModal({
          type: "hook",
          id: newHook.id,
          badge: newHook.badge,
          label: newHook.label,
          subject: newHook.subject,
          body: newHook.body,
          attachments: newHook.attachments,
          enableUnsubscribe: newHook.enableUnsubscribe,
          unsubscribeText: newHook.unsubscribeText,
        }, "edit");
      }
    } catch {
      /* ignore */
    } finally {
      setAddingItem(false);
    }
  }

  async function handleAddFollowUpStep() {
    if (!campaign || addingItem) return;
    setAddingItem(true);
    try {
      const currentSteps = campaign.steps && campaign.steps.length > 0 ? [...campaign.steps] : [...DEFAULT_FOLLOWUP_SEQUENCE];
      const maxStepNum = currentSteps.reduce((max, s) => Math.max(max, s.stepNumber || 0), 0);
      const nextStepNum = maxStepNum + 1;
      const defaultDelay = 2;

      const preset = DEFAULT_FOLLOWUP_SEQUENCE.find((ds) => ds.stepNumber === nextStepNum);
      const newStep: CampaignFollowUpStep = {
        id: String(nextStepNum),
        stepNumber: nextStepNum,
        label: preset ? preset.label : `Follow-Up ${nextStepNum}: Check-in & Value`,
        dayDelay: preset ? preset.dayDelay : defaultDelay,
        subject: preset ? preset.subject : `Re: {{lastSubject}}`,
        body: preset ? preset.body : `Hi {{firstName}},\n\nJust following up on my previous note regarding {{industry}} projects in {{city}}.\n\nAre you available for a quick 5-minute call this week?\n\nBest,\n{{fromName}}`,
        active: true,
      };

      const nextSteps = [...currentSteps, newStep];
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: nextSteps }),
      });
      if (res.ok) {
        setCampaign((prev) => (prev ? { ...prev, steps: nextSteps } : prev));
        await loadData();
        openCopyModal({
          type: "step",
          id: String(newStep.stepNumber),
          badge: `Follow-Up ${newStep.stepNumber}`,
          label: newStep.label,
          subject: newStep.subject,
          body: newStep.body,
          dayDelay: newStep.dayDelay,
          attachments: newStep.attachments,
          enableUnsubscribe: newStep.enableUnsubscribe,
          unsubscribeText: newStep.unsubscribeText,
        }, "edit");
      }
    } catch {
      /* ignore */
    } finally {
      setAddingItem(false);
    }
  }

  async function handleSaveCopyChanges() {
    if (!selectedCopyPreview || !campaign) return;
    setSavingCopy(true);
    setEditSuccessMsg(null);
    try {
      if (selectedCopyPreview.type === "hook") {
        const baseHooks = campaign.hooks && campaign.hooks.length > 0 ? campaign.hooks : DEFAULT_DAY0_HOOKS;
        let found = false;
        const nextHooks = baseHooks.map((h) => {
          if (h.id.toLowerCase() === selectedCopyPreview.id.toLowerCase()) {
            found = true;
            return {
              ...h,
              label: editLabel.trim() || h.label,
              subject: editSubject,
              body: editBody,
              attachments: editAttachments,
              enableUnsubscribe: editEnableUnsubscribe,
              unsubscribeText: editUnsubscribeText,
            };
          }
          return h;
        });

        if (!found) {
          nextHooks.push({
            id: selectedCopyPreview.id,
            badge: selectedCopyPreview.badge,
            label: editLabel.trim() || selectedCopyPreview.label,
            subject: editSubject,
            body: editBody,
            attachments: editAttachments,
            enableUnsubscribe: editEnableUnsubscribe,
            unsubscribeText: editUnsubscribeText,
            active: true,
          });
        }

        const res = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hooks: nextHooks }),
        });

        if (res.ok) {
          setCampaign((prev) => (prev ? { ...prev, hooks: nextHooks } : prev));
          setSelectedCopyPreview((prev) =>
            prev
              ? {
                  ...prev,
                  label: editLabel.trim() || prev.label,
                  subject: editSubject,
                  body: editBody,
                  attachments: editAttachments,
                  enableUnsubscribe: editEnableUnsubscribe,
                  unsubscribeText: editUnsubscribeText,
                }
              : null
          );
          setEditSuccessMsg("Hook template updated successfully! All future scheduled sends will use this copy.");
          await loadData();
        }
      } else {
        const stepNum = parseInt(selectedCopyPreview.id, 10);
        const baseSteps = campaign.steps && campaign.steps.length > 0 ? campaign.steps : DEFAULT_FOLLOWUP_SEQUENCE;
        let found = false;
        const nextSteps = baseSteps.map((s) => {
          if (s.stepNumber === stepNum || s.id === selectedCopyPreview.id) {
            found = true;
            return {
              ...s,
              label: editLabel.trim() || s.label,
              dayDelay: editDayDelay,
              subject: editSubject,
              body: editBody,
              attachments: editAttachments,
              enableUnsubscribe: editEnableUnsubscribe,
              unsubscribeText: editUnsubscribeText,
            };
          }
          return s;
        });

        if (!found) {
          nextSteps.push({
            id: String(stepNum),
            stepNumber: stepNum,
            label: editLabel.trim() || selectedCopyPreview.label,
            dayDelay: editDayDelay,
            subject: editSubject,
            body: editBody,
            attachments: editAttachments,
            enableUnsubscribe: editEnableUnsubscribe,
            unsubscribeText: editUnsubscribeText,
            active: true,
          });
        }

        const res = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steps: nextSteps }),
        });

        if (res.ok) {
          setCampaign((prev) => (prev ? { ...prev, steps: nextSteps } : prev));
          setSelectedCopyPreview((prev) =>
            prev
              ? {
                  ...prev,
                  label: editLabel.trim() || prev.label,
                  dayDelay: editDayDelay,
                  subject: editSubject,
                  body: editBody,
                  attachments: editAttachments,
                  enableUnsubscribe: editEnableUnsubscribe,
                  unsubscribeText: editUnsubscribeText,
                }
              : null
          );
          setEditSuccessMsg(`Follow-Up Step ${stepNum} updated successfully! All future scheduled sends will use this copy.`);
          await loadData();
        }
      }
    } catch {
      /* ignore */
    } finally {
      setSavingCopy(false);
    }
  }

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

        {/* Date, Time & Scheduling Grid */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-border/80 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-[var(--input-bg)]/80 p-3">
            <div className="flex items-center gap-1.5 text-ink-muted mb-1">
              <HiOutlineCalendar className="h-4 w-4 text-brand-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Date Created</span>
            </div>
            <div className="text-xs font-bold text-ink">
              {formatDateTime(campaign.createdAt)}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-[var(--input-bg)]/80 p-3">
            <div className="flex items-center gap-1.5 text-ink-muted mb-1">
              <HiOutlineClock className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {campaign.status === "scheduled"
                  ? "Scheduled Launch Time"
                  : campaign.startedAt
                  ? "Launched / Started At"
                  : "Launch Date & Time"}
              </span>
            </div>
            <div className="text-xs font-bold text-ink">
              {campaign.status === "scheduled" && campaign.scheduledStartDate
                ? formatDateTime(campaign.scheduledStartDate)
                : campaign.startedAt
                ? formatDateTime(campaign.startedAt)
                : campaign.completedAt
                ? formatDateTime(campaign.completedAt)
                : "Not launched yet (Draft)"}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-[var(--input-bg)]/80 p-3">
            <div className="flex items-center gap-1.5 text-ink-muted mb-1">
              <HiOutlineClock className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sending Time Window</span>
            </div>
            <div className="text-xs font-bold text-ink">
              {campaign.sendingWindowStart} – {campaign.sendingWindowEnd}
            </div>
            <div className="text-[10px] text-ink-muted mt-0.5 font-medium">
              Active: {formatDays(campaign.sendingDays)}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-[var(--input-bg)]/80 p-3">
            <div className="flex items-center gap-1.5 text-ink-muted mb-1">
              <HiOutlineGlobeAmericas className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Market Timezone</span>
            </div>
            <div className="text-xs font-bold text-ink truncate" title={campaign.timezone}>
              {campaign.useRecipientTimezone ? "Recipient Local Time" : campaign.timezone}
            </div>
            <div className="text-[10px] text-ink-muted mt-0.5 font-medium">
              {campaign.minDelayMinutes}–{campaign.maxDelayMinutes}m jitter throttle
            </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Day 0 Outreach — Hook A/B/C/D Performance Comparison</h2>
            <p className="text-xs text-ink-muted">
              Discover which initial hook angle is generating the highest open and conversation rates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
              {hookPerformance.length} Hooks Running
            </span>
            <button
              type="button"
              onClick={handleAddHook}
              disabled={addingItem}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              title="Add another hook variation for Day 0 outreach"
            >
              <HiOutlinePlus className="h-3.5 w-3.5" />
              <span>Add Hook</span>
            </button>
          </div>
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
                const hookObj =
                  campaign.hooks?.find((hook) => hook.id?.toLowerCase() === h.hookId?.toLowerCase()) ||
                  DEFAULT_DAY0_HOOKS.find((dh) => dh.id?.toLowerCase() === h.hookId?.toLowerCase()) ||
                  {
                    id: h.hookId,
                    badge: `Hook ${h.hookId}`,
                    label: h.label || `Hook ${h.hookId}`,
                    subject: `Quick question for {{businessName}} in {{city}}`,
                    body: `Hi {{firstName}},\n\nI came across {{businessName}} while researching top {{industry}} contractors in {{city}}.\n\nAre you currently taking on new projects in {{city}}, or is your schedule completely booked up?\n\nBest regards,\n{{fromName}}`,
                    active: true,
                  };
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            openCopyModal({
                              type: "hook",
                              id: hookObj.id,
                              badge: hookObj.badge || `Hook ${hookObj.id}`,
                              label: hookObj.label || `Hook ${hookObj.id}`,
                              subject: hookObj.subject || "Quick inquiry",
                              body: hookObj.body || "",
                              attachments: (hookObj as any).attachments,
                              enableUnsubscribe: (hookObj as any).enableUnsubscribe,
                              unsubscribeText: (hookObj as any).unsubscribeText,
                            }, "rendered");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                          title="Preview hook email template"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            openCopyModal({
                              type: "hook",
                              id: hookObj.id,
                              badge: hookObj.badge || `Hook ${hookObj.id}`,
                              label: hookObj.label || `Hook ${hookObj.id}`,
                              subject: hookObj.subject || "Quick inquiry",
                              body: hookObj.body || "",
                              attachments: (hookObj as any).attachments,
                              enableUnsubscribe: (hookObj as any).enableUnsubscribe,
                              unsubscribeText: (hookObj as any).unsubscribeText,
                            }, "edit");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-brand-600 hover:underline"
                          title="Edit this hook's subject and body"
                        >
                          <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Automated Follow-Up Sequence Funnel</h2>
            <p className="text-xs text-ink-muted">
              Sends step-by-step follow-ups automatically. Sequence stops as soon as a lead responds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-muted">
              {stepPerformance.length} Total Steps
            </span>
            <button
              type="button"
              onClick={handleAddFollowUpStep}
              disabled={addingItem}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
              title="Add a new follow-up email step to this campaign"
            >
              <HiOutlinePlus className="h-3.5 w-3.5" />
              <span>Add Follow-Up Step</span>
            </button>
          </div>
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
                <th className="py-2.5 px-3 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {stepPerformance.map((s) => {
                const isDay0 = s.stepIndex === 0;
                const stepObj = isDay0
                  ? null
                  : campaign.steps?.find((st) => st.stepNumber === s.stepIndex || st.id === String(s.stepIndex)) ||
                    DEFAULT_FOLLOWUP_SEQUENCE.find((ds) => ds.stepNumber === s.stepIndex || ds.id === String(s.stepIndex)) ||
                    {
                      id: String(s.stepIndex),
                      stepNumber: s.stepIndex,
                      label: s.label || `Follow-Up ${s.stepIndex}`,
                      dayDelay: 2,
                      subject: `Re: {{lastSubject}}`,
                      body: `Hi {{firstName}},\n\nFollowing up on my previous note regarding {{industry}} projects in {{city}}.\n\nBest,\n{{fromName}}`,
                      active: true,
                    };

                return (
                  <tr key={s.stepIndex} className="hover:bg-[var(--input-bg)]/50 transition">
                    <td className="py-3 px-3">
                      <span className="rounded-md bg-[var(--input-bg)] border border-border px-2 py-0.5 font-bold text-ink">
                        {isDay0 ? "Day 0" : `Step ${s.stepIndex}`}
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
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isDay0) {
                              const h0 = campaign.hooks?.[0] || DEFAULT_DAY0_HOOKS[0];
                              openCopyModal({
                                type: "hook",
                                id: h0.id,
                                badge: `Day 0 (Hook ${h0.id})`,
                                label: h0.label || "Day 0 Initial Outreach",
                                subject: h0.subject,
                                body: h0.body,
                                attachments: (h0 as any).attachments,
                                enableUnsubscribe: (h0 as any).enableUnsubscribe,
                                unsubscribeText: (h0 as any).unsubscribeText,
                              }, "rendered");
                            } else if (stepObj) {
                              openCopyModal({
                                type: "step",
                                id: String(stepObj.stepNumber),
                                badge: `Follow-Up ${stepObj.stepNumber}`,
                                label: stepObj.label || `Follow-Up Step ${stepObj.stepNumber}`,
                                subject: stepObj.subject,
                                body: stepObj.body,
                                dayDelay: stepObj.dayDelay,
                                attachments: (stepObj as any).attachments,
                                enableUnsubscribe: (stepObj as any).enableUnsubscribe,
                                unsubscribeText: (stepObj as any).unsubscribeText,
                              }, "rendered");
                            }
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                          title="View email copy for this sequence step"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5" />
                          View
                        </button>
                        {isDay0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const h0 = campaign.hooks?.[0] || DEFAULT_DAY0_HOOKS[0];
                              openCopyModal({
                                type: "hook",
                                id: h0.id,
                                badge: `Day 0 (Hook ${h0.id})`,
                                label: h0.label || "Day 0 Initial Outreach",
                                subject: h0.subject,
                                body: h0.body,
                                attachments: (h0 as any).attachments,
                                enableUnsubscribe: (h0 as any).enableUnsubscribe,
                                unsubscribeText: (h0 as any).unsubscribeText,
                              }, "edit");
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-brand-600 hover:underline"
                            title="Edit Day 0 outreach template"
                          >
                            <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        ) : stepObj ? (
                          <button
                            type="button"
                            onClick={() => {
                              openCopyModal({
                                type: "step",
                                id: String(stepObj.stepNumber),
                                badge: `Follow-Up ${stepObj.stepNumber}`,
                                label: stepObj.label || `Follow-Up Step ${stepObj.stepNumber}`,
                                subject: stepObj.subject,
                                body: stepObj.body,
                                dayDelay: stepObj.dayDelay,
                                attachments: (stepObj as any).attachments,
                                enableUnsubscribe: (stepObj as any).enableUnsubscribe,
                                unsubscribeText: (stepObj as any).unsubscribeText,
                              }, "edit");
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-brand-600 hover:underline"
                            title="Edit this step's subject and body"
                          >
                            <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                <th className="py-2.5 px-3 font-bold uppercase">Date & Time</th>
                <th className="py-2.5 px-3 font-bold uppercase">Status</th>
                <th className="py-2.5 px-3 font-bold uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {prospectsLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-ink-muted">
                    Loading prospects…
                  </td>
                </tr>
              ) : prospects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-ink-muted">
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
                      {p.lastSentAt ? (
                        <div>
                          <span className="text-xs font-semibold text-ink block whitespace-nowrap">
                            {formatDateTime(p.lastSentAt)}
                          </span>
                          <span className="text-[10px] text-ink-muted">Last email sent</span>
                        </div>
                      ) : p.nextSendDueAt ? (
                        <div>
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block whitespace-nowrap">
                            {formatDateTime(p.nextSendDueAt)}
                          </span>
                          <span className="text-[10px] text-ink-muted">Next send due</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs text-ink-muted block whitespace-nowrap">
                            {p.createdAt ? formatDateTime(p.createdAt) : "Pending"}
                          </span>
                          <span className="text-[10px] text-ink-muted">Enrolled</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <ProspectStatusBadge status={p.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (p.currentStepIndex === 0) {
                              const hookId = p.assignedHookId || "A";
                              const hObj =
                                campaign.hooks?.find((hk) => hk.id?.toLowerCase() === hookId.toLowerCase()) ||
                                DEFAULT_DAY0_HOOKS.find((dh) => dh.id?.toLowerCase() === hookId.toLowerCase()) ||
                                DEFAULT_DAY0_HOOKS[0];
                              openCopyModal({
                                type: "hook",
                                id: hObj.id,
                                badge: `Hook ${hObj.id}`,
                                label: hObj.label,
                                subject: hObj.subject,
                                body: hObj.body,
                                attachments: (hObj as any).attachments,
                                enableUnsubscribe: (hObj as any).enableUnsubscribe,
                                unsubscribeText: (hObj as any).unsubscribeText,
                                prospect: p,
                              }, "rendered");
                            } else {
                              const sObj =
                                campaign.steps?.find((st) => st.stepNumber === p.currentStepIndex || st.id === String(p.currentStepIndex)) ||
                                DEFAULT_FOLLOWUP_SEQUENCE.find((ds) => ds.stepNumber === p.currentStepIndex || ds.id === String(p.currentStepIndex)) ||
                                DEFAULT_FOLLOWUP_SEQUENCE[0];
                              openCopyModal({
                                type: "step",
                                id: String(sObj.stepNumber),
                                badge: `Step ${sObj.stepNumber}`,
                                label: sObj.label,
                                subject: sObj.subject,
                                body: sObj.body,
                                dayDelay: sObj.dayDelay,
                                attachments: (sObj as any).attachments,
                                enableUnsubscribe: (sObj as any).enableUnsubscribe,
                                unsubscribeText: (sObj as any).unsubscribeText,
                                prospect: p,
                              }, "rendered");
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline"
                          title="Preview personalized email for this lead"
                        >
                          <HiOutlineEye className="h-3 w-3" /> Copy
                        </button>

                        {p.status !== "stopped" && p.status !== "replied" && (
                          <button
                            type="button"
                            onClick={() => handleStopProspect(p.id)}
                            className="text-[11px] font-semibold text-rose-600 hover:underline"
                            title="Stop further automated follow-ups for this lead"
                          >
                            Stop
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy Preview & Full Edit Modal (Mounted via createPortal directly to document.body) */}
      {mounted && selectedCopyPreview && createPortal((() => {
        const sampleLead = selectedCopyPreview.prospect || {
          businessName: campaign.name ? `${campaign.industry || "Apex"} Contractor Co` : "Apex Roofing Experts",
          ownerName: "John Miller",
          city: campaign.city || "Miami",
          state: campaign.state || "FL",
          country: campaign.country || "US",
          email: "john@apexcontracting.com",
        };

        const activeSubject = previewMode === "edit" ? editSubject : selectedCopyPreview.subject;
        const activeBody = previewMode === "edit" ? editBody : selectedCopyPreview.body;
        const activeAttachments = previewMode === "edit" ? editAttachments : selectedCopyPreview.attachments;
        const activeEnableUnsubscribe = previewMode === "edit" ? editEnableUnsubscribe : (selectedCopyPreview.enableUnsubscribe ?? true);
        const activeUnsubscribeText = previewMode === "edit" ? editUnsubscribeText : selectedCopyPreview.unsubscribeText;

        const renderedSubject = renderCampaignTemplate(
          activeSubject || "Quick question for {{businessName}}",
          sampleLead,
          "Alex Turner",
          { lastSubject: "Quick question for " + sampleLead.businessName }
        );

        const renderedBody = renderCampaignTemplate(
          activeBody || "(No email body template provided)",
          sampleLead,
          "Alex Turner",
          { lastSubject: "Quick question for " + sampleLead.businessName }
        );

        const renderedHtml = formatEmailBodyToHtml(renderedBody, {
          attachments: activeAttachments,
          enableUnsubscribe: activeEnableUnsubscribe,
          unsubscribeText: activeUnsubscribeText,
          unsubscribeUrl: "#",
        });

        const fullCopyForClipboard = `Subject: ${activeSubject}\n\n${activeBody}`;

        const allHooks = campaign.hooks && campaign.hooks.length > 0 ? campaign.hooks : DEFAULT_DAY0_HOOKS;
        const allSteps = campaign.steps && campaign.steps.length > 0 ? campaign.steps : DEFAULT_FOLLOWUP_SEQUENCE;

        return (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCopyPreview(null);
            }}
          >
            <div
              className="w-full max-w-5xl rounded-2xl border border-border bg-[var(--surface)] shadow-2xl flex flex-col h-[90vh] max-h-[880px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-[var(--input-bg)]/60">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold text-white shadow-sm shrink-0">
                    {selectedCopyPreview.type === "hook" ? selectedCopyPreview.id : `#${selectedCopyPreview.id}`}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-ink truncate max-w-[280px] sm:max-w-md">
                        {previewMode === "edit" ? (editLabel || selectedCopyPreview.label) : selectedCopyPreview.label}
                      </h3>
                      <span className="rounded-md bg-brand-50 border border-brand-200 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300 shrink-0">
                        {selectedCopyPreview.type === "hook"
                          ? "Day 0 Hook Angle"
                          : `Follow-Up Step (+${previewMode === "edit" ? editDayDelay : (selectedCopyPreview.dayDelay || 2)}d)`}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted truncate">
                      {selectedCopyPreview.prospect
                        ? `Personalized preview for ${sampleLead.businessName} (${sampleLead.email})`
                        : "Email template with automated contractor variable personalization"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Mode switcher tabs */}
                  <div className="flex items-center gap-1 rounded-xl bg-[var(--surface)] p-1 border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("rendered")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                        previewMode === "rendered"
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-ink-muted hover:text-ink"
                      )}
                    >
                      <HiOutlineEye className="h-3.5 w-3.5" />
                      Recipient View
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("edit")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                        previewMode === "edit"
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-ink-muted hover:text-ink"
                      )}
                    >
                      <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                      Edit Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("raw")}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                        previewMode === "raw"
                          ? "bg-brand-600 text-white shadow-sm"
                          : "text-ink-muted hover:text-ink"
                      )}
                    >
                      <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />
                      Raw Source
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCopyPreview(null)}
                    className="rounded-xl p-2 text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink transition border border-transparent hover:border-border"
                    title="Close preview"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Sub-toolbar: Hook/Step Quick Switcher & Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 bg-[var(--surface)] text-xs">
                {/* Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
                  <span className="text-[10px] font-bold text-ink-muted uppercase shrink-0">
                    {selectedCopyPreview.type === "hook" ? "Hooks:" : "Steps:"}
                  </span>

                  {selectedCopyPreview.type === "hook" ? (
                    <>
                      {allHooks.map((h) => {
                        const isCurrent = selectedCopyPreview.id.toUpperCase() === h.id.toUpperCase();
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => {
                              openCopyModal({
                                type: "hook",
                                id: h.id,
                                badge: h.badge || `Hook ${h.id}`,
                                label: h.label,
                                subject: h.subject,
                                body: h.body,
                                attachments: (h as any).attachments,
                                enableUnsubscribe: (h as any).enableUnsubscribe,
                                unsubscribeText: (h as any).unsubscribeText,
                              }, previewMode);
                            }}
                            className={cn(
                              "rounded-lg px-2 py-0.5 text-xs font-bold transition whitespace-nowrap",
                              isCurrent
                                ? "bg-brand-600 text-white shadow-xs"
                                : "bg-[var(--input-bg)] border border-border text-ink hover:border-brand-500"
                            )}
                          >
                            Hook {h.id}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleAddHook}
                        disabled={addingItem}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-brand-500/50 bg-brand-50/60 px-2 py-0.5 text-xs font-bold text-brand-600 hover:bg-brand-100 transition dark:bg-brand-950/40 shrink-0"
                        title="Add a new Day 0 Hook variation"
                      >
                        <HiOutlinePlus className="h-3 w-3" />
                        <span>Add Hook</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Day 0 Quick Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const h0 = campaign.hooks?.[0] || DEFAULT_DAY0_HOOKS[0];
                          openCopyModal({
                            type: "hook",
                            id: h0.id,
                            badge: `Day 0 (Hook ${h0.id})`,
                            label: h0.label || "Day 0 Initial Outreach",
                            subject: h0.subject,
                            body: h0.body,
                            attachments: (h0 as any).attachments,
                            enableUnsubscribe: (h0 as any).enableUnsubscribe,
                            unsubscribeText: (h0 as any).unsubscribeText,
                          }, previewMode);
                        }}
                        className="rounded-lg px-2 py-0.5 text-xs font-bold transition whitespace-nowrap bg-[var(--input-bg)] border border-border text-ink hover:border-brand-500"
                      >
                        Day 0
                      </button>

                      {allSteps.map((st) => {
                        const isCurrent = selectedCopyPreview.id === String(st.stepNumber);
                        return (
                          <button
                            key={st.stepNumber}
                            type="button"
                            onClick={() => {
                              openCopyModal({
                                type: "step",
                                id: String(st.stepNumber),
                                badge: `Follow-Up ${st.stepNumber}`,
                                label: st.label,
                                subject: st.subject,
                                body: st.body,
                                dayDelay: st.dayDelay,
                                attachments: (st as any).attachments,
                                enableUnsubscribe: (st as any).enableUnsubscribe,
                                unsubscribeText: (st as any).unsubscribeText,
                              }, previewMode);
                            }}
                            className={cn(
                              "rounded-lg px-2 py-0.5 text-xs font-bold transition whitespace-nowrap",
                              isCurrent
                                ? "bg-brand-600 text-white shadow-xs"
                                : "bg-[var(--input-bg)] border border-border text-ink hover:border-brand-500"
                            )}
                          >
                            Step {st.stepNumber}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleAddFollowUpStep}
                        disabled={addingItem}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-brand-500/50 bg-brand-50/60 px-2 py-0.5 text-xs font-bold text-brand-600 hover:bg-brand-100 transition dark:bg-brand-950/40 shrink-0"
                        title="Add a new follow-up step"
                      >
                        <HiOutlinePlus className="h-3 w-3" />
                        <span>Add Step</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 ml-auto">
                  {previewMode !== "edit" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("edit")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100 transition dark:bg-brand-950/50 dark:border-brand-800 dark:text-brand-300"
                        title="Edit this email template"
                      >
                        <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                        Edit Template
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(fullCopyForClipboard)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[var(--input-bg)] px-3 py-1 text-xs font-semibold text-ink hover:bg-[var(--surface)] transition"
                        title="Copy subject and body to clipboard"
                      >
                        {copied ? (
                          <>
                            <HiOutlineCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <HiOutlineDocumentDuplicate className="h-3.5 w-3.5" />
                            <span>Copy Text</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveCopyChanges}
                      disabled={savingCopy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                    >
                      {savingCopy ? (
                        <>
                          <HiOutlineSparkles className="h-3.5 w-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <HiOutlineCheck className="h-3.5 w-3.5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {previewMode === "rendered" ? (
                  /* SIMULATED EMAIL CLIENT WINDOW */
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {/* Simulated Email Envelope Header */}
                    <div className="rounded-xl border border-border bg-[var(--surface)] p-4 text-xs space-y-2 shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-muted w-16 shrink-0">From:</span>
                        <span className="text-ink font-semibold">Alex Turner &lt;alex@yourdomain.com&gt;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-muted w-16 shrink-0">To:</span>
                        <span className="text-ink font-medium">
                          {sampleLead.ownerName || "Business Owner"} &lt;{sampleLead.email || "lead@example.com"}&gt;
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink-muted w-16 shrink-0">Subject:</span>
                        <span className="font-bold text-ink text-sm">{renderedSubject}</span>
                      </div>
                    </div>

                    {/* Email Body Content */}
                    <div className="rounded-2xl border border-border bg-white dark:bg-zinc-950 p-6 shadow-sm min-h-[300px]">
                      <div
                        className="text-xs leading-relaxed text-zinc-900 dark:text-zinc-100"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                      />
                    </div>
                  </div>
                ) : previewMode === "raw" ? (
                  /* RAW TEMPLATE SOURCE WITH VARIABLE PILLS */
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <div>
                      <span className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                        Subject Line Template
                      </span>
                      <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3.5 text-xs font-mono font-semibold text-ink">
                        {activeSubject || "(Empty subject line)"}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                        Body Content Template
                      </span>
                      <pre className="rounded-xl border border-border bg-[var(--input-bg)] p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-ink overflow-x-auto max-h-[350px]">
                        {activeBody || "(Empty email body copy)"}
                      </pre>
                    </div>

                    {/* Supported tags */}
                    <div className="rounded-xl border border-border bg-[var(--input-bg)]/50 p-3.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                        Supported Personalization Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "{{firstName}}",
                          "{{businessName}}",
                          "{{city}}",
                          "{{state}}",
                          "{{country}}",
                          "{{industry}}",
                          "{{fromName}}",
                          "{{lastSubject}}",
                          "{{unsubscribe}}",
                        ].map((v) => (
                          <span
                            key={v}
                            className="rounded-md border border-border bg-[var(--surface)] px-2 py-0.5 font-mono text-[10px] font-bold text-brand-700 dark:text-brand-300"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* LIVE EDIT TEMPLATE MODE (FULL & EXPANSIVE) */
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {/* Notice for scheduled / active campaigns */}
                    <div className="rounded-xl border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/40 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
                      <HiOutlineClock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Live Template Editing</strong>
                        <span>
                          {campaign.status === "scheduled"
                            ? "This campaign is scheduled. Any modifications saved here will immediately apply to all upcoming automated emails when the campaign launches."
                            : "Modifications saved here will immediately apply to all future automated emails dispatched for this campaign."}
                        </span>
                      </div>
                    </div>

                    {editSuccessMsg && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/50 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <HiOutlineCheck className="h-4 w-4 text-emerald-600" />
                        <span>{editSuccessMsg}</span>
                      </div>
                    )}

                    {/* Step Title / Label & Delay Grid */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">
                          Template / Step Label
                        </label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="e.g. Follow-Up 1: Value Angle"
                          className="saas-input w-full text-xs font-semibold"
                        />
                      </div>

                      {selectedCopyPreview.type === "step" && (
                        <div>
                          <label className="block text-xs font-bold text-ink mb-1">
                            Sending Delay (Days after previous email)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={editDayDelay}
                              onChange={(e) => setEditDayDelay(Math.max(1, parseInt(e.target.value, 10) || 1))}
                              className="saas-input w-28 text-xs font-bold"
                            />
                            <span className="text-xs text-ink-muted">days wait before auto-dispatch</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subject Line Editor */}
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        Email Subject Line
                      </label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder="Subject line with {{variables}}..."
                        className="saas-input w-full text-xs font-semibold"
                      />
                    </div>

                    {/* Personalization Tags Toolbar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-ink-muted uppercase">
                          Insert Personalization Variable (at cursor)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "{{firstName}}",
                          "{{businessName}}",
                          "{{city}}",
                          "{{state}}",
                          "{{industry}}",
                          "{{country}}",
                          "{{fromName}}",
                          "{{lastSubject}}",
                          "{{unsubscribe}}",
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => insertVariableIntoEdit(tag)}
                            className="rounded-lg border border-border bg-[var(--surface)] px-2 py-1 font-mono text-[11px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition dark:text-brand-300 dark:hover:bg-brand-950/40"
                            title={`Insert ${tag} into email body`}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rich Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 bg-[var(--input-bg)]/80 border border-border rounded-xl px-3 py-1.5 text-xs">
                      <span className="text-[11px] font-bold text-ink-muted mr-1">Formatting:</span>
                      <button
                        type="button"
                        onClick={() => applyFormattingToEdit("bold")}
                        className="p-1 px-2.5 font-bold rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-border text-ink transition"
                        title="Bold (**text**)"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormattingToEdit("italic")}
                        className="p-1 px-2.5 italic font-serif rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-border text-ink transition"
                        title="Italic (*text*)"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormattingToEdit("underline")}
                        className="p-1 px-2.5 underline rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-border text-ink transition"
                        title="Underline (<u>text</u>)"
                      >
                        U
                      </button>
                      <button
                        type="button"
                        onClick={handleInsertLink}
                        className="inline-flex items-center gap-1 p-1 px-2.5 rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-border text-ink transition"
                        title="Insert hyperlink [text](url)"
                      >
                        <HiOutlineLink className="h-3.5 w-3.5" />
                        Link
                      </button>

                      <div className="h-4 w-[1px] bg-border mx-1" />

                      <button
                        type="button"
                        onClick={() => setShowAddAttachment((prev) => !prev)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-ink-muted hover:text-brand-600 hover:bg-[var(--surface)] transition"
                        title="Add file attachment"
                      >
                        <HiOutlinePaperClip className="h-3.5 w-3.5" />
                        <span>Add Attachment ({editAttachments.length})</span>
                      </button>
                    </div>

                    {/* Inline Add Attachment Form */}
                    {showAddAttachment && (
                      <div className="rounded-xl border border-brand-500/30 bg-brand-50/40 dark:bg-brand-950/30 p-3.5 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink">Add Attachment (PDF, Document, Portfolio)</span>
                          <button
                            type="button"
                            onClick={() => setShowAddAttachment(false)}
                            className="text-ink-muted hover:text-ink text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            type="text"
                            value={newAttachmentName}
                            onChange={(e) => setNewAttachmentName(e.target.value)}
                            placeholder="File Name (e.g. Case-Study-Contractor.pdf)"
                            className="saas-input text-xs"
                          />
                          <input
                            type="text"
                            value={newAttachmentUrl}
                            onChange={(e) => setNewAttachmentUrl(e.target.value)}
                            placeholder="File URL / Link (optional)"
                            className="saas-input text-xs"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddAttachment}
                            disabled={!newAttachmentName.trim()}
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-50 transition"
                          >
                            + Attach to Template
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing Attachments List */}
                    {editAttachments.length > 0 && (
                      <div className="rounded-xl border border-border bg-[var(--input-bg)]/40 p-3 space-y-2">
                        <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                          Attached Documents ({editAttachments.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {editAttachments.map((att) => (
                            <span
                              key={att.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-ink"
                            >
                              <HiOutlinePaperClip className="h-3.5 w-3.5 text-brand-600" />
                              <span>{att.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(att.id)}
                                className="text-ink-muted hover:text-rose-600 ml-1"
                                title="Remove attachment"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Body Textarea Editor */}
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        Email Body Copy Template
                      </label>
                      <textarea
                        id="copy-edit-textarea"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={12}
                        placeholder="Write your email body template here..."
                        className="saas-input w-full font-mono text-xs leading-relaxed"
                      />
                    </div>

                    {/* Unsubscribe Footer Configuration */}
                    <div className="rounded-xl border border-border bg-[var(--input-bg)]/40 p-3.5 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editEnableUnsubscribe}
                          onChange={(e) => setEditEnableUnsubscribe(e.target.checked)}
                          className="rounded border-border text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-xs font-bold text-ink">
                          Include automated 1-click Unsubscribe footer link
                        </span>
                      </label>
                      {editEnableUnsubscribe && (
                        <div className="pt-1">
                          <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                            Custom Unsubscribe Text
                          </label>
                          <input
                            type="text"
                            value={editUnsubscribeText}
                            onChange={(e) => setEditUnsubscribeText(e.target.value)}
                            placeholder="Don't want to hear from us? Unsubscribe here."
                            className="saas-input w-full text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-border p-4 bg-[var(--input-bg)]/50 text-xs">
                <span className="text-[11px] text-ink-muted hidden sm:inline">
                  {previewMode === "edit"
                    ? "Click 'Save Changes' to update this template in the database."
                    : "💡 Personalization tags are dynamically replaced with each contractor's info during sending cycles."}
                </span>

                <div className="flex items-center gap-2 ml-auto">
                  {previewMode === "edit" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("rendered")}
                        className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-ink hover:bg-[var(--surface)] transition"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCopyChanges}
                        disabled={savingCopy}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
                      >
                        {savingCopy ? (
                          <>
                            <HiOutlineSparkles className="h-4 w-4 animate-spin" />
                            Saving Changes…
                          </>
                        ) : (
                          <>
                            <HiOutlineCheck className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("edit")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 border border-brand-200 px-3.5 py-2 text-xs font-bold text-brand-700 hover:bg-brand-100 transition dark:bg-brand-950/50 dark:border-brand-800 dark:text-brand-300"
                      >
                        <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                        Edit Template
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCopyPreview(null)}
                        className="rounded-xl bg-[#1a1224] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 dark:bg-brand-600"
                      >
                        Done
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })(), document.body)}
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
