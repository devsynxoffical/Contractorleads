"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
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
  HiOutlinePaperClip,
  HiOutlineLink,
  HiOutlineFolder,
  HiOutlineFolderOpen,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineArrowTrendingUp,
  HiOutlineDocumentText,
  HiOutlineDocumentArrowUp,
  HiOutlineTableCells,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { SpreadsheetImporter } from "@/components/campaigns/spreadsheet-importer";
import type { ParsedLead } from "@/lib/spreadsheet-parser";
import {
  DEFAULT_DAY0_HOOKS,
  DEFAULT_FOLLOWUP_SEQUENCE,
  type CampaignHook,
  type CampaignFollowUpStep,
  type CampaignAttachment,
  formatEmailBodyToHtml,
  formatBytes,
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

  // Wizard state: Step 1 - Campaign Info & Lead Source
  const [name, setName] = useState<string>("");
  const [leadSource, setLeadSource] = useState<"segment" | "spreadsheet">("segment");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(initialSegmentId || "");
  const [importedLeads, setImportedLeads] = useState<ParsedLead[]>([]);
  const [industry, setIndustry] = useState<string>("");
  const [country, setCountry] = useState<string>("US");
  const [state, setState] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [leadPreviewCount, setLeadPreviewCount] = useState<number>(0);
  const [verifyingSegment, setVerifyingSegment] = useState<boolean>(false);
  const [verifyMsg, setVerifyMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

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
  const [customMailboxLimits, setCustomMailboxLimits] = useState<Record<string, number>>({});
  const [collapsedDomains, setCollapsedDomains] = useState<Record<string, boolean>>({});

  // Weekly ramp-up warmup settings
  const [enableWeeklyRampUp, setEnableWeeklyRampUp] = useState<boolean>(false);
  const [rampUpStartLimit, setRampUpStartLimit] = useState<number>(5);
  const [rampUpIncreasePerWeek, setRampUpIncreasePerWeek] = useState<number>(5);
  const [rampUpMaxCeiling, setRampUpMaxCeiling] = useState<number>(30);

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
  const [testMailboxId, setTestMailboxId] = useState<string>("");
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

  function renderSimulatedHtml(
    body: string,
    attachments?: CampaignAttachment[],
    enableUnsubscribe?: boolean,
    unsubscribeText?: string
  ) {
    const simulatedText = renderSimulated(body);
    return formatEmailBodyToHtml(simulatedText, {
      attachments,
      enableUnsubscribe,
      unsubscribeText,
      unsubscribeUrl: "#unsubscribe-preview",
    });
  }

  // Helper to insert dynamic tag or text exactly at the cursor selection
  function insertTextIntoTextarea(
    elementId: string,
    currentVal: string,
    toInsert: string,
    onUpdate: (nextText: string) => void
  ) {
    const el = document.getElementById(elementId) as HTMLTextAreaElement | null;
    if (!el) {
      onUpdate(currentVal ? `${currentVal} ${toInsert}` : toInsert);
      return;
    }
    const start = el.selectionStart ?? currentVal.length;
    const end = el.selectionEnd ?? currentVal.length;
    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    const nextVal = before + toInsert + after;
    onUpdate(nextVal);
    requestAnimationFrame(() => {
      el.focus();
      const newPos = start + toInsert.length;
      el.setSelectionRange(newPos, newPos);
    });
  }

  // Helper to apply rich-text formatting (bold, italic, underline, link, list, quote)
  function applyFormattingToTextarea(
    elementId: string,
    currentVal: string,
    formatType: "bold" | "italic" | "underline" | "strike" | "link" | "bullet" | "number" | "quote" | "code",
    onUpdate: (nextText: string) => void
  ) {
    const el = document.getElementById(elementId) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selectedText = currentVal.substring(start, end);
    let replacement = "";
    let cursorOffset = 0;

    switch (formatType) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;
      case "italic":
        replacement = `*${selectedText || "italic text"}*`;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case "underline":
        replacement = `<u>${selectedText || "underlined text"}</u>`;
        cursorOffset = selectedText ? replacement.length : 3;
        break;
      case "strike":
        replacement = `~~${selectedText || "strikethrough"}~~`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;
      case "code":
        replacement = `\`${selectedText || "code"}\``;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case "link": {
        const url = window.prompt("Enter link URL (e.g. https://apexroofing.com):", "https://");
        if (!url) return;
        replacement = `[${selectedText || "Click here"}](${url})`;
        cursorOffset = replacement.length;
        break;
      }
      case "bullet": {
        if (selectedText) {
          replacement = selectedText
            .split("\n")
            .map((line) => (line.trim().startsWith("- ") ? line : `- ${line}`))
            .join("\n");
        } else {
          replacement = "\n- Key point 1\n- Key point 2\n";
        }
        cursorOffset = replacement.length;
        break;
      }
      case "number": {
        if (selectedText) {
          replacement = selectedText
            .split("\n")
            .map((line, idx) => (/^\d+\.\s+/.test(line.trim()) ? line : `${idx + 1}. ${line}`))
            .join("\n");
        } else {
          replacement = "\n1. Step one\n2. Step two\n";
        }
        cursorOffset = replacement.length;
        break;
      }
      case "quote": {
        if (selectedText) {
          replacement = selectedText
            .split("\n")
            .map((line) => (line.trim().startsWith(">") ? line : `> ${line}`))
            .join("\n");
        } else {
          replacement = "\n> Verified homeowner quote or reference\n";
        }
        cursorOffset = replacement.length;
        break;
      }
    }

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    const nextVal = before + replacement + after;
    onUpdate(nextVal);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + cursorOffset, start + cursorOffset);
    });
  }

  // File upload to Base64 reader
  async function handleFilesUpload(
    files: FileList | null,
    onAdd: (newAttachments: CampaignAttachment[]) => void
  ) {
    if (!files || files.length === 0) return;
    const added: CampaignAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) {
        alert(`File ${file.name} is larger than the 15MB limit.`);
        continue;
      }
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      added.push({
        id: Math.random().toString(36).slice(2, 9),
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        contentBase64: base64,
        placement: "bottom",
      });
    }
    if (added.length > 0) {
      onAdd(added);
    }
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

        if (segRes.ok && Array.isArray(segData.segments)) {
          setSegments(segData.segments);
          const targetId = initialSegmentId || (segData.segments.length > 0 ? segData.segments[0].id : "");
          if (targetId) {
            const found = segData.segments.find((s: LeadSegmentItem) => s.id === targetId) || segData.segments[0];
            if (found) {
              setSelectedSegmentId(found.id);
              setName(`${found.name} Campaign`);
              setIndustry(found.industry || "");
              setCountry(found.country || "US");
              setState(found.state || "");
              setCity(found.city || "");
              setLeadPreviewCount(found.leadCount || 0);

              // Live fetch leads count to ensure 100% accuracy
              void (async () => {
                try {
                  const lRes = await fetch(`/api/segments/leads?segmentId=${found.id}&limit=1`);
                  const lData = await lRes.json();
                  if (lRes.ok && typeof lData.total === "number" && lData.total > 0) {
                    setLeadPreviewCount(lData.total);
                    setSegments((prev) =>
                      prev.map((s) => (s.id === found.id ? { ...s, leadCount: lData.total } : s)),
                    );
                  }
                } catch {
                  /* ignore */
                }
              })();
            }
          }
        }

        if (mbRes.ok && Array.isArray(mbData.mailboxes)) {
          const eligibleMailboxes = mbData.mailboxes.filter(
            (m: MailboxItem) => !m.email.toLowerCase().includes("contractorleads.us")
          );
          setMailboxes(eligibleMailboxes);
          setSelectedMailboxIds(eligibleMailboxes.map((m: MailboxItem) => m.id));
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
  async function handleSelectSegment(segId: string) {
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

      // Query live lead count
      try {
        const lRes = await fetch(`/api/segments/leads?segmentId=${seg.id}&limit=1`);
        const lData = await lRes.json();
        if (lRes.ok && typeof lData.total === "number" && lData.total > 0) {
          setLeadPreviewCount(lData.total);
          setSegments((prev) =>
            prev.map((s) => (s.id === seg.id ? { ...s, leadCount: lData.total } : s)),
          );
        }
      } catch {
        /* ignore */
      }
    }
  }

  // Triple-check and clean emails from selected segment
  async function handleTripleCheckSegment() {
    if (!selectedSegmentId || verifyingSegment) return;
    setVerifyingSegment(true);
    setVerifyMsg(null);
    try {
      const res = await fetch("/api/segments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentId: selectedSegmentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVerifyMsg({ type: "error", text: data.error || "Email verification failed." });
        return;
      }

      const cleanCount = data.remainingCount ?? data.validCount ?? 0;
      const removedCount = data.removedCount ?? data.invalidCount ?? 0;

      if (data.newSegment) {
        setSegments((prev) => {
          const exists = prev.some((s) => s.id === data.newSegment.id);
          if (exists) {
            return prev.map((s) => (s.id === data.newSegment.id ? { ...s, ...data.newSegment } : s));
          }
          return [data.newSegment, ...prev];
        });
        setSelectedSegmentId(data.newSegment.id);
      }
      setLeadPreviewCount(cleanCount);

      setVerifyMsg({
        type: "success",
        text: `Created new verified segment "${data.newSegmentName || "Verified Segment"}" (${cleanCount} clean leads)! Selected for this campaign. Original segment is preserved with all phone numbers.`,
      });
    } catch {
      setVerifyMsg({ type: "error", text: "Network error during email verification." });
    } finally {
      setVerifyingSegment(false);
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
    setError(null);
    setTestSuccess(null);
    try {
      const chosenAccountId = testMailboxId || (selectedMailboxIds.length > 0 ? selectedMailboxIds[0] : undefined);
      const activeHook = hooks.find((h) => h.id === activeHookTab) || hooks[0];
      const res = await fetch(`/api/campaigns/test-send-generic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: testEmail.trim(),
          subject: activeHook?.subject || "Test Subject",
          body: activeHook?.body || "Test Body",
          attachments: activeHook?.attachments || [],
          enableUnsubscribe: activeHook?.enableUnsubscribe,
          unsubscribeText: activeHook?.unsubscribeText,
          accountId: chosenAccountId,
          mailboxIds: selectedMailboxIds.length > 0 ? selectedMailboxIds : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestSuccess(`Test email sent to ${testEmail}${data.result?.from ? ` via ${data.result.from}` : ""}! Check your inbox.`);
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
    if (leadSource === "segment" && !selectedSegmentId && leadPreviewCount === 0) {
      setError("Please select a lead segment in Step 1.");
      setStep(1);
      return;
    }
    if (leadSource === "spreadsheet" && importedLeads.length === 0) {
      setError("Please import an Excel spreadsheet, CSV or paste leads in Step 1.");
      setStep(1);
      return;
    }

    setSaving(true);
    setError(null);

    const finalScheduleType = overrideScheduleType || scheduleType;

    try {
      const payload = {
        name: name.trim(),
        segmentId: leadSource === "segment" ? (selectedSegmentId || null) : null,
        leads: leadSource === "spreadsheet" ? importedLeads : undefined,
        industry: industry || null,
        country: country || "US",
        state: state || null,
        city: city || null,
        hooks: hooks.filter((h) => h.active),
        steps: sequenceSteps.filter((s) => s.active),
        selectedMailboxIds: selectAllMailboxes ? "ALL" : selectedMailboxIds,
        dailyLimitPerMailbox,
        mailboxLimits: Object.keys(customMailboxLimits).length > 0 ? customMailboxLimits : undefined,
        weeklyRampUp: enableWeeklyRampUp
          ? {
              enabled: true,
              startDailyLimit: rampUpStartLimit,
              increasePerWeek: rampUpIncreasePerWeek,
              maxDailyCeiling: rampUpMaxCeiling,
            }
          : undefined,
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
      <div className="rounded-2xl border border-border/80 bg-[var(--surface)] p-2.5 sm:p-3 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {WIZARD_STEPS.map((s) => {
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-xl p-2 sm:p-2.5 text-left transition border",
                  isCurrent
                    ? "bg-brand-50/90 border-brand-300 shadow-2xs dark:bg-brand-950/40 dark:border-brand-500/40"
                    : isDone
                    ? "bg-[var(--surface)] border-transparent hover:border-border hover:bg-[var(--input-bg)]/60 text-ink"
                    : "bg-[var(--surface)] border-transparent opacity-65 hover:opacity-100 hover:border-border/60 text-ink-muted",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition shadow-2xs",
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-brand-600 text-white shadow-brand-500/20"
                      : "bg-[var(--input-bg)] text-ink-muted border border-border group-hover:border-ink-muted/40",
                  )}
                >
                  {isDone ? <HiOutlineCheck className="h-4 w-4 stroke-[2.5]" /> : s.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-xs font-bold truncate leading-tight",
                      isCurrent
                        ? "text-brand-700 dark:text-brand-300"
                        : isDone
                        ? "text-ink font-semibold"
                        : "text-ink-muted group-hover:text-ink font-medium",
                    )}
                  >
                    {s.label}
                  </div>
                  <div className="text-[10.5px] text-ink-faint truncate leading-tight mt-0.5">
                    {s.desc}
                  </div>
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
            <h2 className="text-lg font-bold text-ink">Step 1: Select Lead Source & Campaign Info</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Choose a saved lead segment or upload any Excel workbook, CSV sheet, or paste spreadsheet rows directly for emailing.
            </p>
          </div>

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

          {/* Lead Source Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">Lead Source *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLeadSource("segment")}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                  leadSource === "segment"
                    ? "border-brand-500 bg-brand-50/50 shadow-sm dark:bg-brand-950/20"
                    : "border-border bg-[var(--input-bg)]/40 hover:border-border/80 hover:bg-[var(--input-bg)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    leadSource === "segment" ? "bg-brand-600 text-white" : "bg-border text-ink-muted"
                  )}
                >
                  <HiOutlineBookmark className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">Saved Lead Segment</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    Select from existing lists created from Lead Finder or scraped databases.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLeadSource("spreadsheet")}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                  leadSource === "spreadsheet"
                    ? "border-brand-500 bg-brand-50/50 shadow-sm dark:bg-brand-950/20"
                    : "border-border bg-[var(--input-bg)]/40 hover:border-border/80 hover:bg-[var(--input-bg)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    leadSource === "spreadsheet" ? "bg-brand-600 text-white" : "bg-border text-ink-muted"
                  )}
                >
                  <HiOutlineDocumentArrowUp className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">Import Spreadsheet / Excel / CSV</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    Upload .xlsx, .xls, .csv, or paste tab-separated rows directly.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Option A: Saved Segment */}
          {leadSource === "segment" && (
            <div className="space-y-4">
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

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                        Duplicate Protection Active
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleTripleCheckSegment()}
                        disabled={verifyingSegment}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 disabled:opacity-50"
                        title="Triple-check emails (Syntax, MX records, SMTP handshake) and drop non-working emails"
                      >
                        {verifyingSegment ? (
                          <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <HiOutlineShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span>{verifyingSegment ? "Verifying..." : "Triple-Check & Clean Segment"}</span>
                      </button>
                      <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                        {leadPreviewCount || segments.find((s) => s.id === selectedSegmentId)?.leadCount || 0} Total Leads
                      </span>
                    </div>
                  </div>

                  {verifyMsg && (
                    <div
                      className={`mt-3 flex items-center justify-between rounded-xl border p-2.5 text-xs font-medium ${
                        verifyMsg.type === "error"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{verifyMsg.text}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVerifyMsg(null)}
                        className="ml-2 text-xs font-bold text-ink-muted hover:text-ink"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!selectedSegmentId && segments.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-ink-muted">
                  No saved segments found. You can switch to <strong>"Import Spreadsheet"</strong> above, or generate leads in{" "}
                  <Link href="/leads/search" className="font-semibold text-brand-600 underline">
                    Lead Finder
                  </Link>{" "}
                  and click <strong>"Save as Segment"</strong> first.
                </div>
              )}
            </div>
          )}

          {/* Option B: Spreadsheet Importer */}
          {leadSource === "spreadsheet" && (
            <div className="space-y-4">
              <SpreadsheetImporter
                onImportComplete={(leads) => {
                  setImportedLeads(leads);
                  setLeadPreviewCount(leads.length);
                  // Auto infer default name if not set
                  if (!name.trim() && leads.length > 0) {
                    setName(`Campaign – Spreadsheet (${leads.length} leads)`);
                  }
                }}
              />
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
                if (leadSource === "segment" && !selectedSegmentId && leadPreviewCount === 0) {
                  setError("Please select a lead segment or switch to 'Import Spreadsheet'.");
                  return;
                }
                if (leadSource === "spreadsheet" && importedLeads.length === 0) {
                  setError("Please upload an Excel spreadsheet, CSV or paste leads to continue.");
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
                              insertTextIntoTextarea(
                                `hook-body-${h.id}`,
                                h.body,
                                tag,
                                (newVal) => {
                                  const next = [...hooks];
                                  next[idx].body = newVal;
                                  setHooks(next);
                                }
                              );
                            }}
                            className="rounded-lg border border-border bg-[var(--surface)] px-2 py-1 font-mono text-[11px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition dark:text-brand-300 dark:hover:bg-brand-950/40"
                            title={`Insert ${tag} at cursor position`}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rich Text Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 bg-[var(--surface)] border border-border rounded-xl px-2.5 py-1.5 text-xs shadow-xs">
                      <span className="text-[11px] font-bold text-ink-muted mr-1.5">Format:</span>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "bold", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="p-1 px-2 font-bold rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Bold (**text**)"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "italic", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="p-1 px-2 italic font-serif rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Italic (*text*)"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "underline", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="p-1 px-2 underline rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Underline (<u>text</u>)"
                      >
                        U
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "strike", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="p-1 px-2 line-through rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Strikethrough (~~text~~)"
                      >
                        S
                      </button>
                      <div className="h-4 w-px bg-border mx-1" />
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "link", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="inline-flex items-center gap-1 p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Insert Hyperlink"
                      >
                        <HiOutlineLink className="h-3.5 w-3.5" /> Link
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "bullet", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Bullet List (- item)"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "number", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Numbered List (1. item)"
                      >
                        1. List
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`hook-body-${h.id}`, h.body, "quote", (nextVal) => {
                            const next = [...hooks];
                            next[idx].body = nextVal;
                            setHooks(next);
                          })
                        }
                        className="p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Blockquote (> quote)"
                      >
                        ❝ Quote
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        id={`hook-body-${h.id}`}
                        rows={13}
                        value={h.body}
                        onChange={(e) => {
                          const next = [...hooks];
                          next[idx].body = e.target.value;
                          setHooks(next);
                        }}
                        placeholder="Write your email body copy here..."
                        className="saas-input w-full font-sans text-xs leading-relaxed p-4 rounded-xl resize-y min-h-[280px] border-border shadow-xs focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    {/* Attachments Section */}
                    <div className="rounded-xl border border-border bg-[var(--input-bg)]/60 p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <HiOutlinePaperClip className="h-4 w-4 text-brand-600" />
                          <span className="text-xs font-bold text-ink">
                            Attachments ({h.attachments?.length || 0})
                          </span>
                        </div>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-[var(--surface)] text-[11px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition dark:text-brand-300">
                          <HiOutlinePlus className="h-3.5 w-3.5" /> Attach File (PDF, DOCX, Image)
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              void handleFilesUpload(e.target.files, (newAtts) => {
                                const next = [...hooks];
                                next[idx].attachments = [...(next[idx].attachments || []), ...newAtts];
                                setHooks(next);
                              });
                            }}
                          />
                        </label>
                      </div>

                      {h.attachments && h.attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {h.attachments.map((att, attIdx) => (
                            <div
                              key={att.id || attIdx}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-[var(--surface)] p-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-base">📄</span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-ink truncate">{att.name}</div>
                                  <div className="text-[10px] text-ink-muted">{formatBytes(att.size)}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={att.placement || "bottom"}
                                  onChange={(e) => {
                                    const next = [...hooks];
                                    next[idx].attachments![attIdx].placement = e.target.value as any;
                                    setHooks(next);
                                  }}
                                  className="saas-input text-[11px] py-1 px-2 font-medium"
                                >
                                  <option value="bottom">Placement: Bottom of Email</option>
                                  <option value="top">Placement: Top of Email</option>
                                  <option value="custom">Placement: Custom Tag in Body</option>
                                </select>

                                {att.placement === "custom" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const tag = `{{attachment:${att.name}}}`;
                                      insertTextIntoTextarea(
                                        `hook-body-${h.id}`,
                                        h.body,
                                        tag,
                                        (newVal) => {
                                          const next = [...hooks];
                                          next[idx].body = newVal;
                                          setHooks(next);
                                        }
                                      );
                                    }}
                                    className="rounded border border-brand-300 bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700 hover:bg-brand-100"
                                    title="Insert {{attachment:filename}} at cursor position"
                                  >
                                    + Insert Tag at Cursor
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...hooks];
                                    next[idx].attachments = next[idx].attachments!.filter((_, i) => i !== attIdx);
                                    setHooks(next);
                                  }}
                                  className="p-1 text-ink-muted hover:text-rose-600 transition"
                                  title="Remove attachment"
                                >
                                  <HiOutlineTrash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Unsubscribe & Opt-Out Settings */}
                    <div className="rounded-xl border border-border bg-[var(--input-bg)]/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                          <input
                            type="checkbox"
                            checked={h.enableUnsubscribe ?? true}
                            onChange={(e) => {
                              const next = [...hooks];
                              next[idx].enableUnsubscribe = e.target.checked;
                              setHooks(next);
                            }}
                            className="rounded border-border"
                          />
                          Include 1-Click Unsubscribe & Compliance Opt-Out
                        </label>
                        {(h.enableUnsubscribe ?? true) && (
                          <button
                            type="button"
                            onClick={() => {
                              insertTextIntoTextarea(
                                `hook-body-${h.id}`,
                                h.body,
                                "{{unsubscribe}}",
                                (newVal) => {
                                  const next = [...hooks];
                                  next[idx].body = newVal;
                                  setHooks(next);
                                }
                              );
                            }}
                            className="text-[11px] font-semibold text-brand-600 hover:underline"
                            title="Place unsubscribe link at cursor location"
                          >
                            + Insert {"{{unsubscribe}}"} at Cursor
                          </button>
                        )}
                      </div>

                      {(h.enableUnsubscribe ?? true) && (
                        <div>
                          <input
                            type="text"
                            value={
                              h.unsubscribeText ??
                              "If you do not wish to receive further emails from us, click here to unsubscribe or reply STOP."
                            }
                            onChange={(e) => {
                              const next = [...hooks];
                              next[idx].unsubscribeText = e.target.value;
                              setHooks(next);
                            }}
                            placeholder="Custom unsubscribe message..."
                            className="saas-input w-full text-[11px] py-1.5"
                          />
                          <p className="mt-1 text-[10px] text-ink-muted">
                            Automatically appends a clean CAN-SPAM compliant opt-out footer, or places it wherever you put {"{{unsubscribe}}"}.
                          </p>
                        </div>
                      )}
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
                      <div
                        className="text-xs text-ink leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{
                          __html: renderSimulatedHtml(
                            h.body,
                            h.attachments,
                            h.enableUnsubscribe ?? true,
                            h.unsubscribeText
                          ),
                        }}
                      />
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
                              insertTextIntoTextarea(
                                `step-body-${s.id}`,
                                s.body,
                                tag,
                                (newVal) => {
                                  const next = [...sequenceSteps];
                                  next[idx].body = newVal;
                                  setSequenceSteps(next);
                                }
                              );
                            }}
                            className="rounded-lg border border-border bg-[var(--surface)] px-2 py-1 font-mono text-[11px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition dark:text-brand-300 dark:hover:bg-brand-950/40"
                            title={`Insert ${tag} at cursor position`}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rich Text Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 bg-[var(--surface)] border border-border rounded-xl px-2.5 py-1.5 text-xs shadow-xs">
                      <span className="text-[11px] font-bold text-ink-muted mr-1.5">Format:</span>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "bold", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="p-1 px-2 font-bold rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Bold (**text**)"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "italic", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="p-1 px-2 italic font-serif rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Italic (*text*)"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "underline", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="p-1 px-2 underline rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Underline (<u>text</u>)"
                      >
                        U
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "strike", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="p-1 px-2 line-through rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Strikethrough (~~text~~)"
                      >
                        S
                      </button>
                      <div className="h-4 w-px bg-border mx-1" />
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "link", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="inline-flex items-center gap-1 p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Insert Hyperlink"
                      >
                        <HiOutlineLink className="h-3.5 w-3.5" /> Link
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "bullet", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Bullet List (- item)"
                      >
                        • List
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "number", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Numbered List (1. item)"
                      >
                        1. List
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          applyFormattingToTextarea(`step-body-${s.id}`, s.body, "quote", (nextVal) => {
                            const next = [...sequenceSteps];
                            next[idx].body = nextVal;
                            setSequenceSteps(next);
                          })
                        }
                        className="p-1 px-2 rounded hover:bg-[var(--input-bg)] border border-transparent hover:border-border text-ink"
                        title="Blockquote (> quote)"
                      >
                        ❝ Quote
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        id={`step-body-${s.id}`}
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

                    {/* Step Attachments */}
                    <div className="rounded-xl border border-border bg-[var(--input-bg)]/60 p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <HiOutlinePaperClip className="h-4 w-4 text-brand-600" />
                          <span className="text-xs font-bold text-ink">
                            Follow-Up Attachments ({s.attachments?.length || 0})
                          </span>
                        </div>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-[var(--surface)] text-[11px] font-semibold text-brand-700 hover:border-brand-500 hover:bg-brand-50 transition dark:text-brand-300">
                          <HiOutlinePlus className="h-3.5 w-3.5" /> Attach File
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              void handleFilesUpload(e.target.files, (newAtts) => {
                                const next = [...sequenceSteps];
                                next[idx].attachments = [...(next[idx].attachments || []), ...newAtts];
                                setSequenceSteps(next);
                              });
                            }}
                          />
                        </label>
                      </div>

                      {s.attachments && s.attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {s.attachments.map((att, attIdx) => (
                            <div
                              key={att.id || attIdx}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-[var(--surface)] p-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-base">📄</span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-ink truncate">{att.name}</div>
                                  <div className="text-[10px] text-ink-muted">{formatBytes(att.size)}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={att.placement || "bottom"}
                                  onChange={(e) => {
                                    const next = [...sequenceSteps];
                                    next[idx].attachments![attIdx].placement = e.target.value as any;
                                    setSequenceSteps(next);
                                  }}
                                  className="saas-input text-[11px] py-1 px-2 font-medium"
                                >
                                  <option value="bottom">Placement: Bottom of Email</option>
                                  <option value="top">Placement: Top of Email</option>
                                  <option value="custom">Placement: Custom Tag in Body</option>
                                </select>

                                {att.placement === "custom" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const tag = `{{attachment:${att.name}}}`;
                                      insertTextIntoTextarea(
                                        `step-body-${s.id}`,
                                        s.body,
                                        tag,
                                        (newVal) => {
                                          const next = [...sequenceSteps];
                                          next[idx].body = newVal;
                                          setSequenceSteps(next);
                                        }
                                      );
                                    }}
                                    className="rounded border border-brand-300 bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700 hover:bg-brand-100"
                                    title="Insert {{attachment:filename}} at cursor position"
                                  >
                                    + Insert Tag at Cursor
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...sequenceSteps];
                                    next[idx].attachments = next[idx].attachments!.filter((_, i) => i !== attIdx);
                                    setSequenceSteps(next);
                                  }}
                                  className="p-1 text-ink-muted hover:text-rose-600 transition"
                                  title="Remove attachment"
                                >
                                  <HiOutlineTrash className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Step Unsubscribe */}
                    <div className="rounded-xl border border-border bg-[var(--input-bg)]/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                          <input
                            type="checkbox"
                            checked={s.enableUnsubscribe ?? true}
                            onChange={(e) => {
                              const next = [...sequenceSteps];
                              next[idx].enableUnsubscribe = e.target.checked;
                              setSequenceSteps(next);
                            }}
                            className="rounded border-border"
                          />
                          Include 1-Click Unsubscribe & Compliance Opt-Out
                        </label>
                        {(s.enableUnsubscribe ?? true) && (
                          <button
                            type="button"
                            onClick={() => {
                              insertTextIntoTextarea(
                                `step-body-${s.id}`,
                                s.body,
                                "{{unsubscribe}}",
                                (newVal) => {
                                  const next = [...sequenceSteps];
                                  next[idx].body = newVal;
                                  setSequenceSteps(next);
                                }
                              );
                            }}
                            className="text-[11px] font-semibold text-brand-600 hover:underline"
                            title="Place unsubscribe link at cursor location"
                          >
                            + Insert {"{{unsubscribe}}"} at Cursor
                          </button>
                        )}
                      </div>

                      {(s.enableUnsubscribe ?? true) && (
                        <div>
                          <input
                            type="text"
                            value={
                              s.unsubscribeText ??
                              "If you do not wish to receive further emails from us, click here to unsubscribe or reply STOP."
                            }
                            onChange={(e) => {
                              const next = [...sequenceSteps];
                              next[idx].unsubscribeText = e.target.value;
                              setSequenceSteps(next);
                            }}
                            placeholder="Custom unsubscribe message..."
                            className="saas-input w-full text-[11px] py-1.5"
                          />
                        </div>
                      )}
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
                      <div
                        className="text-xs text-ink leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{
                          __html: renderSimulatedHtml(
                            s.body,
                            s.attachments,
                            s.enableUnsubscribe ?? true,
                            s.unsubscribeText
                          ),
                        }}
                      />
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
            <h2 className="text-lg font-bold text-ink">Step 4: Mailbox & Domain Folders & Sending Limits</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Organize mailboxes by domain folders, customize individual send quotas, and enable weekly ramp-up warmup.
            </p>
          </div>

          {/* Daily Limits & Weekly Ramp-Up */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-ink">
                  Default Daily Limit Per Mailbox
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

              <div className="flex flex-wrap gap-1.5">
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

              <div className="rounded-lg bg-[var(--surface)] p-2.5 border border-border text-[11px] text-ink">
                Total daily campaign capacity:{" "}
                <strong className="text-brand-600">
                  {selectedMailboxIds.length} mailboxes × {dailyLimitPerMailbox} ={" "}
                  {selectedMailboxIds.length * dailyLimitPerMailbox} emails/day
                </strong>
              </div>
            </div>

            {/* Custom Delay / Jitter */}
            <div className="rounded-xl border border-border bg-[var(--input-bg)] p-4 space-y-3">
              <div className="flex items-center justify-between">
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

              <p className="text-[11px] text-ink-muted">
                Each email is throttled with randomized human jitter between {minDelayMinutes} to {maxDelayMinutes} minutes to protect mailbox deliverability.
              </p>
            </div>
          </div>

          {/* Weekly Increasing Sending Volume (Ramp-Up / Warmup) Card */}
          <div className="rounded-xl border border-brand-300 bg-brand-50/50 p-4 dark:border-brand-500/30 dark:bg-brand-950/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableWeeklyRampUp}
                  onChange={(e) => setEnableWeeklyRampUp(e.target.checked)}
                  className="rounded border-border accent-brand-600 h-4 w-4"
                />
                <div className="flex items-center gap-1.5">
                  <HiOutlineArrowTrendingUp className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-bold text-ink">
                    Weekly Increasing Sending Volume (Warmup & Scaled Ramp-Up)
                  </span>
                </div>
              </label>
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-100 dark:bg-brand-900/60 dark:text-brand-300 px-2 py-0.5 rounded-full">
                {enableWeeklyRampUp ? "Ramp-Up Enabled" : "Off (Flat Sending)"}
              </span>
            </div>

            <p className="text-[11px] text-ink-muted">
              Protects inbox placement and domain health by starting at a conservative daily volume and automatically scaling up week-over-week until reaching the target ceiling.
            </p>

            {enableWeeklyRampUp && (
              <div className="space-y-3 pt-2 border-t border-brand-200 dark:border-brand-900/60">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Starting Volume (Week 1)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={rampUpStartLimit}
                        onChange={(e) => setRampUpStartLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="saas-input w-full text-xs font-bold"
                      />
                      <span className="text-[11px] text-ink-muted">/day</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Weekly Increase Amount
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={rampUpIncreasePerWeek}
                        onChange={(e) => setRampUpIncreasePerWeek(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="saas-input w-full text-xs font-bold"
                      />
                      <span className="text-[11px] text-ink-muted">/week</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink mb-1">
                      Max Volume Ceiling
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={rampUpStartLimit}
                        max={100}
                        value={rampUpMaxCeiling}
                        onChange={(e) => setRampUpMaxCeiling(Math.max(rampUpStartLimit, parseInt(e.target.value, 10) || 30))}
                        className="saas-input w-full text-xs font-bold"
                      />
                      <span className="text-[11px] text-ink-muted">/day max</span>
                    </div>
                  </div>
                </div>

                {/* 4-Week Ramp Projection */}
                <div className="rounded-lg bg-[var(--surface)] p-3 border border-border">
                  <div className="text-[11px] font-bold text-ink mb-2">📈 Live 4-Week Ramp-Up Projection:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    {[1, 2, 3, 4].map((wk) => {
                      const perMb = Math.min(rampUpMaxCeiling, rampUpStartLimit + (wk - 1) * rampUpIncreasePerWeek);
                      const totalDaily = perMb * selectedMailboxIds.length;
                      return (
                        <div key={wk} className="rounded-lg bg-[var(--input-bg)] p-2 border border-border/70">
                          <div className="text-[10px] font-semibold text-ink-muted uppercase">Week {wk}</div>
                          <div className="text-sm font-bold text-brand-600 mt-0.5">{perMb} <span className="text-[10px] text-ink-muted">/mb/day</span></div>
                          <div className="text-[10px] text-ink-muted mt-0.5">~{totalDaily} total/day</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Folder for Domains & Connected Mailboxes */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-ink">
                  Domain Folders & Mailboxes ({mailboxes.length} Total Mailboxes)
                </h3>
                <p className="text-[11px] text-ink-muted">
                  Grouped into folders by domain. You can expand folders and set custom per-mailbox quotas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="rounded-lg border border-border bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition"
                >
                  {selectAllMailboxes ? "Deselect All Mailboxes" : `Select All ${mailboxes.length} Mailboxes`}
                </button>
              </div>
            </div>

            {/* Collapsible Domain Folders List */}
            {mailboxes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-3 bg-[var(--input-bg)]/30">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <HiOutlineEnvelope className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-ink">No Sending Mailboxes Assigned</h4>
                  <p className="mt-1 text-xs text-ink-muted max-w-md mx-auto">
                    You currently do not have any system sending mailboxes assigned to your account. Please ask an administrator to assign mailboxes to your user account, or connect your custom SMTP mailbox under Settings.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-ink hover:border-brand-500 hover:text-brand-600 transition"
                  >
                    Go to Settings & SMTP
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(mailboxesByDomain).map(([domain, mList]) => {
                  const isCollapsed = Boolean(collapsedDomains[domain]);
                  const domainIds = mList.map((m) => m.id);
                  const selectedInDomain = domainIds.filter((id) => selectedMailboxIds.includes(id));
                  const allDomainSelected = selectedInDomain.length === domainIds.length;
                  const domainDailyCapacity = selectedInDomain.reduce((sum, id) => {
                    return sum + (customMailboxLimits[id] ?? dailyLimitPerMailbox);
                  }, 0);

                return (
                  <div key={domain} className="rounded-xl border border-border bg-[var(--surface)] shadow-xs overflow-hidden">
                    {/* Folder Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[var(--input-bg)]/60 border-b border-border">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedDomains((prev) => ({ ...prev, [domain]: !prev[domain] }))
                          }
                          className="flex items-center gap-1.5 font-bold text-xs text-ink hover:text-brand-600 transition"
                        >
                          {isCollapsed ? (
                            <HiOutlineFolder className="h-4 w-4 text-amber-500" />
                          ) : (
                            <HiOutlineFolderOpen className="h-4 w-4 text-amber-500" />
                          )}
                          <span>📁 {domain}</span>
                          {isCollapsed ? (
                            <HiOutlineChevronRight className="h-3.5 w-3.5 text-ink-muted" />
                          ) : (
                            <HiOutlineChevronDown className="h-3.5 w-3.5 text-ink-muted" />
                          )}
                        </button>

                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                          {selectedInDomain.length}/{domainIds.length} Active
                        </span>

                        <span className="text-[11px] text-ink-muted hidden sm:inline">
                          · {domainDailyCapacity} emails/day
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (allDomainSelected) {
                              setSelectedMailboxIds(selectedMailboxIds.filter((id) => !domainIds.includes(id)));
                              setSelectAllMailboxes(false);
                            } else {
                              const merged = Array.from(new Set([...selectedMailboxIds, ...domainIds]));
                              setSelectedMailboxIds(merged);
                            }
                          }}
                          className="text-[11px] font-semibold text-brand-600 hover:underline"
                        >
                          {allDomainSelected ? "Deselect Folder" : `Select All in ${domain}`}
                        </button>
                      </div>
                    </div>

                    {/* Folder Contents (Individual Mailboxes) */}
                    {!isCollapsed && (
                      <div className="p-3 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                        {mList.map((mb) => {
                          const isSelected = selectedMailboxIds.includes(mb.id);
                          const customLimit = customMailboxLimits[mb.id];

                          return (
                            <div
                              key={mb.id}
                              className={cn(
                                "flex flex-col justify-between rounded-xl border p-3 text-xs transition",
                                isSelected
                                  ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/30"
                                  : "border-border/70 bg-[var(--input-bg)] opacity-70"
                              )}
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMailbox(mb.id)}
                                  className="mt-0.5 rounded border-border"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-ink truncate">{mb.label}</div>
                                  <div className="text-[11px] text-ink-muted truncate">{mb.email}</div>
                                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-ink-muted">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    <span>Sent today: {mb.sendsToday}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Custom Per-Mailbox Limit */}
                              {isSelected && (
                                <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                                  <span className="text-ink-muted">Custom Cap:</span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={1}
                                      max={100}
                                      placeholder={String(dailyLimitPerMailbox)}
                                      value={customLimit ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                        setCustomMailboxLimits((prev) => {
                                          const next = { ...prev };
                                          if (val) next[mb.id] = val;
                                          else delete next[mb.id];
                                          return next;
                                        });
                                      }}
                                      className="saas-input w-14 py-0.5 px-1.5 text-center text-[11px] font-bold"
                                    />
                                    <span className="text-ink-muted">/day</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-semibold text-ink">Granular Sending Time Window</label>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("09:00"); setSendingWindowEnd("17:00"); }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  9 AM – 5 PM (Standard)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("08:00"); setSendingWindowEnd("12:00"); }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  8 AM – 12 PM (Morning Peak)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("13:00"); setSendingWindowEnd("17:00"); }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  1 PM – 5 PM (Afternoon)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("08:00"); setSendingWindowEnd("18:00"); }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  8 AM – 6 PM (Extended)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("17:00"); setSendingWindowEnd("20:00"); }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  5 PM – 8 PM (Evening)
                </button>
                <span className="text-ink-muted">·</span>
                <button
                  type="button"
                  onClick={() => { setSendingWindowStart("00:00"); setSendingWindowEnd("23:59"); }}
                  className="font-semibold text-brand-600 hover:underline"
                >
                  24/7 (Anytime)
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <span className="text-[11px] text-ink-muted block mb-1">Window Start Time</span>
                <input
                  type="time"
                  value={sendingWindowStart}
                  onChange={(e) => setSendingWindowStart(e.target.value)}
                  className="saas-input w-full font-bold"
                />
              </div>
              <div>
                <span className="text-[11px] text-ink-muted block mb-1">Window End Time</span>
                <input
                  type="time"
                  value={sendingWindowEnd}
                  onChange={(e) => setSendingWindowEnd(e.target.value)}
                  className="saas-input w-full font-bold"
                />
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-[var(--input-bg)] p-3 border border-border text-xs text-ink flex items-center gap-2">
              <HiOutlineClock className="h-4 w-4 text-brand-600 shrink-0" />
              <span>
                Emails will be dispatched between <strong>{sendingWindowStart}</strong> and <strong>{sendingWindowEnd}</strong> across <strong>{sendingDays.length} selected days</strong> ({useRecipientTimezone ? "in the recipient's local time zone" : timezone}).
              </span>
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
          <div className="rounded-xl border border-border bg-[var(--input-bg)] p-4 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-ink mb-1">Send a Test Email</h4>
              <p className="text-[11px] text-ink-muted">
                Preview how Hook A looks in your inbox with simulated prospect data.
              </p>
            </div>

            {selectedMailboxIds.length > 1 && (
              <div className="max-w-md">
                <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                  Send From Mailbox:
                </label>
                <select
                  value={testMailboxId || selectedMailboxIds[0] || ""}
                  onChange={(e) => setTestMailboxId(e.target.value)}
                  className="saas-input w-full text-xs"
                >
                  {mailboxes
                    .filter((m) => selectedMailboxIds.includes(m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.email} ({m.domain})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-2 max-w-md">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="saas-input flex-1 font-medium text-xs"
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
              <p className="mt-1 text-xs font-semibold text-emerald-600">{testSuccess}</p>
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
