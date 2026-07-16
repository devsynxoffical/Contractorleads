"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBookmark,
  HiOutlineCheckBadge,
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlineMegaphone,
  HiOutlinePhone,
  HiOutlineUser,
  HiStar,
} from "react-icons/hi2";
import { FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/lib/constants";
import { OutreachStudio } from "@/components/leads/outreach-studio";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

type FacebookAdsResult = {
  ads: Array<{
    id: string;
    pageName: string;
    adCreativeBodies: string[];
    adSnapshotUrl: string;
    publisherPlatforms: string[];
    adDeliveryStartTime?: string;
  }>;
  totalCount: number;
  searchUrl: string;
  source: "api" | "link";
  message?: string;
};

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
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-semibold shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:bg-brand-50 ${
        verified
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-border bg-white text-ink"
      }`}
    >
      {icon}
      {label}
      <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 opacity-50" />
    </a>
  );
}

function PlatformTag({
  href,
  label,
}: {
  href?: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <span className="rounded-lg border border-dashed border-border px-2.5 py-1 text-[11px] text-ink-faint">
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-brand-700 transition hover:bg-brand-50"
    >
      {label}
    </a>
  );
}

export function LeadDetailView({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchingSocial, setFetchingSocial] = useState(false);
  const [findingLinkedin, setFindingLinkedin] = useState(false);
  const [checkingAds, setCheckingAds] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationScore, setVerificationScore] = useState<number | null>(null);
  const [adsResult, setAdsResult] = useState<FacebookAdsResult | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/leads/${leadId}`);
    const data = await res.json();
    setLead(data.lead);
    if (data.lead?.facebookAdsData) {
      try {
        setAdsResult(JSON.parse(data.lead.facebookAdsData));
      } catch {
        setAdsResult(null);
      }
    }
  }

  useEffect(() => {
    load();
  }, [leadId]);

  useEffect(() => {
    if (lead && verificationScore === null) {
      fetch(`/api/leads/${leadId}/verify`, { method: "POST" })
        .then((r) => r.json())
        .then((d) => setVerificationScore(d.verificationScore ?? null))
        .catch(() => setVerificationScore(null));
    }
  }, [lead, leadId, verificationScore]);

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

  async function fetchSocial() {
    setFetchingSocial(true);
    setSocialMessage(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/enrich-social`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setLead(data.lead);
      setVerificationScore(data.verificationScore ?? null);
      const found = Object.entries(data.found ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k.replace(/([A-Z])/g, " $1").toLowerCase());
      setSocialMessage(
        found.length
          ? `Found: ${found.join(", ")}`
          : "No new profiles found. Add API keys in .env for LinkedIn & Meta."
      );
    } catch (e) {
      setSocialMessage(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setFetchingSocial(false);
    }
  }

  async function findLinkedIn() {
    setFindingLinkedin(true);
    setSocialMessage(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/linkedin`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "LinkedIn lookup failed");
      setLead(data.lead);
      if (data.linkedin?.verified && data.linkedin.url) {
        setSocialMessage(
          `LinkedIn company found (${data.linkedin.sourceLabel ?? "verified"}).`
        );
      } else {
        setSocialMessage(
          "No verified LinkedIn company page found automatically. Use the manual search link below."
        );
      }
    } catch (e) {
      setSocialMessage(e instanceof Error ? e.message : "LinkedIn lookup failed");
    } finally {
      setFindingLinkedin(false);
    }
  }

  async function checkAds() {
    setCheckingAds(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/facebook-ads`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setAdsResult(data.ads);
      await load();
    } catch {
      setAdsResult(null);
    } finally {
      setCheckingAds(false);
    }
  }

  async function reVerify() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/verify`, { method: "POST" });
      const data = await res.json();
      setVerificationScore(data.verificationScore ?? null);
    } finally {
      setVerifying(false);
    }
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
  const linkedinCompany =
    lead.linkedinCompanyUrl && (lead.linkedinConfidenceScore ?? 0) >= 95;
  const linkedinOwner =
    lead.linkedinOwnerUrl && (lead.linkedinOwnerConfidenceScore ?? 0) >= 95;
  const tier =
    lead.qualityTier === "hot"
      ? "hot"
      : lead.qualityTier === "warm"
        ? "warm"
        : "nurture";
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.businessName)}`;

  return (
    <div className="page-pad page-enter">
      <Link
        href="/home"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition hover:text-brand-700"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        Back to results
      </Link>

      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-white shadow-[var(--shadow-elevated)]">
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
              <CardTitle>Contact information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                  <HiOutlineUser className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Owner
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.ownerName ?? "Not available"}
                  </p>
                </div>
              </div>
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
              <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-amber-500 shadow-sm">
                  <HiStar className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Star rating
                  </p>
                  <p className="truncate font-medium text-ink">
                    {lead.googleRating?.toFixed(1) ?? "—"} ({lead.reviewCount ?? 0}{" "}
                    reviews)
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
              {lead.yearsInBusiness != null && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-[#faf8fc] px-3.5 py-3 text-sm sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Years in business
                  </p>
                  <p className="font-medium text-ink">{lead.yearsInBusiness}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Social & review profiles</CardTitle>
              <Button
                size="sm"
                variant="secondary"
                onClick={fetchSocial}
                disabled={fetchingSocial}
              >
                <HiOutlineArrowPath
                  className={`h-4 w-4 ${fetchingSocial ? "animate-spin" : ""}`}
                />
                {fetchingSocial ? "Fetching…" : "Fetch"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialMessage && (
                <p className="rounded-lg bg-brand-50 px-3 py-2 text-[12px] text-brand-800">
                  {socialMessage}
                </p>
              )}
              {lead.socialEnrichedAt && (
                <p className="text-[11px] text-ink-faint">
                  Last fetched {new Date(lead.socialEnrichedAt).toLocaleString()}
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
                    icon={<HiOutlineMapPin className="h-4 w-4 text-brand-600" />}
                  />
                )}
              </div>

              {(linkedinCompany || linkedinOwner) && (
                <div className="space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                  {linkedinCompany && (
                    <a
                      href={lead.linkedinCompanyUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
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
                      rel="noopener noreferrer"
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
                    LinkedIn company not found yet. We try: website link → domain
                    lookup → name match → URL pattern (free methods first).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={findLinkedIn}
                      disabled={findingLinkedin || fetchingSocial}
                    >
                      <FaLinkedin className="h-4 w-4" />
                      {findingLinkedin ? "Finding…" : "Find LinkedIn company"}
                    </Button>
                    <a
                      href={linkedinSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-50"
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
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HiOutlineMegaphone className="h-5 w-5 text-brand-600" />
                  Facebook Ads Library
                </CardTitle>
                <p className="mt-1 text-[12px] text-ink-muted">
                  Check if this business is running Meta ads — and where the
                  marketing opportunity lies.
                </p>
              </div>
              <Button
                size="sm"
                onClick={checkAds}
                disabled={checkingAds}
              >
                {checkingAds ? "Checking…" : "Check ads"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {adsResult?.message && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                  {adsResult.message}
                </p>
              )}
              {adsResult && adsResult.ads.length > 0 ? (
                <ul className="space-y-3">
                  {adsResult.ads.map((ad) => (
                    <li
                      key={ad.id}
                      className="rounded-xl border border-border bg-[#faf8fc] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold text-ink">
                            {ad.pageName}
                          </p>
                          {ad.adCreativeBodies[0] && (
                            <p className="mt-1 line-clamp-2 text-[12px] text-ink-muted">
                              {ad.adCreativeBodies[0]}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-ink-faint">
                            {ad.publisherPlatforms.join(", ")}
                            {ad.adDeliveryStartTime &&
                              ` · since ${new Date(ad.adDeliveryStartTime).toLocaleDateString()}`}
                          </p>
                        </div>
                        {ad.adSnapshotUrl && (
                          <a
                            href={ad.adSnapshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-[12px] font-medium text-brand-600 hover:underline"
                          >
                            View ad
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : adsResult ? (
                <p className="text-[13px] text-ink-muted">
                  No active ads found for this business.
                </p>
              ) : (
                <p className="text-[13px] text-ink-faint">
                  Click &quot;Check ads&quot; to search the Meta Ads Library.
                </p>
              )}
              {adsResult?.searchUrl && (
                <a
                  href={adsResult.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:underline"
                >
                  Open full Ads Library search
                  <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                </a>
              )}
              {lead.facebookAdsCheckedAt && (
                <p className="text-[11px] text-ink-faint">
                  Last checked{" "}
                  {new Date(lead.facebookAdsCheckedAt).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>AI verification</CardTitle>
              <Button
                size="sm"
                variant="secondary"
                onClick={reVerify}
                disabled={verifying}
              >
                <HiOutlineArrowPath
                  className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`}
                />
                Re-verify
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white"
                  style={{ background: LOGO_GRADIENT }}
                >
                  {verificationScore ?? "—"}
                  <span className="text-sm font-normal opacity-80">/100</span>
                </div>
                <p className="text-sm text-ink-muted">
                  Contact and social details cross-referenced. Run Fetch on
                  social profiles to improve this score.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI qualification engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.outreachAngle && (
                <div className="rounded-xl border border-brand-100 bg-gradient-to-r from-brand-50/90 to-white px-4 py-3 text-sm leading-relaxed text-ink">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">
                    Recommended outreach angle
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
