"use client";

import { useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineXCircle,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";

export type EmailStatusCategory = "safe" | "catchall" | "role" | "invalid" | "unknown";

export interface EmailStatusBadgeProps {
  leadId?: string;
  email?: string | null;
  emailStatus?: string | null;
  emailBounceRisk?: string | null;
  isRoleAccount?: boolean | null;
  emailVerifySource?: string | null;
  emailScore?: number | null;
  emailSubStatus?: string | null;
  emailVerifiedAt?: string | Date | null;
  showVerifyButton?: boolean;
  showScore?: boolean;
  compact?: boolean;
  onVerified?: (updated: {
    leadId: string;
    emailStatus: EmailStatusCategory;
    emailBounceRisk: string | null;
    isRoleAccount: boolean;
    emailVerifySource: string | null;
    emailScore: number | null;
    emailSubStatus: string | null;
    emailVerifiedAt: string | null;
  }) => void;
}

const CATEGORY_META: Record<
  EmailStatusCategory,
  {
    label: string;
    dot: string;
    pillClass: string;
    deliverable: string;
    bounceRisk: string;
    spamRisk: string;
    action: string;
    priority: string;
    sendingStrategy: string;
    description: string;
  }
> = {
  safe: {
    label: "Safe",
    dot: "bg-emerald-500",
    pillClass:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300",
    deliverable: "YES",
    bounceRisk: "< 1% (Almost zero)",
    spamRisk: "Low",
    action: "Send directly — Primary list",
    priority: "1st Priority",
    sendingStrategy: "Main domain · Full volume · 5–8 steps (25–45% open rate)",
    description:
      "100% valid mailbox confirmed via SMTP handshake. Safe for primary cold email outreach.",
  },
  catchall: {
    label: "Catchall",
    dot: "bg-amber-500",
    pillClass:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300",
    deliverable: "MAYBE",
    bounceRisk: "40–60% (Medium–High)",
    spamRisk: "Medium",
    action: "Risky segment — Warm/secondary domain",
    priority: "2nd Priority",
    sendingStrategy:
      "Secondary/warmed domain · Max 20% daily sends · 2–3 steps (10–25% open rate)",
    description:
      "Accept-All server accepts every address on this domain. Keep in a separate Risky pool.",
  },
  role: {
    label: "Role Acct",
    dot: "bg-orange-500",
    pillClass:
      "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-500/40 dark:bg-orange-950/40 dark:text-orange-300",
    deliverable: "YES (Shared Inbox)",
    bounceRisk: "< 5% (Low)",
    spamRisk: "HIGH (Multiple readers)",
    action: "Avoid / Filter (only sales@ carefully)",
    priority: "3rd Priority",
    sendingStrategy:
      "Separate sending account · Only sales@ (5% max) · 1–2 steps (5–15% open rate)",
    description:
      "Department or shared inbox (info@, admin@, support@, sales@). High spam complaint risk if personalized.",
  },
  invalid: {
    label: "Invalid",
    dot: "bg-rose-500",
    pillClass:
      "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-300",
    deliverable: "NO",
    bounceRisk: "100% (Hard Bounce)",
    spamRisk: "N/A",
    action: "DELETE ALWAYS — Never Send",
    priority: "Never Send",
    sendingStrategy: "Remove permanently from all lists and campaigns",
    description:
      "Dead mailbox (550 error), missing MX record, or automated no-reply address. Guaranteed hard bounce.",
  },
  unknown: {
    label: "Unverified",
    dot: "bg-slate-400",
    pillClass:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300",
    deliverable: "Unchecked",
    bounceRisk: "Unknown",
    spamRisk: "Unknown",
    action: "Click Verify before sending",
    priority: "Verify First",
    sendingStrategy: "Run 7-step SMTP + Catchall + Role verification before outreach",
    description:
      "This email has not been verified yet. Click Verify to check syntax, MX, SMTP mailbox, catchall, and role status.",
  },
};

export function normalizeEmailCategory(
  rawStatus?: string | null,
  isRoleAccount?: boolean | null,
): EmailStatusCategory {
  const s = (rawStatus || "").toLowerCase().trim();
  if (s === "safe" || s === "valid") return isRoleAccount ? "role" : "safe";
  if (s === "catchall" || s === "catch-all" || s === "accept_all" || s === "risky") {
    return isRoleAccount ? "role" : "catchall";
  }
  if (s === "role" || s === "do_not_mail") return "role";
  if (s === "invalid" || s === "undeliverable" || s === "spamtrap") return "invalid";
  return "unknown";
}

export function EmailStatusBadge({
  leadId,
  email,
  emailStatus,
  emailBounceRisk,
  isRoleAccount,
  emailVerifySource,
  emailScore,
  emailSubStatus,
  emailVerifiedAt,
  showVerifyButton = true,
  showScore = true,
  compact = false,
  onVerified,
}: EmailStatusBadgeProps) {
  const [localStatus, setLocalStatus] = useState<EmailStatusCategory>(() =>
    normalizeEmailCategory(emailStatus, isRoleAccount),
  );
  const [localBounceRisk, setLocalBounceRisk] = useState<string | null>(
    emailBounceRisk ?? null,
  );
  const [localRole, setLocalRole] = useState<boolean>(Boolean(isRoleAccount));
  const [localSource, setLocalSource] = useState<string | null>(
    emailVerifySource ?? null,
  );
  const [localScore, setLocalScore] = useState<number | null>(
    typeof emailScore === "number" ? emailScore : null,
  );
  const [localSubStatus, setLocalSubStatus] = useState<string | null>(
    emailSubStatus ?? null,
  );
  const [localVerifiedAt, setLocalVerifiedAt] = useState<string | Date | null>(
    emailVerifiedAt ?? null,
  );
  const [verifying, setVerifying] = useState(false);

  // Sync if props change from parent bulk verify
  const effectiveCategory =
    emailStatus && normalizeEmailCategory(emailStatus, isRoleAccount) !== "unknown" && localStatus === "unknown"
      ? normalizeEmailCategory(emailStatus, isRoleAccount)
      : localStatus;

  if (!email || !email.includes("@")) {
    return null;
  }

  const meta = CATEGORY_META[effectiveCategory] ?? CATEGORY_META.unknown;

  // Compute score percentage (0 - 100)
  const scorePct =
    localScore != null
      ? localScore <= 1
        ? Math.round(localScore * 100)
        : Math.round(localScore)
      : effectiveCategory === "safe"
        ? 98
        : effectiveCategory === "role"
          ? 74
          : effectiveCategory === "catchall"
            ? 55
            : effectiveCategory === "invalid"
              ? 0
              : null;

  // Check if verification is > 30 days old (Section 08: Last Verified Date — 30+ days pe re-verify suggest)
  const verifiedDateObj = localVerifiedAt ? new Date(localVerifiedAt) : null;
  const ageDays =
    verifiedDateObj && !Number.isNaN(verifiedDateObj.getTime())
      ? Math.floor((Date.now() - verifiedDateObj.getTime()) / (1000 * 60 * 60 * 24))
      : null;
  const isStale = ageDays != null && ageDays >= 30;

  async function handleVerifyClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!leadId || verifying) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (res.ok && data.verification) {
        const v = data.verification;
        const nextCat = normalizeEmailCategory(v.emailStatus, v.isRoleAccount);
        setLocalStatus(nextCat);
        setLocalBounceRisk(v.emailBounceRisk ?? null);
        setLocalRole(Boolean(v.isRoleAccount));
        setLocalSource(v.emailVerifySource ?? null);
        setLocalScore(typeof v.emailScore === "number" ? v.emailScore : null);
        setLocalSubStatus(v.emailSubStatus ?? null);
        setLocalVerifiedAt(v.emailVerifiedAt ?? new Date().toISOString());
        onVerified?.({
          leadId,
          emailStatus: nextCat,
          emailBounceRisk: v.emailBounceRisk ?? null,
          isRoleAccount: Boolean(v.isRoleAccount),
          emailVerifySource: v.emailVerifySource ?? null,
          emailScore: typeof v.emailScore === "number" ? v.emailScore : null,
          emailSubStatus: v.emailSubStatus ?? null,
          emailVerifiedAt: v.emailVerifiedAt ?? new Date().toISOString(),
        });
      }
    } catch {
      // ignore
    } finally {
      setVerifying(false);
    }
  }

  return (
    <span
      className="group/ebadge relative inline-flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Color-Coded Status Pill */}
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border font-semibold transition cursor-help",
          compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
          meta.pillClass,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
        <span>{meta.label}</span>
        {showScore && scorePct != null && effectiveCategory !== "unknown" && (
          <span className="opacity-75 font-mono text-[10px]">
            {scorePct}%
          </span>
        )}
        {isStale && (
          <span
            className="ml-0.5 rounded bg-amber-500/20 px-1 text-[9px] font-bold text-amber-900 dark:text-amber-200"
            title="Verified 30+ days ago — re-verify recommended"
          >
            30d+
          </span>
        )}
      </span>

      {/* Per-Row Verify / Re-Verify Button */}
      {showVerifyButton && leadId && (
        <button
          type="button"
          onClick={handleVerifyClick}
          disabled={verifying}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold transition disabled:opacity-50",
            effectiveCategory === "unknown" || isStale
              ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-950/50 dark:text-brand-300"
              : "border-border bg-[var(--surface)] text-ink-muted hover:border-brand-200 hover:text-brand-700",
          )}
          title={
            effectiveCategory === "unknown"
              ? "Verify this email address (7-step SMTP, Catchall & Role check)"
              : isStale
                ? "Verification is 30+ days old — click to re-verify"
                : "Re-verify this email address"
          }
        >
          <HiOutlineArrowPath
            className={cn("h-3 w-3", verifying && "animate-spin text-brand-600")}
          />
          {verifying
            ? "Checking…"
            : effectiveCategory === "unknown"
              ? "Verify"
              : isStale
                ? "Re-verify"
                : "Re-check"}
        </button>
      )}

      {/* Rich Hover Tooltip (Section 08 & 09) */}
      <div className="pointer-events-none invisible absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-border bg-[var(--panel-solid)] p-3 text-left text-[11px] text-ink shadow-xl opacity-0 transition-all duration-150 group-hover/ebadge:visible group-hover/ebadge:opacity-100">
        <div className="flex items-center justify-between border-b border-border pb-1.5">
          <span className="font-bold text-ink flex items-center gap-1.5">
            {effectiveCategory === "safe" && (
              <HiOutlineCheckCircle className="h-4 w-4 text-emerald-600" />
            )}
            {effectiveCategory === "catchall" && (
              <HiOutlineExclamationTriangle className="h-4 w-4 text-amber-500" />
            )}
            {effectiveCategory === "role" && (
              <HiOutlineUserGroup className="h-4 w-4 text-orange-500" />
            )}
            {effectiveCategory === "invalid" && (
              <HiOutlineXCircle className="h-4 w-4 text-rose-600" />
            )}
            {effectiveCategory === "unknown" && (
              <HiOutlineQuestionMarkCircle className="h-4 w-4 text-slate-500" />
            )}
            {meta.label} ({meta.priority})
          </span>
          {scorePct != null && (
            <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-brand-700">
              Score: {scorePct}/100
            </span>
          )}
        </div>

        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
          {meta.description}
        </p>

        <div className="mt-2 space-y-1 rounded-lg bg-[var(--input-bg)] p-2 text-[10.5px]">
          <div className="flex justify-between">
            <span className="text-ink-muted">Deliverable:</span>
            <span className="font-semibold text-ink">{meta.deliverable}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Bounce Risk:</span>
            <span className="font-semibold text-ink">
              {localBounceRisk ? `${localBounceRisk.toUpperCase()} · ` : ""}
              {meta.bounceRisk}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Spam Risk:</span>
            <span className="font-semibold text-ink">{meta.spamRisk}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Action:</span>
            <span className="font-semibold text-brand-700">{meta.action}</span>
          </div>
        </div>

        <div className="mt-1.5 text-[10px] text-ink-muted">
          <span className="font-semibold text-ink">Cold Email Rule: </span>
          {meta.sendingStrategy}
        </div>

        {(localSource || localSubStatus || verifiedDateObj) && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-border pt-1.5 text-[9.5px] text-ink-muted">
            <span>
              {localSource ? `Via ${localSource}` : "Verifier"}
              {localSubStatus ? ` (${localSubStatus})` : ""}
            </span>
            {verifiedDateObj && !Number.isNaN(verifiedDateObj.getTime()) && (
              <span className={cn(isStale && "font-bold text-amber-600")}>
                Verified{" "}
                {ageDays === 0
                  ? "today"
                  : `${ageDays}d ago`}
                {isStale ? " · Re-verify!" : ""}
              </span>
            )}
          </div>
        )}
      </div>
    </span>
  );
}

