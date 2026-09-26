"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineBellAlert,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { CREDIT_COSTS } from "@/lib/constants";

type Region = { code: string; name: string };

type DigestSegment = {
  id: string;
  name: string;
  enabled: boolean;
  industry: string;
  country: string;
  locationScope: "local" | "country";
  state: string | null;
  city: string | null;
  dailyLeadCount: number;
  timezone: string;
  lastRunAt: string | null;
  lastError: string | null;
};

type Options = {
  industries: string[];
  countries: Array<{ code: string; name: string; regionLabel: string }>;
  leadCounts: number[];
  timezones: string[];
  creditCostPerLead: number;
  regionsByCountry: Record<string, Region[]>;
};

const BLANK: Omit<DigestSegment, "id" | "lastRunAt" | "lastError"> = {
  name: "",
  enabled: true,
  industry: "Roofing",
  country: "US",
  locationScope: "local",
  state: "TX",
  city: null,
  dailyLeadCount: 20,
  timezone: "America/Chicago",
};

function SegmentForm({
  value,
  onChange,
  options,
}: {
  value: typeof BLANK;
  onChange: (patch: Partial<typeof BLANK>) => void;
  options: Options;
}) {
  const regions = useMemo(
    () => options.regionsByCountry[value.country] ?? [],
    [options.regionsByCountry, value.country],
  );
  const regionLabel =
    options.countries.find((c) => c.code === value.country)?.regionLabel ?? "State";
  const estimatedCredits =
    value.dailyLeadCount * (options.creditCostPerLead ?? CREDIT_COSTS.lead);

  return (
    <div className="space-y-4">
      {/* Name */}
      <label className="block">
        <span className="text-[12px] font-medium text-ink-muted">Segment name</span>
        <input
          type="text"
          className="saas-input mt-1.5 w-full"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value.slice(0, 80) })}
          placeholder="e.g. Plumbing – Dallas"
          maxLength={80}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Industry */}
        <label className="block">
          <span className="text-[12px] font-medium text-ink-muted">Industry</span>
          <select
            className="saas-input mt-1.5 w-full"
            value={value.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
          >
            {options.industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>

        {/* Country */}
        <label className="block">
          <span className="text-[12px] font-medium text-ink-muted">Country</span>
          <select
            className="saas-input mt-1.5 w-full"
            value={value.country}
            onChange={(e) => onChange({ country: e.target.value, state: null })}
          >
            {options.countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {/* Location scope */}
        <label className="block">
          <span className="text-[12px] font-medium text-ink-muted">Location scope</span>
          <select
            className="saas-input mt-1.5 w-full"
            value={value.locationScope}
            onChange={(e) =>
              onChange({
                locationScope: e.target.value === "country" ? "country" : "local",
              })
            }
          >
            <option value="local">Specific {regionLabel.toLowerCase()}</option>
            <option value="country">Entire country</option>
          </select>
        </label>

        {/* State/region */}
        {value.locationScope === "local" ? (
          <label className="block">
            <span className="text-[12px] font-medium text-ink-muted">{regionLabel}</span>
            <select
              className="saas-input mt-1.5 w-full"
              value={value.state ?? ""}
              onChange={(e) => onChange({ state: e.target.value || null })}
            >
              <option value="">Select…</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex items-end">
            <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-[12px] text-ink-muted">
              Entire{" "}
              {options.countries.find((c) => c.code === value.country)?.name} each morning
            </p>
          </div>
        )}

        {/* Daily lead count */}
        <div>
          <span className="text-[12px] font-medium text-ink-muted">Daily leads</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(options.leadCounts ?? [20, 50, 100]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ dailyLeadCount: n })}
                className={cn(
                  "rounded-xl border px-4 py-2 text-[13px] font-semibold transition",
                  value.dailyLeadCount === n
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-border bg-[var(--surface)] text-ink-muted hover:border-brand-200",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-ink-muted">
            ≈ {estimatedCredits.toFixed(1)} credits / morning
          </p>
        </div>

        {/* Timezone */}
        <label className="block">
          <span className="text-[12px] font-medium text-ink-muted">Timezone</span>
          <select
            className="saas-input mt-1.5 w-full"
            value={value.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          >
            {options.timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[12px] text-ink-muted">
            Sends around 7–9 am local time.
          </p>
        </label>
      </div>
    </div>
  );
}

function SegmentCard({
  seg,
  onToggle,
  onEdit,
  onDelete,
}: {
  seg: DigestSegment;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const locationLine =
    seg.locationScope === "country"
      ? `Entire ${seg.country}`
      : [seg.city, seg.state, seg.country].filter(Boolean).join(", ");

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] transition",
        !seg.enabled && "opacity-60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{seg.name}</span>
            {seg.enabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                Paused
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-muted">
            {seg.industry} · {locationLine} · {seg.dailyLeadCount} leads/day ·{" "}
            {seg.timezone.replace(/_/g, " ")}
          </p>
          {seg.lastRunAt && (
            <p className="mt-0.5 text-[12px] text-ink-faint">
              Last sent:{" "}
              {new Date(seg.lastRunAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              {seg.lastError ? ` · ⚠ ${seg.lastError}` : ""}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggle}
            title={seg.enabled ? "Pause" : "Resume"}
            className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-700"
          >
            {seg.enabled ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="Edit"
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-[var(--input-bg)] hover:text-ink"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-rose-50 hover:text-rose-500"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DigestEmailSegmentsSettings() {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Options | null>(null);
  const [segments, setSegments] = useState<DigestSegment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof BLANK>({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/digest/segments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOptions(data.options ?? null);
      setSegments(data.segments ?? []);
      // Prime the form with first industry
      if (data.options?.industries?.[0]) {
        setForm((f) => ({ ...f, industry: data.options.industries[0] }));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setForm({ ...BLANK, industry: options?.industries[0] ?? "Roofing" });
    setEditingId(null);
    setMsg(null);
    setShowForm(true);
  }

  function openEdit(seg: DigestSegment) {
    setForm({
      name: seg.name,
      enabled: seg.enabled,
      industry: seg.industry,
      country: seg.country,
      locationScope: seg.locationScope,
      state: seg.state,
      city: seg.city,
      dailyLeadCount: seg.dailyLeadCount,
      timezone: seg.timezone,
    });
    setEditingId(seg.id);
    setMsg(null);
    setShowForm(true);
  }

  async function saveForm() {
    if (!form.name.trim()) { setMsg({ type: "err", text: "Enter a name." }); return; }
    setSaving(true);
    setMsg(null);
    try {
      const url = editingId
        ? `/api/digest/segments?id=${editingId}`
        : "/api/digest/segments";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (editingId) {
        setSegments((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...data.segment } : s)),
        );
      } else {
        setSegments((prev) => [...prev, data.segment]);
      }
      setShowForm(false);
      setEditingId(null);
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(seg: DigestSegment) {
    const next = !seg.enabled;
    setSegments((prev) =>
      prev.map((s) => (s.id === seg.id ? { ...s, enabled: next } : s)),
    );
    await fetch(`/api/digest/segments?id=${seg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
  }

  async function deleteSeg(id: string) {
    setSegments((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/digest/segments?id=${id}`, { method: "DELETE" });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 text-[13px] text-ink-muted">
        Loading digest segments…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            <HiOutlineBellAlert className="h-4 w-4" />
            Lead Finder Emails
          </div>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">
            Segmented daily digests
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-muted">
            Create multiple digest subscriptions — each targets a specific industry and
            location. We run a live search each morning, bill credits (1 per lead), and
            email fresh verified leads to you.
          </p>
        </div>

        {segments.length < 10 && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1a1224] px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Add segment
          </button>
        )}
      </div>

      {/* Segments list */}
      {segments.length > 0 ? (
        <div className="mt-5 space-y-3">
          {segments.map((seg) => (
            <SegmentCard
              key={seg.id}
              seg={seg}
              onToggle={() => void toggle(seg)}
              onEdit={() => openEdit(seg)}
              onDelete={() => void deleteSeg(seg.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13px] text-ink-muted">
          No digest segments yet.{" "}
          <button
            type="button"
            onClick={openAdd}
            className="font-semibold text-brand-600 hover:underline"
          >
            Add your first one
          </button>{" "}
          to receive daily leads by email.
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">
                {editingId ? "Edit digest segment" : "New digest segment"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-[var(--input-bg)]"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
              <SegmentForm
                value={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                options={options}
              />

              {msg && (
                <p
                  className={cn(
                    "mt-4 flex items-center gap-1.5 text-[13px]",
                    msg.type === "ok" ? "text-emerald-700" : "text-rose-600",
                  )}
                >
                  {msg.type === "ok" ? (
                    <HiOutlineCheckCircle className="h-4 w-4" />
                  ) : (
                    <HiOutlineExclamationCircle className="h-4 w-4" />
                  )}
                  {msg.text}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-border px-4 py-2 text-[13px] font-semibold text-ink transition hover:bg-[var(--input-bg)]"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveForm()}
                disabled={saving || !form.name.trim()}
                className={cn(
                  "rounded-xl px-4 py-2 text-[13px] font-semibold text-white transition",
                  saving || !form.name.trim()
                    ? "cursor-not-allowed bg-brand-400 opacity-60"
                    : "bg-[#1a1224] hover:opacity-90",
                )}
              >
                {saving ? "Saving…" : editingId ? "Save changes" : "Create segment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
