"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineBookmark,
  HiOutlineCheck,
  HiOutlineClock,
  HiOutlineCpuChip,
  HiOutlineEnvelope,
  HiOutlineExclamationTriangle,
  HiOutlineFire,
  HiOutlineGlobeAmericas,
  HiOutlinePaperAirplane,
  HiOutlinePencilSquare,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineQueueList,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import {
  DEFAULT_DAY0_HOOKS,
  DEFAULT_FOLLOWUP_SEQUENCE,
  type CampaignHook,
  type CampaignFollowUpStep,
} from "@/lib/campaign-types";
import {
  TIMEZONE_OPTIONS,
  type TimezoneOption,
} from "@/lib/campaign-timezone";

type MailboxItem = {
  id: string;
  email: string;
  domain: string;
  label: string;
  type: "system" | "user";
  enabled: boolean;
  sendsToday: number;
  bouncedToday: number;
};

type LeadSegmentItem = {
  id: string;
  name: string;
  industry: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  leadCount: number;
  createdAt: string;
};

export function CampaignWizard({
  initialSegmentId,
  initialCampaignId,
}: {
  initialSegmentId?: string;
  initialCampaignId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data sources
  const [segments, setSegments] = useState<LeadSegmentItem[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);

  // Wizard state: Step 1 - Campaign Info & Segment
  const [name, setName] = useState<string>("");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(initialSegmentId || "");
  const [industry, setIndustry] = useState<string>("");
  const [country, setCountry] = useState<string>("US");
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [leadPreviewCount, setLeadPreviewCount] = useState<number>(0);

  // Wizard state: Step 2 - Day 0 Hooks
  const [hooks, setHooks] = useState<CampaignHook[]>(DEFAULT_DAY0_HOOKS);
  const [activeHookTab, setActiveHookTab] = useState<string>("A");

  // Wizard state: Step 3 - Follow-Up Sequence
  const [sequenceSteps, setSequenceSteps] = useState<CampaignFollowUpStep[]>(DEFAULT_FOLLOWUP_SEQUENCE);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  // Wizard state: Step 4 - Mailboxes & Limits
  const [selectedMailboxIds, setSelectedMailboxIds] = useState<string[]>([]);
  const [selectAllMailboxes, setSelectAllMailboxes] = useState<boolean>(true);
  const [dailyLimitPerMailbox, setDailyLimitPerMailbox] = useState<number>(10);
  const [minDelayMinutes, setMinDelayMinutes] = useState<number>(4);
  const [maxDelayMinutes, setMaxDelayMinutes] = useState<number>(7);

  // Wizard state: Step 5 - Scheduling & Timezones
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [useRecipientTimezone, setUseRecipientTimezone] = useState<boolean>(true);
  const [sendingDays, setSendingDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [sendingWindowStart, setSendingWindowStart] = useState<string>("09:00");
  const [sendingWindowEnd, setSendingWindowEnd] = useState<string>("17:00");
  const [scheduleType, setScheduleType] = useState<"launch_now" | "schedule" | "draft">("launch_now");
  const [scheduledStartDate, setScheduledStartDate] = useState<string>("");

  // Composer View Modes ("edit" | "preview")
  const [hookViewMode, setHookViewMode] = useState<Record<string, "edit" | "preview">>({
    A: "edit",
    B: "edit",
    C: "edit",
    D: "edit",
  });
  const [stepViewMode, setStepViewMode] = useState<Record<number, "edit" | "preview">>({});

  // Test send state
  const [testEmail, setTestEmail] = useState<string>("");
  const [testSending, setTestSending] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  function renderSimulated(text: string) {
    const bName = "Apex Roofing Miami";
    const cCity = city || "Miami";
    const sState = state || "Florida";
    const iIndustry = industry || "Roofing";
    const oName = "John Miller";
    const fName = "Antigravity Growth Team";
    return text
      .replace(/\{\{businessName\}\}/g, bName)
      .replace(/\{\{firstName\}\}/g, "John")
      .replace(/\{\{ownerName\}\}/g, oName)
      .replace(/\{\{city\}\}/g, cCity)
      .replace(/\{\{state\}\}/g, sState)
      .replace(/\{\{industry\}\}/g, iIndustry)
      .replace(/\{\{fromName\}\}/g, fName)
      .replace(/\{\{website\}\}/g, "apexroofingmiami.com")
      .replace(/\{\{phone\}\}/g, "(305) 555-0199");
  }

  // Load initial segments & mailboxes
  useEffect(() => {
    async function loadData() {
      try {
        const [segRes, mbRes] = await Promise.all([
          fetch("/api/segments"),
          fetch("/api/campaigns/mailboxes"),
        ]);
        const segData = await segRes.json();
        const mbData = await mbRes.json();

        if (segRes.ok) {
          setSegments(segData.segments || []);
          if (initialSegmentId) {
            const found = (segData.segments || []).find((s: LeadSegmentItem) => s.id === initialSegmentId);
            if (found) {
              setSelectedSegmentId(found.id);
              setName(`${found.name} Campaign`);
              setIndustry(found.industry || "");
              setCountry(found.country || "US");
              setState(found.state || "");
              setCity(found.city || "");
              setLeadPreviewCount(found.leadCount || 0);
            }
          }
        }

        if (mbRes.ok && Array.isArray(mbData.mailboxes)) {
          setMailboxes(mbData.mailboxes);
          setSelectedMailboxIds(mbData.mailboxes.map((m: MailboxItem) => m.id));
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [initialSegmentId]);

  // Handle segment selection change
  function handleSelectSegment(segId: string) {
    setSelectedSegmentId(segId);
    const seg = segments.find((s) => s.id === segId);
    if (seg) {
      if (!name || name.endsWith("Campaign")) {
        setName(`${seg.name} Campaign`);
      }
      setIndustry(seg.industry || "");
      setCountry(seg.country || "US");
      setState(seg.state || "");
      setCity(seg.city || "");
      setLeadPreviewCount(seg.leadCount || 0);
    }
  }

  // Toggle sending day
  function toggleSendingDay(day: string) {
    if (sendingDays.includes(day)) {
      if (sendingDays.length > 1) {
        setSendingDays(sendingDays.filter((d) => d !== day));
      }
    } else {
      setSendingDays([...sendingDays, day]);
    }
  }

  // Toggle mailbox selection
  function toggleMailbox(id: string) {
    if (selectedMailboxIds.includes(id)) {
      const next = selectedMailboxIds.filter((m) => m !== id);
      setSelectedMailboxIds(next);
      setSelectAllMailboxes(false);
    } else {
      const next = [...selectedMailboxIds, id];
      setSelectedMailboxIds(next);
      if (next.length === mailboxes.length) setSelectAllMailboxes(true);
    }
  }

  // Toggle select all mailboxes
  function toggleSelectAll() {
    if (selectAllMailboxes) {
      setSelectedMailboxIds([]);
      setSelectAllMailboxes(false);
    } else {
      setSelectedMailboxIds(mailboxes.map((m) => m.id));
      setSelectAllMailboxes(true);
    }
  }

  // Group mailboxes by domain
  const mailboxesByDomain = mailboxes.reduce<Record<string, MailboxItem[]>>((acc, m) => {
    const domain = m.domain || "Other";
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(m);
    return acc;
  }, {});

  // Add new follow-up step
  function handleAddStep() {
    if (sequenceSteps.length >= 10) return;
    const nextNum = sequenceSteps.length + 1;
    const newStep: CampaignFollowUpStep = {
      id: String(nextNum),
      stepNumber: nextNum,
      label: `Follow-Up ${nextNum}: New Step`,
      dayDelay: 3,
      subject: "Re: {{lastSubject}}",
      body: `Hi {{firstName}},\n\nFollowing up on my previous email regarding {{industry}} opportunities in {{city}}.\n\nDo you have a moment this week to chat?\n\nBest,\n{{fromName}}`,
      active: true,
    };
    setSequenceSteps([...sequenceSteps, newStep]);
    setActiveStepTab(nextNum);
  }

  // Remove follow-up step
  function handleRemoveStep(idx: number) {
    if (sequenceSteps.length <= 1) return;
    const next = sequenceSteps.filter((_, i) => i !== idx).map((s, i) => ({
      ...s,
      stepNumber: i + 1,
      id: String(i + 1),
      label: s.label.startsWith("Follow-Up") ? `Follow-Up ${i + 1}` : s.label,
    }));
    setSequenceSteps(next);
    setActiveStepTab(Math.min(activeStepTab, next.length));
  }

  // Send test email
  async function handleSendTest() {
    if (!testEmail.trim()) return;
    setTestSending(true);
    setTestSuccess(null);
    try {
      const res = await fetch(`/api/campaigns/test-send-generic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: testEmail.trim(),
          subject: hooks[0]?.subject || "Test Subject",
          body: hooks[0]?.body || "Test Body",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestSuccess(`Test email sent to ${testEmail}! Check your inbox.`);
      } else {
        setError(data.error || "Test send failed");
      }
    } catch {
      setError("Failed to send test email");
    } finally {
      setTestSending(false);
    }
  }

  // Submit / Launch Campaign
  async function handleSaveCampaign(overrideScheduleType?: "launch_now" | "schedule" | "draft") {
    if (!name.trim()) {
      setError("Please provide a campaign name in Step 1.");
      setStep(1);
      return;
    }
    if (!selectedSegmentId && leadPreviewCount === 0) {
      setError("Please select a lead segment in Step 1.");
      setStep(1);
      return;
    }

    setSaving(true);
    setError(null);

    const finalScheduleType = overrideScheduleType || scheduleType;

    try {
      const payload = {
        name: name.trim(),
        segmentId: selectedSegmentId || null,
        industry: industry || null,
        country: country || "US",
        state: state || null,
        city: city || null,
        hooks: hooks.filter((h) => h.active),
        steps: sequenceSteps.filter((s) => s.active),
        selectedMailboxIds: selectAllMailboxes ? "ALL" : selectedMailboxIds,
        dailyLimitPerMailbox,
        minDelayMinutes,
        maxDelayMinutes,
        timezone,
        useRecipientTimezone,
        sendingDays,
        sendingWindowStart,
        sendingWindowEnd,
        scheduleType: finalScheduleType,
        scheduledStartDate: scheduledStartDate ? new Date(scheduledStartDate).toISOString() : null,
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create campaign");
        return;
      }

      router.push(`/campaigns/${data.campaign.id}`);
    } catch {
      setError("An unexpected error occurred while saving the campaign.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-12 text-center text-sm text-ink-muted">
        <HiOutlineSparkles className="mx-auto mb-3 h-6 w-6 animate-spin text-brand-600" />
        Loading campaign setup…
      </div>
    );
  }

  const WIZARD_STEPS = [
    { num: 1, label: "Lead List & Segment", desc: "Select leads & detect duplicates" },
    { num: 2, label: "Day 0 Hooks", desc: "3–4 A/B/C/D outreach variations" },
    { num: 3, label: "Follow-Up Sequence", desc: "6–7 automated follow-up steps" },
    { num: 4, label: "Mailboxes & Limits", desc: "25 mailboxes across 5 domains" },
    { num: 5, label: "Schedule & Timezones", desc: "US/CA/UK/AU/NZ local times" },
    { num: 6, label: "Review & Launch", desc: "Test send & activate campaign" },
  ];

  return (
    <div className="space-y-6">
      {/* Wizard Step Progress Bar */}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[700px] items-center justify-between gap-2 rounded-2xl border border-border/80 bg-[var(--surface)] p-3 shadow-sm">
          {WIZARD_STEPS.map((s, idx) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={cn(
                  "flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition",
                  isCurrent
                    ? "bg-brand-50/80 border border-brand-300 dark:bg-brand-950/40 dark:border-brand-500/30"
                    : isDone
                    ? "hover:bg-[var(--input-bg)] text-ink"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-brand-600 text-white"
                      : "bg-[var(--input-bg)] text-ink-muted border border-border"
                  )}
                >
                  {isDone ? <HiOutlineCheck className="h-4 w-4" /> : s.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn("text-xs font-semibold truncate", isCurrent ? "text-brand-700 dark:text-brand-300" : "text-ink")}>
                    {s.label}
                  </div>
                  <div className="text-[11px] text-ink-muted truncate">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-medium text-rose-700 dark:text-rose-300">
          <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: LEAD LIST & SEGMENT */}
      {step === 1 && (
        <div className="space-y-6 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="text-lg font-bold text-ink">Step 1: Select Lead Segment & Campaign Info</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Choose a saved lead list or create a dedicated campaign for your recent scrapes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Campaign Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 25 Sep – Roofing – Florida"
                className="saas-input w-full font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Select Saved Lead Segment *</label>
              <select
                value={selectedSegmentId}
                onChange={(e) => handleSelectSegment(e.target.value)}
                className="saas-input w-full"
              >
                <option value="">-- Choose a Segment / List --</option>
                {segments.map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.name} ({seg.industry || "General"} · {seg.leadCount} leads)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segment Details & Duplicate Detection Summary */}
          {selectedSegmentId && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-950/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <HiOutlineUsers className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">
                      {segments.find((s) => s.id === selectedSegmentId)?.name}
                    </h4>
                    <p className="text-xs text-ink-muted">
                      Industry: {industry || "All"} · Country: {country} {state ? `· State: ${state}` : ""} {city ? `· City: ${city}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                    Duplicate Protection Active
                  </span>
                  <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                    {leadPreviewCount} Total Leads
                  </span>
                </div>
              </div>
            </div>
          )}

          {!selectedSegmentId && segments.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-ink-muted">
              No saved segments found. You can generate leads in{" "}
              <Link href="/leads/search" className="font-semibold text-brand-600 underline">
                Lead Finder
              </Link>{" "}
              and click <strong>"Save as Segment"</strong> first.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  setError("Please enter a campaign name.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
            >
              Continue to Day 0 Hooks <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DAY 0 MULTI-HOOKS */}
      {step === 2 && (
        <div className="space-y-6 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">Step 2: Day 0 Outreach — Multiple Hooks (A/B/C/D)</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Create 3–4 hook variations. The system will evenly distribute them to discover which angle generates the most replies.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-[var(--input-bg)] p-1">
              {hooks.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setActiveHookTab(h.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                    activeHookTab === h.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  {h.badge}
                  {!h.active && <span className="text-[10px] text-rose-300">(Off)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Active Hook Editor */}
          {hooks.map((h, idx) => {
            if (h.id !== activeHookTab) return null;
            const currentMode = hookViewMode[h.id] || "edit";
            const wordCount = h.body.trim() ? h.body.trim().split(/\s+/).length : 0;
            const charCount = h.body.length;

            return (
              <div key={h.id} className="space-y-4 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white shadow-xs">
                      {h.id}
                    </span>
                    <input
                      type="text"
                      value={h.label}
                      onChange={(e) => {
                        const next = [...hooks];
                        next[idx].label = e.target.value;
                        setHooks(next);
                      }}
                      className="saas-input text-xs font-bold max-w-sm"
                      placeholder="Hook Label (e.g. Local Overflow Angle)"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Compose vs Preview Tabs */}
                    <div className="flex items-center rounded-xl border border-border bg-[var(--input-bg)] p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setHookViewMode((prev) => ({ ...prev, [h.id]: "edit" }))}
                        className={cn(
                          "rounded-lg px-3 py-1.5 font-bold transition",
                          currentMode === "edit"
                            ? "bg-[var(--surface)] text-ink shadow-xs"
                            : "text-ink-muted hover:text-ink"
                        )}
                      >
                        ✍️ Compose Box
                      </button>
                      <button
                        type="button"
                        onClick={() => setHookViewMode((prev) => ({ ...prev, [h.id]: "preview" }))}
                        className={cn(
                          "rounded-lg px-3 py-1.5 font-bold transition",
                          currentMode === "preview"
                            ? "bg-[var(--surface)] text-brand-600 shadow-xs"
                            : "text-ink-muted hover:text-ink"
                        )}
                      >
                        👁️ Live Prospect Preview
                      </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={h.active}
                        onChange={(e) => {
                          const next = [...hooks];
                          next[idx].active = e.target.checked;
                          setHooks(next);
                        }}
                        className="rounded border-border accent-brand-600"
                      />
                      Include in Rotation
                    </label>
                  </div>
                </div>

                {/* Subject Line Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-ink">Email Subject Line</label>
                    <span className="text-[11px] text-ink-muted">Personalized with recipient data</span>
                  </div>
                  <input
                    type="text"
                    value={h.subject}
                    onChange={(e) => {
                      const next = [...hooks];
                      next[idx].subject = e.target.value;
                      setHooks(next);
                    }}
                    placeholder="e.g. Quick question for {{businessName}} in {{city}}"
                    className="saas-input w-full font-semibold text-xs py-2.5"
                  />
                </div>

                {/* Main Email Box or Preview */}
                {currentMode === "edit" ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--input-bg)]/80 rounded-xl px-3 py-2 border border-border">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-ink mr-1">Insert Dynamic Tag:</span>
                        {[
                          "{{businessName}}",
                          "{{firstName}}",
                          "{{ownerName}}",
                          "{{city}}",
                          "{{state}}",
                          "{{industry}}",
                          "{{fromName}}",
                          "{{website}}",
                          "{{phone}}",
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const next = [...hooks];
                              next[idx].body += ` ${tag}`;
                              setHooks(next);
                            }}
                            className="rounded-lg border border-border bg-[var(--surface)] px-2 py-1 font-mono text-[11px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition dark:text-brand-300 dark:hover:bg-brand-950/40"
                            title={`Add ${tag}`}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={14}
                        value={h.body}
                        onChange={(e) => {
                          const next = [...hooks];
                          next[idx].body = e.target.value;
                          setHooks(next);
                        }}
                        placeholder="Write your email body copy here..."
                        className="saas-input w-full font-sans text-xs leading-relaxed p-4 rounded-xl resize-y min-h-[300px] border-border shadow-xs focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-ink-muted px-1">
                      <div className="flex items-center gap-3 font-medium">
                        <span>📊 ~{wordCount} words</span>
                        <span>·</span>
                        <span>{charCount} characters</span>
                        <span>·</span>
                        <span className="text-emerald-600 font-semibold">✓ Human outreach format</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setHookViewMode((prev) => ({ ...prev, [h.id]: "preview" }))}
                        className="font-semibold text-brand-600 hover:underline"
                      >
                        Preview rendered email →
                      </button>
                    </div>
                  </div>
                ) : (
                  /* LIVE PROSPECT PREVIEW */
                  <div className="rounded-2xl border border-border bg-[var(--input-bg)] p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">From:</span>
                          <span className="font-semibold text-ink">Antigravity Growth &lt;team@contractorleads.us&gt;</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">To:</span>
                          <span className="font-semibold text-ink">John Miller &lt;john@apexroofingmiami.com&gt;</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">Subject:</span>
                          <span className="font-bold text-brand-700 dark:text-brand-300">
                            {renderSimulated(h.subject)}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                        Simulated Prospect View
                      </span>
                    </div>

                    <div className="rounded-xl bg-[var(--surface)] p-5 border border-border shadow-xs">
                      <div className="whitespace-pre-wrap text-xs text-ink leading-relaxed font-sans">
                        {renderSimulated(h.body)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-between gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
            >
              <HiOutlineArrowLeft className="h-4 w-4" /> Back to Step 1
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
            >
              Continue to Follow-Ups <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUTOMATED FOLLOW-UP SEQUENCE */}
      {step === 3 && (
        <div className="space-y-6 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink">Step 3: Automated Follow-Up Sequence (6–7 Steps)</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Customize the sequence, delays, and copy. Follow-ups automatically halt the second a prospect replies.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddStep}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-950/40 dark:text-brand-300"
            >
              <HiOutlinePlus className="h-4 w-4" /> Add Follow-Up Step
            </button>
          </div>

          {/* Follow up step tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {sequenceSteps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStepTab(idx + 1)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
                  activeStepTab === idx + 1
                    ? "bg-[#1a1224] text-white shadow-sm dark:bg-brand-600"
                    : "border border-border bg-[var(--input-bg)] text-ink hover:bg-[var(--surface)]"
                )}
              >
                <span>FU {idx + 1}</span>
                <span className="text-[10px] opacity-75">({s.dayDelay}d delay)</span>
                {!s.active && <span className="text-[10px] text-rose-300">Off</span>}
              </button>
            ))}
          </div>

          {/* Selected Step Editor */}
          {sequenceSteps.map((s, idx) => {
            if (activeStepTab !== idx + 1) return null;
            const currentMode = stepViewMode[idx + 1] || "edit";
            const wordCount = s.body.trim() ? s.body.trim().split(/\s+/).length : 0;
            const charCount = s.body.length;

            return (
              <div key={s.id} className="space-y-4 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white shadow-xs">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={s.label}
                      onChange={(e) => {
                        const next = [...sequenceSteps];
                        next[idx].label = e.target.value;
                        setSequenceSteps(next);
                      }}
                      className="saas-input text-xs font-bold max-w-sm"
                      placeholder="Follow-Up Label (e.g. Value + Proof Angle)"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Delay Picker */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-ink">
                      <span>Wait</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 7, 14].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              const next = [...sequenceSteps];
                              next[idx].dayDelay = d;
                              setSequenceSteps(next);
                            }}
                            className={cn(
                              "rounded-lg px-2 py-1 text-[11px] font-bold border transition",
                              s.dayDelay === d
                                ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                                : "bg-[var(--input-bg)] text-ink-muted border-border hover:bg-[var(--surface)]"
                            )}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={s.dayDelay}
                        onChange={(e) => {
                          const next = [...sequenceSteps];
                          next[idx].dayDelay = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setSequenceSteps(next);
                        }}
                        className="saas-input w-16 text-center font-bold text-xs"
                      />
                      <span>days</span>
                    </div>

                    {/* Compose vs Preview Tabs */}
                    <div className="flex items-center rounded-xl border border-border bg-[var(--input-bg)] p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setStepViewMode((prev) => ({ ...prev, [idx + 1]: "edit" }))}
                        className={cn(
                          "rounded-lg px-2.5 py-1 font-bold transition",
                          currentMode === "edit"
                            ? "bg-[var(--surface)] text-ink shadow-xs"
                            : "text-ink-muted hover:text-ink"
                        )}
                      >
                        ✍️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setStepViewMode((prev) => ({ ...prev, [idx + 1]: "preview" }))}
                        className={cn(
                          "rounded-lg px-2.5 py-1 font-bold transition",
                          currentMode === "preview"
                            ? "bg-[var(--surface)] text-brand-600 shadow-xs"
                            : "text-ink-muted hover:text-ink"
                        )}
                      >
                        👁️ Preview
                      </button>
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-ink">
                      <input
                        type="checkbox"
                        checked={s.active}
                        onChange={(e) => {
                          const next = [...sequenceSteps];
                          next[idx].active = e.target.checked;
                          setSequenceSteps(next);
                        }}
                        className="rounded border-border accent-brand-600"
                      />
                      Active
                    </label>

                    {sequenceSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="rounded-lg p-1.5 text-ink-muted hover:text-rose-600 transition"
                        title="Remove step"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={s.subject}
                    onChange={(e) => {
                      const next = [...sequenceSteps];
                      next[idx].subject = e.target.value;
                      setSequenceSteps(next);
                    }}
                    placeholder="e.g. Re: {{lastSubject}}"
                    className="saas-input w-full font-semibold text-xs py-2.5"
                  />
                </div>

                {currentMode === "edit" ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--input-bg)]/80 rounded-xl px-3 py-2 border border-border">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-ink mr-1">Insert Dynamic Tag:</span>
                        {[
                          "{{businessName}}",
                          "{{firstName}}",
                          "{{ownerName}}",
                          "{{city}}",
                          "{{state}}",
                          "{{industry}}",
                          "{{fromName}}",
                          "{{website}}",
                          "{{phone}}",
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const next = [...sequenceSteps];
                              next[idx].body += ` ${tag}`;
                              setSequenceSteps(next);
                            }}
                            className="rounded-lg border border-border bg-[var(--surface)] px-2 py-1 font-mono text-[11px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition dark:text-brand-300 dark:hover:bg-brand-950/40"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={13}
                        value={s.body}
                        onChange={(e) => {
                          const next = [...sequenceSteps];
                          next[idx].body = e.target.value;
                          setSequenceSteps(next);
                        }}
                        placeholder="Write follow-up email content..."
                        className="saas-input w-full font-sans text-xs leading-relaxed p-4 rounded-xl resize-y min-h-[280px] border-border shadow-xs focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-ink-muted px-1">
                      <div className="flex items-center gap-3 font-medium">
                        <span>📊 ~{wordCount} words</span>
                        <span>·</span>
                        <span>{charCount} characters</span>
                        <span>·</span>
                        <span className="text-emerald-600 font-semibold">
                          ✓ Follow-up #{idx + 1} (halts immediately upon reply)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* LIVE PREVIEW */
                  <div className="rounded-2xl border border-border bg-[var(--input-bg)] p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">Follow-up:</span>
                          <span className="font-semibold text-ink">Sent {s.dayDelay} days after previous step</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted">Subject:</span>
                          <span className="font-bold text-brand-700 dark:text-brand-300">
                            {renderSimulated(s.subject)}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-300">
                        Simulated Follow-up #{idx + 1}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[var(--surface)] p-5 border border-border shadow-xs">
                      <div className="whitespace-pre-wrap text-xs text-ink leading-relaxed font-sans">
                        {renderSimulated(s.body)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-between gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
            >
              <HiOutlineArrowLeft className="h-4 w-4" /> Back to Step 2
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
            >
              Continue to Mailboxes <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: MAILBOXES & DOMAIN ALLOCATION */}
      {step === 4 && (
        <div className="space-y-6 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="text-lg font-bold text-ink">Step 4: Mailbox & Domain Selection & Sending Limits</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Select which domains and mailboxes to distribute emails across (e.g. 5 domains × 5 mailboxes = 25 mailboxes).
            </p>
          </div>

          {/* Daily Limits & Warmup presets */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-ink">
                  Daily Sending Limit Per Mailbox
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={dailyLimitPerMailbox}
                    onChange={(e) => setDailyLimitPerMailbox(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="saas-input w-20 text-center font-bold text-xs"
                  />
                  <span className="text-xs text-brand-600 font-semibold">/ day</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { label: "2/day (Warmup)", val: 2 },
                  { label: "4/day", val: 4 },
                  { label: "8/day", val: 8 },
                  { label: "10/day (Default)", val: 10 },
                  { label: "15/day", val: 15 },
                  { label: "25/day (Scale)", val: 25 },
                  { label: "50/day (Max)", val: 50 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setDailyLimitPerMailbox(preset.val)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition",
                      dailyLimitPerMailbox === preset.val
                        ? "bg-brand-600 text-white"
                        : "border border-border bg-[var(--surface)] text-ink hover:bg-[var(--input-bg)]"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={dailyLimitPerMailbox}
                onChange={(e) => setDailyLimitPerMailbox(parseInt(e.target.value, 10))}
                className="w-full accent-brand-600"
              />
              <p className="mt-2 text-[11px] text-ink-muted">
                Total daily campaign capacity:{" "}
                <strong className="text-ink">
                  {selectedMailboxIds.length} mailboxes × {dailyLimitPerMailbox} ={" "}
                  {selectedMailboxIds.length * dailyLimitPerMailbox} emails/day
                </strong>
              </p>
            </div>

            {/* Human-like interval spacing */}
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-ink">Custom Email Sending Spacing / Jitter</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => { setMinDelayMinutes(2); setMaxDelayMinutes(4); }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border bg-[var(--surface)] hover:bg-brand-50"
                  >
                    Fast (2-4m)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMinDelayMinutes(4); setMaxDelayMinutes(7); }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border border-brand-300 bg-brand-50 text-brand-700"
                  >
                    Standard (4-7m)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMinDelayMinutes(8); setMaxDelayMinutes(15); }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border bg-[var(--surface)] hover:bg-brand-50"
                  >
                    Safe (8-15m)
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-ink-muted block mb-1">Min Delay (Custom)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={minDelayMinutes}
                      onChange={(e) => setMinDelayMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="saas-input w-full font-bold"
                    />
                    <span className="text-xs text-ink-muted">mins</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-ink-muted block mb-1">Max Delay (Custom)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={minDelayMinutes}
                      max={240}
                      value={maxDelayMinutes}
                      onChange={(e) => setMaxDelayMinutes(Math.max(minDelayMinutes, parseInt(e.target.value, 10) || 7))}
                      className="saas-input w-full font-bold"
                    />
                    <span className="text-xs text-ink-muted">mins</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-ink-muted">
                Each email is throttled with randomized human jitter between {minDelayMinutes} to {maxDelayMinutes} minutes to protect mailbox deliverability.
              </p>
            </div>
          </div>

          {/* Mailboxes Grouped by Domain */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink">Connected Domains & Mailboxes ({mailboxes.length} Total)</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  {selectAllMailboxes ? "Deselect All" : "Select All 25 Mailboxes"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(mailboxesByDomain).map(([domain, mList]) => (
                <div key={domain} className="rounded-xl border border-border/80 bg-[var(--surface)] p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                    <span className="text-xs font-bold text-ink">
                      🌐 Domain: <span className="text-brand-700 dark:text-brand-300">{domain}</span> ({mList.length} mailboxes)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const domainIds = mList.map((m) => m.id);
                        const allSelected = domainIds.every((id) => selectedMailboxIds.includes(id));
                        if (allSelected) {
                          setSelectedMailboxIds(selectedMailboxIds.filter((id) => !domainIds.includes(id)));
                          setSelectAllMailboxes(false);
                        } else {
                          const merged = Array.from(new Set([...selectedMailboxIds, ...domainIds]));
                          setSelectedMailboxIds(merged);
                        }
                      }}
                      className="text-[11px] font-semibold text-ink-muted hover:text-brand-600"
                    >
                      Toggle Domain
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {mList.map((mb) => {
                      const isSelected = selectedMailboxIds.includes(mb.id);
                      return (
                        <label
                          key={mb.id}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition",
                            isSelected
                              ? "border-brand-400 bg-brand-50/60 dark:bg-brand-950/40"
                              : "border-border/70 bg-[var(--input-bg)] opacity-70"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMailbox(mb.id)}
                            className="rounded border-border"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-ink truncate">{mb.label}</div>
                            <div className="text-[11px] text-ink-muted truncate">{mb.email}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
            >
              <HiOutlineArrowLeft className="h-4 w-4" /> Back to Step 3
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedMailboxIds.length === 0) {
                  setError("Please select at least one mailbox.");
                  return;
                }
                setError(null);
                setStep(5);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
            >
              Continue to Schedule <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: TIMEZONE SCHEDULING & SENDING WINDOW */}
      {step === 5 && (
        <div className="space-y-6 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="text-lg font-bold text-ink">Step 5: Timezone Scheduling & Sending Window (Customizable)</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Define the target market timezone, custom sending days, custom time windows, and launch schedule.
            </p>
          </div>

          {/* Smart Recipient Local-Time Option */}
          <div className="rounded-2xl border border-brand-300 bg-brand-50/70 p-4 dark:border-brand-500/30 dark:bg-brand-950/40">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="useRecipientTimezone"
                checked={useRecipientTimezone}
                onChange={(e) => setUseRecipientTimezone(e.target.checked)}
                className="mt-1 rounded border-border"
              />
              <div>
                <label htmlFor="useRecipientTimezone" className="block text-sm font-bold text-ink cursor-pointer">
                  ✨ Send According to Recipient's Local Time Zone (Recommended)
                </label>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Automatically delivers Florida leads during Eastern 9 AM–5 PM, Texas leads during Central 9 AM–5 PM, and California leads during Pacific 9 AM–5 PM without creating separate campaigns.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Target Market Timezone</label>
              <select
                value={timezone === "CUSTOM" || !TIMEZONE_OPTIONS.some((t) => t.iana === timezone && t.iana !== "CUSTOM") ? "CUSTOM" : timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="saas-input w-full font-medium"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.id} value={tz.iana}>
                    {tz.marketLabel}: {tz.name}
                  </option>
                ))}
              </select>

              {(timezone === "CUSTOM" || !TIMEZONE_OPTIONS.some((t) => t.iana === timezone && t.iana !== "CUSTOM")) && (
                <div className="mt-2">
                  <span className="text-[11px] text-ink-muted block mb-1">Custom IANA Timezone Name</span>
                  <input
                    type="text"
                    value={timezone === "CUSTOM" ? "" : timezone}
                    onChange={(e) => setTimezone(e.target.value.trim() || "CUSTOM")}
                    placeholder="e.g. America/Denver, Europe/Paris, Asia/Dubai"
                    className="saas-input w-full font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Campaign Launch Action</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as any)}
                className="saas-input w-full font-semibold"
              >
                <option value="launch_now">🚀 Launch Immediately</option>
                <option value="schedule">📅 Schedule for Specific Date & Time (Custom)</option>
                <option value="draft">💾 Save as Draft (Launch Later)</option>
              </select>
            </div>
          </div>

          {scheduleType === "schedule" && (
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-4 space-y-3">
              <label className="block text-xs font-bold text-ink">Custom Scheduled Start Date & Time</label>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    label: "Today +2 Hours",
                    getVal: () => new Date(Date.now() + 2 * 3600 * 1000).toISOString().slice(0, 16),
                  },
                  {
                    label: "Tomorrow 9:00 AM",
                    getVal: () => {
                      const d = new Date(Date.now() + 24 * 3600 * 1000);
                      d.setHours(9, 0, 0, 0);
                      return d.toISOString().slice(0, 16);
                    },
                  },
                  {
                    label: "Next Monday 9:00 AM",
                    getVal: () => {
                      const d = new Date();
                      d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
                      d.setHours(9, 0, 0, 0);
                      return d.toISOString().slice(0, 16);
                    },
                  },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setScheduledStartDate(s.getVal())}
                    className="rounded-lg border border-border bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    ⚡ {s.label}
                  </button>
                ))}
              </div>
              <input
                type="datetime-local"
                value={scheduledStartDate}
                onChange={(e) => setScheduledStartDate(e.target.value)}
                className="saas-input w-full max-w-sm font-semibold"
              />
            </div>
          )}

          {/* Sending Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-ink">Custom Sending Days</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSendingDays(["mon", "tue", "wed", "thu", "fri"])}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  Weekdays (Mon–Fri)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => setSendingDays(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  All 7 Days
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => setSendingDays(["mon", "wed", "fri"])}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  Mon/Wed/Fri
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "mon", label: "Monday" },
                { id: "tue", label: "Tuesday" },
                { id: "wed", label: "Wednesday" },
                { id: "thu", label: "Thursday" },
                { id: "fri", label: "Friday" },
                { id: "sat", label: "Saturday" },
                { id: "sun", label: "Sunday" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleSendingDay(d.id)}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-xs font-bold transition",
                    sendingDays.includes(d.id)
                      ? "bg-brand-600 text-white shadow-sm"
                      : "border border-border bg-[var(--input-bg)] text-ink-muted hover:text-ink"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sending Window */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-ink">Custom Sending Time Window</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("09:00"); setSendingWindowEnd("17:00"); }}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  9 AM – 5 PM (Standard)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("08:00"); setSendingWindowEnd("18:00"); }}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  8 AM – 6 PM (Extended)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("00:00"); setSendingWindowEnd("23:59"); }}
                  className="text-[11px] font-semibold text-brand-600 hover:underline"
                >
                  24/7 (No limit)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <span className="text-[11px] text-ink-muted block mb-1">Window Start Time (Custom)</span>
                <input
                  type="time"
                  value={sendingWindowStart}
                  onChange={(e) => setSendingWindowStart(e.target.value)}
                  className="saas-input w-full font-bold"
                />
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block mb-1">Window End Time (Custom)</span>
                <input
                  type="time"
                  value={sendingWindowEnd}
                  onChange={(e) => setSendingWindowEnd(e.target.value)}
                  className="saas-input w-full font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
            >
              <HiOutlineArrowLeft className="h-4 w-4" /> Back to Step 4
            </button>
            <button
              type="button"
              onClick={() => setStep(6)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
            >
              Review & Finalize <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: REVIEW & LAUNCH */}
      {step === 6 && (
        <div className="space-y-6 rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <div>
            <h2 className="text-lg font-bold text-ink">Step 6: Review & Launch Campaign</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Verify your setup, send a test email, and launch your automated sequence.
            </p>
          </div>

          {/* Summary matrix */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3.5">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">Campaign</span>
              <span className="text-sm font-bold text-ink truncate block mt-0.5">{name}</span>
              <span className="text-xs text-ink-muted block mt-1">{leadPreviewCount} Total Prospects</span>
            </div>

            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3.5">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">Outreach Hooks</span>
              <span className="text-sm font-bold text-ink block mt-0.5">
                {hooks.filter((h) => h.active).length} Day 0 Hooks (A/B/C/D)
              </span>
              <span className="text-xs text-ink-muted block mt-1">
                {sequenceSteps.filter((s) => s.active).length} Follow-Up Steps
              </span>
            </div>

            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3.5">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">Mailboxes & Caps</span>
              <span className="text-sm font-bold text-ink block mt-0.5">
                {selectedMailboxIds.length} Mailboxes Selected
              </span>
              <span className="text-xs text-ink-muted block mt-1">
                {dailyLimitPerMailbox} sends/mailbox/day
              </span>
            </div>

            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-3.5">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">Schedule</span>
              <span className="text-sm font-bold text-ink block mt-0.5">
                {sendingWindowStart} – {sendingWindowEnd}
              </span>
              <span className="text-xs text-ink-muted block mt-1">
                {useRecipientTimezone ? "Recipient Local Time" : timezone.split("/").pop()?.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Test Send Section */}
          <div className="rounded-xl border border-border bg-[var(--input-bg)] p-4">
            <h4 className="text-xs font-bold text-ink mb-1">Send a Test Email</h4>
            <p className="text-[11px] text-ink-muted mb-3">
              Preview how Hook A looks in your inbox with simulated prospect data.
            </p>
            <div className="flex flex-wrap gap-2 max-w-md">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="saas-input flex-1 font-medium"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testSending || !testEmail.trim()}
                className="rounded-xl bg-[#1a1224] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-brand-600"
              >
                {testSending ? "Sending…" : "Send Test"}
              </button>
            </div>
            {testSuccess && (
              <p className="mt-2 text-xs font-semibold text-emerald-600">{testSuccess}</p>
            )}
          </div>

          {/* Action Launch Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(5)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-[var(--input-bg)]"
            >
              <HiOutlineArrowLeft className="h-4 w-4" /> Back to Schedule
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSaveCampaign("draft")}
                disabled={saving}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-[var(--input-bg)] disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => void handleSaveCampaign(scheduleType === "schedule" ? "schedule" : "launch_now")}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-50"
              >
                <HiOutlineRocketLaunch className="h-4 w-4" />
                {saving
                  ? "Saving Campaign…"
                  : scheduleType === "schedule"
                  ? "Schedule Campaign 📅"
                  : "Launch Campaign Now 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HiOutlineRocketLaunch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
      />
    </svg>
  );
}
