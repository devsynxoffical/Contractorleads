"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { INDUSTRIES, TIER_ONE_COUNTRIES } from "@/lib/constants";

type Lead = Record<string, string | number | null | undefined> & {
  id: string;
  businessName: string;
  search?: {
    user?: { email: string; companyName: string | null } | null;
  } | null;
  savedBy?: Array<{
    user: { email: string; companyName: string | null };
  }>;
};

const FIELD_GROUPS: Array<{
  title: string;
  fields: Array<{ key: string; label: string; type?: "text" | "number" | "textarea" | "select"; options?: string[] }>;
}> = [
  {
    title: "Core",
    fields: [
      { key: "businessName", label: "Business name" },
      { key: "ownerName", label: "Owner name" },
      { key: "ownerTitle", label: "Owner title" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "website", label: "Website" },
      { key: "address", label: "Address", type: "textarea" },
      { key: "googleMapsLink", label: "Google Maps link" },
    ],
  },
  {
    title: "Scoring",
    fields: [
      { key: "leadScore", label: "Lead score", type: "number" },
      {
        key: "qualityTier",
        label: "Quality tier",
        type: "select",
        options: ["hot", "warm", "nurture"],
      },
      { key: "googleRating", label: "Google rating", type: "number" },
      { key: "reviewCount", label: "Review count", type: "number" },
      { key: "yearsInBusiness", label: "Years in business", type: "number" },
      { key: "revenueRangeEstimate", label: "Revenue range" },
      { key: "websiteQualityScore", label: "Website quality", type: "number" },
      {
        key: "marketingOpportunityScore",
        label: "Marketing opportunity",
        type: "number",
      },
      { key: "ppcOpportunityScore", label: "PPC opportunity", type: "number" },
      { key: "seoOpportunityScore", label: "SEO opportunity", type: "number" },
      { key: "outreachAngle", label: "Outreach angle", type: "textarea" },
    ],
  },
  {
    title: "Location & niche",
    fields: [
      {
        key: "industry",
        label: "Industry",
        type: "select",
        options: [...INDUSTRIES],
      },
      {
        key: "country",
        label: "Country",
        type: "select",
        options: TIER_ONE_COUNTRIES.map((c) => c.code),
      },
      { key: "state", label: "State / region" },
      { key: "city", label: "City" },
      { key: "zip", label: "Postal code" },
      { key: "serviceCategory", label: "Service category" },
      { key: "verificationStatus", label: "Verification status" },
    ],
  },
  {
    title: "Social & directories",
    fields: [
      { key: "facebook", label: "Facebook" },
      { key: "instagram", label: "Instagram" },
      { key: "youtube", label: "YouTube" },
      { key: "tiktok", label: "TikTok" },
      { key: "linkedinUrl", label: "LinkedIn" },
      { key: "linkedinCompanyUrl", label: "LinkedIn company" },
      { key: "linkedinOwnerUrl", label: "LinkedIn owner" },
      { key: "yelpUrl", label: "Yelp" },
      { key: "houzzUrl", label: "Houzz" },
      { key: "nextdoor", label: "Nextdoor" },
    ],
  },
];

export default function AdminLeadEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/leads/${id}`);
    const data = await res.json();
    setLead(data.lead ?? null);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function save() {
    if (!lead) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Save failed");
      return;
    }
    setLead(data.lead);
    setMessage("Lead saved");
  }

  async function enrich() {
    setEnriching(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${id}/enrich`, {
        method: "POST",
        signal: AbortSignal.timeout(90000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enrich failed");
      setLead(data.lead);
      const found = Object.entries(data.found ?? {})
        .filter(([, v]) => v)
        .map(([k]) => k);
      setMessage(
        found.length
          ? `Enriched: ${found.join(", ")}`
          : "Enrichment finished — nothing new found",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Enrich failed");
    } finally {
      setEnriching(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this lead permanently?")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Delete failed");
      setDeleting(false);
      return;
    }
    router.push("/admin/leads");
  }

  if (!lead) {
    return <p className="text-sm text-ink-muted animate-pulse">Loading lead…</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title={lead.businessName}
        description={`Source agency: ${
          lead.search?.user?.companyName || lead.search?.user?.email || "—"
        }`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} loading={saving} disabled={enriching || deleting}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button
              variant="secondary"
              loading={enriching}
              disabled={saving || deleting}
              onClick={enrich}
            >
              {enriching ? "Enriching…" : "Enrich public data"}
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={saving || enriching}
              onClick={remove}
            >
              {deleting ? "Deleting…" : "Delete lead"}
            </Button>
            <Link
              href={`/leads/${id}`}
              className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold text-ink-muted"
            >
              Open in app
            </Link>
          </div>
        }
      />

      {message && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {message}
        </p>
      )}

      <div className="space-y-5">
        {FIELD_GROUPS.map((group) => (
          <section
            key={group.title}
            className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]"
          >
            <h2 className="mb-3 text-sm font-semibold text-ink">{group.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.fields.map((field) => (
                <label
                  key={field.key}
                  className={`block text-[12px] ${
                    field.type === "textarea" ? "sm:col-span-2" : ""
                  }`}
                >
                  <span className="font-medium text-ink-muted">{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      className="saas-input mt-1 min-h-[80px]"
                      value={String(lead[field.key] ?? "")}
                      onChange={(e) =>
                        setLead({ ...lead, [field.key]: e.target.value })
                      }
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="saas-input mt-1"
                      value={String(lead[field.key] ?? "")}
                      onChange={(e) =>
                        setLead({ ...lead, [field.key]: e.target.value })
                      }
                    >
                      <option value="">—</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      className="saas-input mt-1"
                      value={
                        lead[field.key] == null ? "" : String(lead[field.key])
                      }
                      onChange={(e) =>
                        setLead({
                          ...lead,
                          [field.key]:
                            field.type === "number"
                              ? e.target.value === ""
                                ? null
                                : Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        {lead.savedBy && lead.savedBy.length > 0 && (
          <section className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-ink">
              Saved by agencies
            </h2>
            <ul className="mt-2 space-y-1 text-[13px] text-ink-muted">
              {lead.savedBy.map((s, i) => (
                <li key={i}>
                  {s.user.companyName || s.user.email}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
