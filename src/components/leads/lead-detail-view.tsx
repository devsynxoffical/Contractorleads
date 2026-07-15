"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBookmark,
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiStar,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/lib/constants";
import { OutreachStudio } from "@/components/leads/outreach-studio";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

type Lead = {
  id: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  address: string | null;
  googleMapsLink: string | null;
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
  yelpUrl: string | null;
  yelpRating: number | null;
  yelpReviews: number | null;
  nextdoor: string | null;
  houzzUrl: string | null;
  houzzRating: number | null;
  houzzReviews: number | null;
  linkedinUrl: string | null;
  linkedinType: string;
  linkedinConfidenceScore: number | null;
  youtube: string | null;
  qualityTier: string | null;
  industry: string | null;
  state: string | null;
  city: string | null;
  savedBy: Array<{
    id: string;
    status: string;
    favorite: boolean;
    notes: Array<{ id: string; content: string; createdAt: string }>;
  }>;
};

function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  const v = value ?? 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="font-medium text-ink-muted">{label}</span>
        <span className="font-semibold tabular-nums text-ink">{v}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f0ebf5]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, v)}%`,
            background: LOGO_GRADIENT,
          }}
        />
      </div>
    </div>
  );
}

export function LeadDetailView({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/leads/${leadId}`);
    const data = await res.json();
    setLead(data.lead);
  }

  useEffect(() => {
    load();
  }, [leadId]);

  async function saveLead() {
    setSaving(true);
    await fetch(`/api/leads/${leadId}/save`, { method: "POST" });
    await load();
    setSaving(false);
  }

  async function updateSaved(field: string, value: string | boolean) {
    const savedId = lead?.savedBy[0]?.id;
    if (!savedId) {
      await saveLead();
      await load();
      return updateSaved(field, value);
    }
    await fetch(`/api/leads/saved/${savedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    await load();
  }

  async function addNote() {
    const savedId = lead?.savedBy[0]?.id;
    if (!savedId || !note.trim()) return;
    await fetch(`/api/leads/saved/${savedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });
    setNote("");
    await load();
  }

  if (!lead) {
    return (
      <div className="page-pad">
        <div className="saas-card animate-pulse p-8 text-sm text-ink-muted">
          Loading lead profile…
        </div>
      </div>
    );
  }

  const saved = lead.savedBy[0];
  const linkedinAvailable =
    lead.linkedinUrl && (lead.linkedinConfidenceScore ?? 0) >= 95;
  const tier =
    lead.qualityTier === "hot"
      ? "hot"
      : lead.qualityTier === "warm"
        ? "warm"
        : "nurture";

  return (
    <div className="page-pad page-enter">
      <Link
        href="/home"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-brand-700"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-white shadow-[var(--shadow-elevated)]">
        <div
          className="h-1.5 w-full"
          style={{ background: LOGO_GRADIENT }}
        />
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
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
            <Button onClick={saveLead} disabled={saving}>
              <HiOutlineBookmark className="h-4 w-4" />
              {saved ? "Saved to workspace" : "Save lead"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <a
                href={lead.phone ? `tel:${lead.phone}` : undefined}
                className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm transition hover:border-brand-200"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                  <HiOutlinePhone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Phone
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.phone ?? "Not available"}
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                  <HiOutlineEnvelope className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Email
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.email ?? "Not available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm sm:col-span-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                  <HiOutlineGlobeAlt className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profiles & reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  lead.googleMapsLink && {
                    href: lead.googleMapsLink,
                    label: "Google Maps",
                  },
                  lead.yelpUrl && {
                    href: lead.yelpUrl,
                    label: `Yelp${lead.yelpRating != null ? ` · ${lead.yelpRating}★` : ""}`,
                  },
                  lead.houzzUrl && {
                    href: lead.houzzUrl,
                    label: `Houzz${lead.houzzRating != null ? ` · ${lead.houzzRating}★` : ""}`,
                  },
                  lead.nextdoor && { href: lead.nextdoor, label: "Nextdoor" },
                  lead.facebook && { href: lead.facebook, label: "Facebook" },
                  lead.instagram && { href: lead.instagram, label: "Instagram" },
                  lead.youtube && { href: lead.youtube, label: "YouTube" },
                ]
                  .filter(Boolean)
                  .map((item) => {
                    const link = item as { href: string; label: string };
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-[13px] font-medium text-ink shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:bg-brand-50"
                      >
                        {link.label}
                        <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 text-ink-faint" />
                      </a>
                    );
                  })}
                {linkedinAvailable ? (
                  <a
                    href={lead.linkedinUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800"
                  >
                    Verified LinkedIn ({lead.linkedinType})
                  </a>
                ) : (
                  <span className="inline-flex items-center rounded-xl border border-dashed border-border px-3 py-2 text-[13px] text-ink-faint">
                    LinkedIn not available
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI opportunity scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.outreachAngle && (
                <div className="rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/90 to-white px-4 py-3 text-sm leading-relaxed text-ink">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                    Outreach angle
                  </p>
                  <p className="mt-1">{lead.outreachAngle}</p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <ScoreBar label="Website quality" value={lead.websiteQualityScore} />
                <ScoreBar
                  label="Marketing opportunity"
                  value={lead.marketingOpportunityScore}
                />
                <ScoreBar label="PPC opportunity" value={lead.ppcOpportunityScore} />
                <ScoreBar label="SEO opportunity" value={lead.seoOpportunityScore} />
              </div>
            </CardContent>
          </Card>

          <OutreachStudio leadId={lead.id} businessName={lead.businessName} />
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="saas-input"
                value={saved?.status ?? "new"}
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
                  onChange={(e) => updateSaved("favorite", e.target.checked)}
                />
                Mark as favorite
              </label>
            </CardContent>
          </Card>

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
              <Button size="sm" onClick={addNote} disabled={!saved || !note.trim()}>
                Add note
              </Button>
              <ul className="space-y-2">
                {saved?.notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-xl border border-border bg-[#faf8fc] px-3 py-2.5 text-sm"
                  >
                    <p className="text-ink">{n.content}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
