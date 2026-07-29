"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBookmark,
  HiOutlineCheckBadge,
  HiOutlineCursorArrowRays,
  HiOutlineEnvelope,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineGlobeAlt,
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineMegaphone,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineUserGroup,
  HiStar,
} from "react-icons/hi2";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/lib/constants";
import { OutreachStudio } from "@/components/leads/outreach-studio";
import { LeadIntelligenceReportCard } from "@/components/leads/lead-intelligence-report";
import { LeadActivityPanel } from "@/components/leads/lead-activity-panel";
import { EnrollEmailSequenceButton } from "@/components/leads/enroll-email-sequence-button";
import { LeadSendEmailCard } from "@/components/leads/lead-send-email-card";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { BackLink, PageCrumbs } from "@/components/layout/back-nav";
import { adminScrapeLeadIds } from "@/lib/client/search-session";
import {
  LEAD_FROM_CRUMB,
  LEAD_FROM_HREF,
  LEAD_FROM_LABEL,
  type AppLeadFrom,
  type LeadFrom,
} from "@/lib/nav-context";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  ownerTitle: string | null;
  ownerSourceUrl: string | null;
  ownerConfidence: number | null;
  teamMembersJson: string | null;
  peopleEnrichedAt: string | null;
  phone: string | null;
  email: string | null;
  emailSourceUrl: string | null;
  website: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  address: string | null;
  googleMapsLink: string | null;
  yearsInBusiness: number | null;
  leadScore: number;
  serviceCategory: string | null;
  revenueRangeEstimate: string | null;
  websiteQualityScore: number | null;
  marketingOpportunityScore: number | null;
  ppcOpportunityScore: number | null;
  seoOpportunityScore: number | null;
  outreachAngle: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  yelpUrl: string | null;
  yelpRating: number | null;
  yelpReviews: number | null;
  nextdoor: string | null;
  houzzUrl: string | null;
  houzzRating: number | null;
  houzzReviews: number | null;
  linkedinUrl: string | null;
  linkedinCompanyUrl: string | null;
  linkedinOwnerUrl: string | null;
  linkedinType: string;
  linkedinConfidenceScore: number | null;
  linkedinOwnerConfidenceScore: number | null;
  youtube: string | null;
  facebookAdsData: string | null;
  facebookAdsCheckedAt: string | null;
  socialEnrichedAt: string | null;
  qualityTier: string | null;
  industry: string | null;
  state: string | null;
  city: string | null;
  unlocked?: boolean;
  search?: {
    user?: {
      email: string;
      companyName: string | null;
    } | null;
  } | null;
  savedBy?: Array<{
    id: string;
    status: string;
    favorite: boolean;
    notes: Array<{ id: string; content: string; createdAt: string }>;
    user?: { email: string; companyName: string | null };
  }>;
};

type LeadNavigation = {
  from: LeadFrom;
  prevId: string | null;
  nextId: string | null;
  position: number | null;
  total: number;
};

const BACK_HREF: Record<LeadFrom, string> = {
  ...LEAD_FROM_HREF,
  scrape: "/admin/scrape",
};

const BACK_LABEL: Record<LeadFrom, string> = {
  ...LEAD_FROM_LABEL,
  scrape: "Back to scrape results",
};

type TeamMember = {
  name: string;
  role: string;
  sourceUrl: string;
  confidence: number;
};

function parseTeamMembers(raw: string | null): TeamMember[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scoreTone(value: number) {
  if (value >= 70) {
    return {
      text: "text-emerald-700",
      bar: "bg-emerald-500",
      ring: "ring-emerald-500/20",
      bg: "bg-emerald-50/80",
    };
  }
  if (value >= 45) {
    return {
      text: "text-amber-700",
      bar: "bg-amber-500",
      ring: "ring-amber-500/20",
      bg: "bg-amber-50/70",
    };
  }
  return {
    text: "text-rose-700",
    bar: "bg-rose-500",
    ring: "ring-rose-500/20",
    bg: "bg-rose-50/70",
  };
}

function QualificationScoreCard({
  href,
  label,
  value,
  icon: Icon,
}: {
  href: string;
  label: string;
  value: number | null | undefined;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const v = value ?? 0;
  const tone = scoreTone(v);
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${tone.bg} ${tone.ring} ${tone.text}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span
          className={`font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums leading-none ${tone.text}`}
        >
          {v}
        </span>
      </div>
      <p className="mt-3 text-[13px] font-semibold text-ink">{label}</p>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${tone.bar}`}
          style={{ width: `${Math.min(100, Math.max(v, 0))}%` }}
        />
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 transition group-hover:gap-1.5">
        View detailed report
        <HiOutlineArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}

function SocialButton({
  href,
  label,
  icon,
  verified,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  verified?: boolean;
}) {
  // Avoid noreferrer on LinkedIn — it often breaks the first tab load
  const isLinkedIn = /linkedin\.com/i.test(href);
  return (
    <a
      href={href}
      target="_blank"
      rel={isLinkedIn ? "noopener" : "noopener noreferrer"}
      className={`inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-semibold shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:bg-brand-50 ${
        verified
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-border bg-[var(--surface)] text-ink"
      }`}
    >
      {icon}
      {label}
      <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 opacity-50" />
    </a>
  );
}

type PopupState = {
  kind: "success" | "error" | "info";
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
};

function ResultPopup({
  popup,
  onClose,
}: {
  popup: PopupState;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lock scroll for popup lifetime only
  }, []);

  const iconStyles =
    popup.kind === "success"
      ? "bg-emerald-50 text-emerald-600"
      : popup.kind === "error"
        ? "bg-red-50 text-red-600"
        : "bg-brand-50 text-brand-600";

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-elevated)]">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconStyles}`}
        >
          {popup.kind === "success" ? (
            <HiOutlineCheckBadge className="h-6 w-6" />
          ) : popup.kind === "error" ? (
            <HiOutlineExclamationTriangle className="h-6 w-6" />
          ) : (
            <HiOutlineInformationCircle className="h-6 w-6" />
          )}
        </span>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-ink">
          {popup.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          {popup.message}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {popup.actionUrl && (
            <a
              href={popup.actionUrl}
              target="_blank"
              rel="noopener"
              className="btn-on-brand inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold text-[var(--btn-on-brand)] shadow-sm transition hover:opacity-95"
              style={{ background: LOGO_GRADIENT }}
              onClick={onClose}
            >
              {popup.actionLabel ?? "Open"}
              <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-[var(--surface)] px-4 text-[13px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PlatformTag({ href, label }: { href?: string | null; label: string }) {
  if (!href) {
    return (
      <span className="rounded-lg border border-dashed border-border px-2.5 py-1 text-[12px] text-ink-muted">
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-border bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-brand-700 transition hover:bg-brand-50"
    >
      {label}
    </a>
  );
}

export function LeadDetailView({
  leadId,
  from = "all",
  variant = "app",
  backHref,
  backLabel,
}: {
  leadId: string;
  from?: LeadFrom;
  /** Admin console uses the same profile UI with admin APIs. */
  variant?: "app" | "admin";
  backHref?: string;
  backLabel?: string;
}) {
  const isAdmin = variant === "admin";
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [navigation, setNavigation] = useState<LeadNavigation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchingSocial, setFetchingSocial] = useState(false);
  const [findingLinkedin, setFindingLinkedin] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationScore, setVerificationScore] = useState<number | null>(
    null,
  );
  const [verificationMessage, setVerificationMessage] = useState<string | null>(
    null,
  );
  const [activityRefresh, setActivityRefresh] = useState(0);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const [crmBusy, setCrmBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [adminEnriching, setAdminEnriching] = useState(false);
  const [adminDeleting, setAdminDeleting] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [qualificationRefreshing, setQualificationRefreshing] = useState(false);

  function mergeLead(updated: Lead) {
    setLead((prev) => ({
      ...updated,
      savedBy: updated.savedBy ?? prev?.savedBy ?? [],
      unlocked: true,
    }));
  }

  async function refreshQualification() {
    setQualificationRefreshing(true);
    setAdminMessage(null);
    try {
      const res = await fetch(
        `/api/leads/${leadId}/qualification-breakdown`,
        { method: "POST" },
      );
      const data = (await res.json()) as {
        error?: string;
        lead?: {
          websiteQualityScore: number | null;
          seoOpportunityScore: number | null;
          marketingOpportunityScore: number | null;
          ppcOpportunityScore: number | null;
          outreachAngle: string | null;
        };
        measuredScores?: {
          websiteQualityScore: number;
          seoOpportunityScore: number;
          marketingOpportunityScore: number;
          ppcOpportunityScore: number;
          outreachAngle: string;
        } | null;
        source?: string;
      };
      if (!res.ok) {
        setAdminMessage(data.error || "Could not refresh site audit");
        return;
      }
      if (lead) {
        const scores = data.lead || data.measuredScores;
        if (scores) {
          setLead({
            ...lead,
            websiteQualityScore: scores.websiteQualityScore,
            seoOpportunityScore: scores.seoOpportunityScore,
            marketingOpportunityScore: scores.marketingOpportunityScore,
            ppcOpportunityScore: scores.ppcOpportunityScore,
            outreachAngle: scores.outreachAngle,
          });
        }
      }
      setAdminMessage(
        data.source === "live_audit"
          ? "Site audit refreshed from a live homepage crawl."
          : "Site audit refreshed.",
      );
    } catch {
      setAdminMessage("Could not refresh site audit");
    } finally {
      setQualificationRefreshing(false);
    }
  }

  function navFromScrapeCache(): LeadNavigation | null {
    const ids = adminScrapeLeadIds();
    if (!ids.length) return null;
    const idx = ids.indexOf(leadId);
    if (idx < 0) return null;
    return {
      from: "scrape",
      prevId: idx > 0 ? ids[idx - 1] : null,
      nextId: idx < ids.length - 1 ? ids[idx + 1] : null,
      position: idx + 1,
      total: ids.length,
    };
  }

  async function load() {
    setLoadError(null);
    if (isAdmin) {
      const res = await fetch(`/api/admin/leads/${leadId}`);
      const data = await res.json();
      if (!res.ok || !data.lead) {
        setLead(null);
        setNavigation(null);
        setLoadError(data.error ?? "Lead not found");
        return;
      }
      setLead({
        ...data.lead,
        unlocked: true,
        savedBy: Array.isArray(data.lead.savedBy)
          ? data.lead.savedBy.map(
              (s: {
                id?: string;
                status?: string;
                favorite?: boolean;
                notes?: Array<{ id: string; content: string; createdAt: string }>;
                user?: { email: string; companyName: string | null };
              }) => ({
                id: s.id ?? "",
                status: s.status ?? "new",
                favorite: Boolean(s.favorite),
                notes: s.notes ?? [],
                user: s.user,
              }),
            )
          : [],
      });
      setNavigation(
        from === "scrape"
          ? navFromScrapeCache()
          : {
              from: "all",
              prevId: null,
              nextId: null,
              position: null,
              total: 0,
            },
      );
      return;
    }

    const res = await fetch(`/api/leads/${leadId}?from=${from}`);
    const data = await res.json();
    if (!res.ok || !data.lead) {
      setLead(null);
      setNavigation(null);
      setLoadError(data.error ?? "Lead not found");
      return;
    }
    setLead(data.lead);
    setNavigation(data.navigation ?? null);
  }

  useEffect(() => {
    setLead(null);
    setVerificationScore(null);
    setVerificationMessage(null);
    setPopup(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when lead or list scope changes
  }, [leadId, from, isAdmin]);

  useEffect(() => {
    if (lead && verificationScore === null) {
      fetch(`/api/leads/${leadId}/verify`, { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          setVerificationScore(d.verificationScore ?? null);
          setVerificationMessage(d.message ?? null);
        })
        .catch(() => {
          setVerificationScore(null);
          setVerificationMessage(null);
        });
    }
  }, [lead, leadId, verificationScore]);

  async function saveLead() {
    if (isAdmin) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/save`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Could not add to pipeline");
        return;
      }
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateSaved(field: string, value: string | boolean) {
    setCrmBusy(true);
    try {
      const savedId = lead?.savedBy?.[0]?.id;
      if (!savedId) {
        await saveLead();
        await load();
        const refreshed = await fetch(`/api/leads/${leadId}?from=${from}`).then(
          (r) => r.json(),
        );
        const id = refreshed.lead?.savedBy?.[0]?.id;
        if (!id) return;
        await fetch(`/api/leads/saved/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
        await load();
        return;
      }
      await fetch(`/api/leads/saved/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      await load();
    } finally {
      setCrmBusy(false);
    }
  }

  async function addNote() {
    const savedId = lead?.savedBy?.[0]?.id;
    if (!savedId || !note.trim()) return;
    setNoteBusy(true);
    try {
      await fetch(`/api/leads/saved/${savedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note }),
      });
      setNote("");
      await load();
    } finally {
      setNoteBusy(false);
    }
  }

  async function fetchSocial() {
    setFetchingSocial(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/enrich-social`, {
        method: "POST",
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enrichment failed");
      // Enrich APIs omit savedBy — merge so the page doesn't crash.
      mergeLead(data.lead);
      setVerificationScore(data.verificationScore ?? null);
      setVerificationMessage(data.message ?? null);
      const found = Object.entries(data.found ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k.replace(/([A-Z])/g, " $1").toLowerCase());
      if (found.length) {
        setPopup({
          kind: "success",
          title: "Public data updated",
          message: `New details found: ${found.join(", ")}.`,
        });
      } else {
        setPopup({
          kind: "info",
          title: "No results found",
          message:
            "We rechecked the website and public directories but found no owner or social details for this business.",
        });
      }
    } catch (e) {
      setPopup({
        kind: "error",
        title: "Enrichment failed",
        message:
          e instanceof Error && e.name === "TimeoutError"
            ? "The scan took too long. Please try again in a moment."
            : e instanceof Error
              ? e.message
              : "Something went wrong. Please try again.",
      });
    } finally {
      setFetchingSocial(false);
    }
  }

  async function findLinkedIn() {
    setFindingLinkedin(true);
    const manualSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(
      lead?.businessName ?? "",
    )}`;
    try {
      const res = await fetch(`/api/leads/${leadId}/linkedin`, {
        method: "POST",
        signal: AbortSignal.timeout(45000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "LinkedIn lookup failed");
      mergeLead(data.lead);

      const foundUrl =
        data.linkedin?.verified && data.linkedin?.url
          ? String(data.linkedin.url)
          : null;

      if (foundUrl) {
        setPopup({
          kind: "success",
          title: "LinkedIn profile found",
          message: `Verified company page found (${data.linkedin.sourceLabel ?? "verified"}).`,
          actionUrl: foundUrl,
          actionLabel: "Open LinkedIn",
        });
      } else {
        setPopup({
          kind: "info",
          title: "No results found",
          message:
            "We couldn't confirm a LinkedIn company page automatically. You can search LinkedIn manually instead.",
          actionUrl: data.linkedin?.searchUrl ?? manualSearchUrl,
          actionLabel: "Search on LinkedIn",
        });
      }
    } catch (e) {
      setPopup({
        kind: "error",
        title: "LinkedIn lookup failed",
        message:
          e instanceof Error && e.name === "TimeoutError"
            ? "The lookup timed out. Try again — or search LinkedIn manually."
            : e instanceof Error
              ? e.message
              : "Something went wrong. Please try again.",
        actionUrl: manualSearchUrl,
        actionLabel: "Search on LinkedIn",
      });
    } finally {
      setFindingLinkedin(false);
    }
  }

  async function reVerify() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      setVerificationScore(data.verificationScore ?? null);
      setVerificationMessage(data.message ?? null);
    } finally {
      setVerifying(false);
    }
  }

  if (loadError) {
    const errBackHref =
      backHref ||
      (isAdmin
        ? from === "scrape"
          ? "/admin/scrape"
          : "/admin/leads"
        : BACK_HREF[from === "scrape" ? "all" : from]);
    const errBackLabel =
      backLabel ||
      (isAdmin
        ? from === "scrape"
          ? "Back to scrape results"
          : "Back to all leads"
        : BACK_LABEL[from === "scrape" ? "all" : from]);
    return (
      <div className={isAdmin ? "" : "page-pad"}>
        <Link
          href={errBackHref}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-brand-700"
        >
          <HiOutlineArrowLeft className="h-4 w-4" />
          {errBackLabel}
        </Link>
        <div className="saas-card p-8 text-sm text-ink-muted">
          {loadError}
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className={isAdmin ? "" : "page-pad"}>
        <div className="saas-card animate-pulse p-8 text-sm text-ink-muted">
          Loading lead profile…
        </div>
      </div>
    );
  }

  const saved = lead.savedBy?.[0];
  const linkedinCompany =
    lead.linkedinCompanyUrl && (lead.linkedinConfidenceScore ?? 0) >= 85;
  const linkedinOwner =
    lead.linkedinOwnerUrl && (lead.linkedinOwnerConfidenceScore ?? 0) >= 85;
  const teamMembers = parseTeamMembers(lead.teamMembersJson);
  const additionalTeamMembers = teamMembers.filter(
    (member) =>
      member.name.trim().toLowerCase() !== lead.ownerName?.trim().toLowerCase(),
  );
  const publicPeopleCount =
    additionalTeamMembers.length + (lead.ownerName ? 1 : 0);
  const tier =
    lead.qualityTier === "hot"
      ? "hot"
      : lead.qualityTier === "warm"
        ? "warm"
        : "nurture";
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.businessName)}`;
  const navFrom = navigation?.from ?? from;
  const appFrom: AppLeadFrom = navFrom === "scrape" ? "all" : navFrom;
  const detailHref = (id: string) =>
    isAdmin
      ? `/admin/leads/${id}?from=${navFrom === "scrape" ? "scrape" : "all"}`
      : `/leads/${id}?from=${appFrom}`;
  const qualHref = (scoreKey: string) =>
    isAdmin
      ? `/admin/leads/${leadId}/qualification/${scoreKey}`
      : `/leads/${leadId}/qualification/${scoreKey}?from=${appFrom}`;
  const resolvedBackHref =
    backHref ||
    (isAdmin
      ? navFrom === "scrape"
        ? "/admin/scrape"
        : "/admin/leads"
      : BACK_HREF[appFrom]);
  const resolvedBackLabel =
    backLabel ||
    (isAdmin
      ? navFrom === "scrape"
        ? "Back to scrape results"
        : "Back to all leads"
      : BACK_LABEL[appFrom]);

  async function adminEnrich() {
    setAdminEnriching(true);
    setAdminMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/enrich`, {
        method: "POST",
        signal: AbortSignal.timeout(90000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enrich failed");
      await load();
      const found = Object.entries(data.found ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k);
      setAdminMessage(
        found.length
          ? `Enriched: ${found.join(", ")}`
          : "Enrichment finished — nothing new found",
      );
    } catch (e) {
      setAdminMessage(e instanceof Error ? e.message : "Enrich failed");
    } finally {
      setAdminEnriching(false);
    }
  }

  async function adminDelete() {
    if (!confirm("Delete this lead permanently?")) return;
    setAdminDeleting(true);
    setAdminMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      router.push(navFrom === "scrape" ? "/admin/scrape" : "/admin/leads");
    } catch (e) {
      setAdminMessage(e instanceof Error ? e.message : "Delete failed");
      setAdminDeleting(false);
    }
  }

  return (
    <div className={isAdmin ? "page-enter" : "page-pad page-enter"}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <BackLink href={resolvedBackHref} label={resolvedBackLabel} />
          {!isAdmin && (
            <PageCrumbs
              items={[
                { label: "Home", href: "/home" },
                {
                  label: LEAD_FROM_CRUMB[appFrom],
                  href: resolvedBackHref,
                },
                { label: lead.businessName },
              ]}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          {navigation && navigation.position != null && navigation.total > 0 && (
            <span className="text-[12px] tabular-nums text-ink-faint">
              {navigation.position} of {navigation.total}
            </span>
          )}
          {navigation?.prevId ? (
            <Link
              href={detailHref(navigation.prevId)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-[var(--surface)] px-3 text-[12px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
            >
              <HiOutlineArrowLeft className="h-3.5 w-3.5" />
              Previous
            </Link>
          ) : (
            <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl border border-border/60 px-3 text-[12px] font-semibold text-ink-faint opacity-50">
              <HiOutlineArrowLeft className="h-3.5 w-3.5" />
              Previous
            </span>
          )}
          {navigation?.nextId ? (
            <Link
              href={detailHref(navigation.nextId)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-[var(--surface)] px-3 text-[12px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
            >
              Next
              <HiOutlineArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl border border-border/60 px-3 text-[12px] font-semibold text-ink-faint opacity-50">
              Next
              <HiOutlineArrowRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-[var(--panel-solid)] text-ink shadow-[var(--shadow-elevated)]">
        <div className="h-1.5 w-full" style={{ background: LOGO_GRADIENT }} />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={tier}>{lead.qualityTier ?? "nurture"}</Badge>
              <Badge variant="verified">
                <span className="inline-flex items-center gap-1">
                  <HiOutlineCheckBadge className="h-3 w-3" />
                  AI verified
                </span>
              </Badge>
              {lead.leadScore >= 75 && (
                <Badge variant="hot">High quality</Badge>
              )}
            </div>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-600">
              {lead.serviceCategory || lead.industry || "Home services"}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {lead.businessName}
            </h1>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-muted">
              <HiOutlineMapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              {lead.address || "Address not available"}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <HiStar className="h-4 w-4 text-amber-400" />
                {lead.googleRating?.toFixed(1) ?? "—"} · {lead.reviewCount ?? 0}{" "}
                Google reviews
              </span>
              {lead.revenueRangeEstimate && (
                <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-[12px] font-semibold text-brand-700">
                  Est. {lead.revenueRangeEstimate}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-5 py-3 text-center shadow-[var(--shadow-soft)]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Lead score
              </p>
              <p
                className="mt-0.5 text-3xl font-bold tabular-nums"
                style={{
                  background: LOGO_GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {lead.leadScore}
              </p>
            </div>
            {isAdmin ? (
              <Link
                href={`/admin/leads/${leadId}?edit=1${navFrom === "scrape" ? "&from=scrape" : ""}`}
                className="inline-flex h-10 items-center rounded-xl border border-border bg-[var(--surface)] px-4 text-[13px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
              >
                Edit raw fields
              </Link>
            ) : (
              <Button onClick={saveLead} loading={saving}>
                {!saving && <HiOutlineBookmark className="h-4 w-4" />}
                {saving
                  ? "Adding…"
                  : saved
                    ? "In pipeline"
                    : "Add to pipeline"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-brand-600 shadow-sm">
                  <HiOutlineUser className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Owner
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.ownerName ?? "Not available"}
                  </p>
                  {lead.ownerTitle && (
                    <p className="truncate text-[11px] text-ink-muted">
                      {lead.ownerTitle}
                      {lead.ownerConfidence
                        ? ` · ${lead.ownerConfidence}% confidence`
                        : ""}
                    </p>
                  )}
                  {lead.ownerSourceUrl && (
                    <a
                      href={lead.ownerSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-brand-600 hover:underline"
                    >
                      View public source
                    </a>
                  )}
                </div>
              </div>
              <a
                href={lead.phone ? `tel:${lead.phone}` : undefined}
                className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm transition hover:border-brand-200"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-brand-600 shadow-sm">
                  <HiOutlinePhone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Phone
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.phone ?? "Not available"}
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-brand-600 shadow-sm">
                  <HiOutlineEnvelope className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Email
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.email ?? "Not available"}
                  </p>
                  {lead.emailSourceUrl && (
                    <a
                      href={lead.emailSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-brand-600 hover:underline"
                    >
                      View public source
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-amber-500 shadow-sm">
                  <HiStar className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Star rating
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.googleRating?.toFixed(1) ?? "—"} (
                    {lead.reviewCount ?? 0} reviews)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm sm:col-span-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-brand-600 shadow-sm">
                  <HiOutlineGlobeAlt className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Website
                  </p>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-medium text-brand-600 hover:underline"
                    >
                      {lead.website}
                    </a>
                  ) : (
                    <p className="font-medium text-ink-faint">Not available</p>
                  )}
                </div>
              </div>
              {lead.yearsInBusiness != null && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Years in business
                  </p>
                  <p className="font-medium text-ink">{lead.yearsInBusiness}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1.5">
                <CardTitle className="flex items-center gap-2.5 text-[17px]">
                  <HiOutlineUserGroup className="h-5 w-5 shrink-0 text-brand-600" />
                  Public decision makers
                </CardTitle>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  Verified from pages published by this business.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={fetchSocial}
                disabled={fetchingSocial}
                className="shrink-0"
              >
                <HiOutlineArrowPath
                  className={`h-4 w-4 ${fetchingSocial ? "animate-spin" : ""}`}
                />
                {fetchingSocial ? "Refreshing…" : "Refresh public data"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
                <span
                  className={`rounded-full px-3 py-1 font-semibold ${
                    publicPeopleCount
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {publicPeopleCount
                    ? `${publicPeopleCount} public contact${publicPeopleCount === 1 ? "" : "s"} found`
                    : "No public people confirmed"}
                </span>
                {lead.peopleEnrichedAt && (
                  <span className="text-ink-muted">
                    Checked {new Date(lead.peopleEnrichedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {lead.ownerName && (
                <a
                  href={lead.ownerSourceUrl ?? undefined}
                  target={lead.ownerSourceUrl ? "_blank" : undefined}
                  rel={lead.ownerSourceUrl ? "noopener noreferrer" : undefined}
                  className="flex items-start gap-4 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/90 to-[var(--surface)] p-4 transition hover:border-brand-300"
                >
                  <span
                    className="btn-on-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-[var(--btn-on-brand)] shadow-sm"
                    style={{ background: LOGO_GRADIENT }}
                  >
                    {lead.ownerName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                      Primary decision maker
                    </span>
                    <span className="mt-0.5 block truncate text-base font-semibold text-ink">
                      {lead.ownerName}
                    </span>
                    <span className="block text-[12px] text-ink-muted">
                      {lead.ownerTitle || "Owner / leadership"}
                      {lead.ownerConfidence
                        ? ` · ${lead.ownerConfidence}% confidence`
                        : ""}
                    </span>
                    {lead.ownerSourceUrl && (
                      <span className="mt-1 block text-[11px] font-medium text-brand-600">
                        Open public source ↗
                      </span>
                    )}
                  </span>
                </a>
              )}

              {additionalTeamMembers.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Team members
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {additionalTeamMembers.map((member) => (
                      <a
                        key={`${member.name}-${member.role}`}
                        href={member.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 transition hover:border-brand-200"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-brand-600 shadow-sm">
                          <HiOutlineUser className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">
                            {member.name}
                          </span>
                          <span className="block truncate text-[12px] text-ink-muted">
                            {member.role} · {member.confidence}% confidence
                          </span>
                          <span className="text-[11px] font-medium text-brand-600">
                            Public website source ↗
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : !lead.ownerName ? (
                <p className="text-sm leading-relaxed text-ink-muted">
                  No owner or team member was confirmed from a public source.
                  Refresh to scan the business website and connected public
                  directories again.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Online presence & public directories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.socialEnrichedAt && (
                <p className="text-[12px] text-ink-muted">
                  Last fetched{" "}
                  {new Date(lead.socialEnrichedAt).toLocaleString()}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {lead.facebook && (
                  <SocialButton
                    href={lead.facebook}
                    label="Facebook"
                    icon={<FaFacebook className="h-4 w-4 text-[#1877F2]" />}
                  />
                )}
                {lead.instagram && (
                  <SocialButton
                    href={lead.instagram}
                    label="Instagram"
                    icon={<FaInstagram className="h-4 w-4 text-[#E4405F]" />}
                  />
                )}
                {linkedinCompany && (
                  <SocialButton
                    href={lead.linkedinCompanyUrl!}
                    label="LinkedIn"
                    icon={<FaLinkedin className="h-4 w-4 text-[#0A66C2]" />}
                    verified
                  />
                )}
                {lead.googleMapsLink && (
                  <SocialButton
                    href={lead.googleMapsLink}
                    label="Google Maps"
                    icon={
                      <HiOutlineMapPin className="h-4 w-4 text-brand-600" />
                    }
                  />
                )}
              </div>

              {(linkedinCompany || linkedinOwner) && (
                <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  {linkedinCompany && (
                    <a
                      href={lead.linkedinCompanyUrl!}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-2 text-[13px] font-medium text-emerald-800 hover:underline"
                    >
                      <HiOutlineCheckBadge className="h-4 w-4" />
                      Verified company LinkedIn
                      <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                    </a>
                  )}
                  {linkedinOwner && (
                    <a
                      href={lead.linkedinOwnerUrl!}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-2 text-[13px] font-medium text-emerald-800 hover:underline"
                    >
                      <HiOutlineCheckBadge className="h-4 w-4" />
                      {lead.ownerName ?? "Owner"} — verified
                      <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {!linkedinCompany && !linkedinOwner && (
                <div className="space-y-3 rounded-xl border border-dashed border-border bg-[#faf8fc] p-3">
                  <p className="text-[12px] text-ink-muted">
                    LinkedIn company not found yet. We try: website link →
                    domain lookup → name match → URL pattern (free methods
                    first).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={findLinkedIn}
                      loading={findingLinkedin}
                      disabled={fetchingSocial}
                    >
                      {!findingLinkedin && <FaLinkedin className="h-4 w-4" />}
                      {findingLinkedin ? "Finding…" : "Find LinkedIn company"}
                    </Button>
                    <a
                      href={linkedinSearchUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-[var(--surface)] px-3 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-50"
                    >
                      Search on LinkedIn
                      <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <PlatformTag href={lead.youtube} label="YouTube" />
                <PlatformTag href={lead.tiktok} label="TikTok" />
                <PlatformTag href={lead.yelpUrl} label="Yelp" />
                <PlatformTag href={lead.houzzUrl} label="Houzz" />
                <PlatformTag href={lead.nextdoor} label="Nextdoor" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <CardTitle className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[17px]">
                  <span className="inline-flex items-center gap-2.5">
                    <HiOutlineMegaphone className="h-5 w-5 shrink-0 text-brand-600" />
                    Facebook Ads Library
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    Coming soon
                  </span>
                </CardTitle>
                <p className="max-w-xl text-[13px] leading-relaxed text-ink-muted">
                  Check if this business is running Meta ads — and where the
                  marketing opportunity lies.
                </p>
              </div>
              <Button size="sm" disabled title="Coming soon" className="shrink-0">
                Check ads
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 px-4 py-6 text-center">
                <p className="text-[14px] font-semibold text-amber-950">
                  Coming soon
                </p>
                <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-amber-900/90">
                  Meta Ads Library checks are temporarily unavailable while we
                  finish this feature for agencies and admins.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-[17px]">AI verification</CardTitle>
              <Button
                size="sm"
                variant="secondary"
                onClick={reVerify}
                loading={verifying}
                className="shrink-0"
              >
                {verifying ? "Re-verifying…" : "Re-verify"}
              </Button>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center gap-4">
                <div
                  className="btn-on-brand flex h-16 w-16 flex-col items-center justify-center rounded-2xl text-[var(--btn-on-brand)]"
                  style={{ background: LOGO_GRADIENT }}
                >
                  <span className="text-xl font-bold leading-none">
                    {verificationScore ?? "—"}
                  </span>
                  <span className="text-[11px] font-normal opacity-80">
                    /100
                  </span>
                </div>
                <p className="text-sm text-ink-muted">
                  {verificationMessage ??
                    "Contact and social details are scored from what we can verify on this lead."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border shadow-[var(--shadow-soft)]">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-border/70 bg-[#faf8fc]/60 pb-4">
              <div>
                <CardTitle className="text-[16px]">
                  Website &amp; opportunity scores
                </CardTitle>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-muted">
                  Each score opens a detailed breakdown — what&apos;s weak, why it
                  matters, and how to pitch. Refresh re-audits the live site.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={qualificationRefreshing}
                disabled={qualificationRefreshing || !lead.website}
                onClick={() => void refreshQualification()}
                className="shrink-0"
              >
                <HiOutlineArrowPath className="mr-1.5 h-3.5 w-3.5" />
                {lead.website ? "Refresh audit" : "No website"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {lead.outreachAngle && (
                <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                    Recommended outreach angle
                  </p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink">
                    {lead.outreachAngle}
                  </p>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <QualificationScoreCard
                  href={qualHref("websiteQuality")}
                  label="Website quality"
                  value={lead.websiteQualityScore}
                  icon={HiOutlineGlobeAlt}
                />
                <QualificationScoreCard
                  href={qualHref("marketingOpportunity")}
                  label="Marketing opportunity"
                  value={lead.marketingOpportunityScore}
                  icon={HiOutlineMegaphone}
                />
                <QualificationScoreCard
                  href={qualHref("ppcOpportunity")}
                  label="PPC opportunity"
                  value={lead.ppcOpportunityScore}
                  icon={HiOutlineCursorArrowRays}
                />
                <QualificationScoreCard
                  href={qualHref("seoOpportunity")}
                  label="SEO opportunity"
                  value={lead.seoOpportunityScore}
                  icon={HiOutlineMagnifyingGlass}
                />
              </div>
            </CardContent>
          </Card>

          <LeadIntelligenceReportCard
            leadId={lead.id}
            businessName={lead.businessName}
            onReportsChange={() => setActivityRefresh((n) => n + 1)}
          />

          <OutreachStudio
            leadId={lead.id}
            businessName={lead.businessName}
            leadEmail={lead.email}
            leadPhone={lead.phone}
            canSend={!isAdmin}
            onSent={(_channel, status) => {
              if (status && lead.savedBy?.[0]) {
                setLead({
                  ...lead,
                  savedBy: [{ ...lead.savedBy[0], status }],
                });
              }
              setActivityRefresh((n) => n + 1);
              void load();
            }}
          />
        </div>

        <div className="space-y-5">
          {isAdmin ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Admin actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adminMessage && (
                    <p className="rounded-xl bg-brand-50 px-3 py-2 text-[12px] text-brand-800">
                      {adminMessage}
                    </p>
                  )}
                  <p className="text-[12px] text-ink-muted">
                    Source agency:{" "}
                    <span className="font-medium text-ink">
                      {lead.search?.user?.companyName ||
                        lead.search?.user?.email ||
                        "Pool / scrape"}
                    </span>
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={adminEnriching}
                    disabled={adminDeleting}
                    onClick={adminEnrich}
                  >
                    {adminEnriching ? "Enriching…" : "Enrich public data"}
                  </Button>
                  <Link
                    href={`/leads/${leadId}`}
                    className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-border bg-[var(--surface)] px-3 text-[13px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
                  >
                    Open in app
                  </Link>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={adminDeleting}
                    disabled={adminEnriching}
                    onClick={adminDelete}
                  >
                    {adminDeleting ? "Deleting…" : "Delete lead"}
                  </Button>
                </CardContent>
              </Card>
              {lead.savedBy && lead.savedBy.some((s) => s.user) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Saved by agencies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-[13px] text-ink-muted">
                      {lead.savedBy.map((s, i) =>
                        s.user ? (
                          <li key={s.id || i}>
                            {s.user.companyName || s.user.email}
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <select
                    className="saas-input"
                    value={saved?.status ?? "new"}
                    disabled={crmBusy || saving}
                    onChange={(e) => updateSaved("status", e.target.value)}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-xl border border-border bg-[#faf8fc] px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={saved?.favorite ?? false}
                      disabled={crmBusy || saving}
                      onChange={(e) => updateSaved("favorite", e.target.checked)}
                    />
                    {crmBusy ? "Updating…" : "Mark as favorite"}
                  </label>
                  {saved && lead.email ? (
                    <EnrollEmailSequenceButton
                      savedLeadId={saved.id}
                      hasEmail={Boolean(lead.email)}
                    />
                  ) : null}
                  {saved ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={crmBusy}
                      onClick={async () => {
                        if (!confirm("Remove this lead from your pipeline?"))
                          return;
                        setCrmBusy(true);
                        try {
                          await fetch(`/api/leads/saved/${saved.id}`, {
                            method: "DELETE",
                          });
                          await load();
                        } finally {
                          setCrmBusy(false);
                        }
                      }}
                    >
                      Remove from pipeline
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              <LeadSendEmailCard
                leadId={lead.id}
                leadEmail={lead.email}
                businessName={lead.businessName}
                ownerName={lead.ownerName}
                onSent={(status) => {
                  if (lead.savedBy?.[0]) {
                    setLead({
                      ...lead,
                      savedBy: [
                        {
                          ...lead.savedBy[0],
                          status,
                        },
                      ],
                    });
                  }
                  setActivityRefresh((n) => n + 1);
                  void load();
                }}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!saved && (
                    <p className="text-[12px] text-ink-faint">
                      Save this lead first to add notes.
                    </p>
                  )}
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Call notes, follow-up, objections…"
                    className="min-h-[100px]"
                  />
                  <Button
                    size="sm"
                    onClick={addNote}
                    loading={noteBusy}
                    disabled={!saved || !note.trim()}
                  >
                    {noteBusy ? "Adding…" : "Add note"}
                  </Button>
                  <ul className="space-y-2">
                    {saved?.notes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-xl border border-border bg-[#faf8fc] px-3 py-2.5 text-sm"
                      >
                        <p className="text-ink">{n.content}</p>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {!isAdmin ? (
        <div className="mt-6">
          <LeadActivityPanel leadId={lead.id} refreshKey={activityRefresh} />
        </div>
      ) : null}

      {popup && <ResultPopup popup={popup} onClose={() => setPopup(null)} />}
    </div>
  );
}
