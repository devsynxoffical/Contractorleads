"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineBellAlert,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { CREDIT_COSTS } from "@/lib/constants";

type Region = { code: string; name: string };

type Subscription = {
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

type Delivery = {
  id: string;
  leadCount: number;
  creditsCharged: number;
  emailStatus: string;
  error: string | null;
  createdAt: string;
};

type Options = {
  industries: string[];
  countries: Array<{ code: string; name: string; regionLabel: string }>;
  leadCounts: number[];
  creditCostPerLead: number;
  regionsByCountry: Record<string, Region[]>;
};

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "Europe/London",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function DailyDigestSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [options, setOptions] = useState<Options | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [form, setForm] = useState<Subscription>({
    enabled: false,
    industry: "Roofing",
    country: "US",
    locationScope: "local",
    state: "TX",
    city: null,
    dailyLeadCount: 20,
    timezone: "America/Chicago",
    lastRunAt: null,
    lastError: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/digest/subscription");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setOptions(data.options);
      setDeliveries(data.recentDeliveries ?? []);
      if (data.subscription) {
        setForm({
          ...data.subscription,
          locationScope:
            data.subscription.locationScope === "country" ? "country" : "local",
        });
      } else if (data.options?.industries?.[0]) {
        setForm((f) => ({
          ...f,
          industry: data.options.industries[0],
          dailyLeadCount: data.options.leadCounts[0] ?? 20,
        }));
      }
    } catch (e) {
      setMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const regions = useMemo(() => {
    if (!options) return [];
    return options.regionsByCountry[form.country] ?? [];
  }, [options, form.country]);

  const regionLabel =
    options?.countries.find((c) => c.code === form.country)?.regionLabel ??
    "State";

  const estimatedCredits = form.dailyLeadCount * (options?.creditCostPerLead ?? CREDIT_COSTS.lead);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/digest/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          industry: form.industry,
          country: form.country,
          locationScope: form.locationScope,
          state: form.state,
          city: form.city,
          dailyLeadCount: form.dailyLeadCount,
          timezone: form.timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.subscription) setForm((f) => ({ ...f, ...data.subscription }));
      setMsg({
        type: "ok",
        text: form.enabled
          ? "Daily digest saved — you'll get fresh leads by email each morning."
          : "Digest preferences saved (currently paused).",
      });
    } catch (e) {
      setMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white/90 p-5 text-[13px] text-ink-muted shadow-[var(--shadow-card)]">
        Loading digest settings…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white/90 p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            <HiOutlineBellAlert className="h-4 w-4" />
            Daily Digest
          </div>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-[20px] font-semibold text-ink">
            Fresh leads every morning
          </h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-muted">
            Pick an industry, market, and daily volume. We run a live search each
            morning, unlock verified leads (1 credit each), and email them to you.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-[var(--input-bg)] px-3 py-2 text-[13px] font-semibold text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#9333ea]"
            checked={form.enabled}
            onChange={(e) =>
              setForm((f) => ({ ...f, enabled: e.target.checked }))
            }
          />
          {form.enabled ? "On" : "Paused"}
        </label>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Industry</Label>
          <select
            className="saas-input mt-1.5 w-full"
            value={form.industry}
            onChange={(e) =>
              setForm((f) => ({ ...f, industry: e.target.value }))
            }
          >
            {(options?.industries ?? []).map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Country</Label>
          <select
            className="saas-input mt-1.5 w-full"
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                country: e.target.value,
                state: null,
              }))
            }
          >
            {(options?.countries ?? []).map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Location scope</Label>
          <select
            className="saas-input mt-1.5 w-full"
            value={form.locationScope}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                locationScope: e.target.value === "country" ? "country" : "local",
              }))
            }
          >
            <option value="local">Specific {regionLabel.toLowerCase()}</option>
            <option value="country">Entire country</option>
          </select>
        </div>

        {form.locationScope === "local" ? (
          <div>
            <Label>{regionLabel}</Label>
            <select
              className="saas-input mt-1.5 w-full"
              value={form.state ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  state: e.target.value || null,
                }))
              }
            >
              <option value="">Select…</option>
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-end">
            <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-[12px] text-ink-muted">
              Entire {options?.countries.find((c) => c.code === form.country)?.name}{" "}
              each morning
            </p>
          </div>
        )}

        <div>
          <Label>Daily leads</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(options?.leadCounts ?? [20, 50, 100]).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, dailyLeadCount: n }))}
                className={`rounded-xl border px-4 py-2 text-[13px] font-semibold transition ${
                  form.dailyLeadCount === n
                    ? "border-brand-400 bg-brand-50 text-brand-700"
                    : "border-border bg-white text-ink-muted hover:border-brand-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            ≈ {estimatedCredits.toFixed(1)} credits / morning (only charged for
            leads actually returned)
          </p>
        </div>

        <div>
          <Label>Timezone (delivery window)</Label>
          <select
            className="saas-input mt-1.5 w-full"
            value={form.timezone}
            onChange={(e) =>
              setForm((f) => ({ ...f, timezone: e.target.value }))
            }
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            Sends around 7–9am local time when the morning job runs.
          </p>
        </div>
      </div>

      {form.lastRunAt || form.lastError ? (
        <p className="mt-4 text-[12px] text-ink-muted">
          {form.lastRunAt
            ? `Last run: ${new Date(form.lastRunAt).toLocaleString()}`
            : "Not run yet"}
          {form.lastError ? ` · ${form.lastError}` : ""}
        </p>
      ) : null}

      {msg ? (
        <p
          className={`mt-4 flex items-center gap-1.5 text-[13px] ${
            msg.type === "ok" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {msg.type === "ok" ? (
            <HiOutlineCheckCircle className="h-4 w-4" />
          ) : (
            <HiOutlineExclamationCircle className="h-4 w-4" />
          )}
          {msg.text}
        </p>
      ) : null}

      <div className="mt-5">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save daily digest"}
        </Button>
      </div>

      {deliveries.length > 0 ? (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Recent deliveries
          </p>
          <ul className="mt-2 divide-y divide-border">
            {deliveries.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]"
              >
                <span className="text-ink">
                  {d.leadCount} leads · {d.creditsCharged} credits ·{" "}
                  <span className="capitalize text-ink-muted">{d.emailStatus}</span>
                </span>
                <span className="text-[11px] text-ink-faint">
                  {new Date(d.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
