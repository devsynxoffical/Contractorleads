"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatSlotLabel } from "@/lib/enterprise-booking";

type Visitor = {
  id: string;
  visitorKey: string;
  email: string | null;
  emailOptIn: boolean;
  source: string | null;
  landingPath: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  visitCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  convertedUserId: string | null;
  convertedAt: string | null;
};

type EnterpriseBooking = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  scheduledAt: string;
  timezone: string;
  status: string;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  adminNotes: string | null;
  createdAt: string;
};

type Tab = "visitors" | "enterprise";

const BOOKING_STATUSES = [
  "new",
  "confirmed",
  "contacted",
  "completed",
  "cancelled",
] as const;

export default function AdminSiteLeadsPage() {
  const [tab, setTab] = useState<Tab>("enterprise");

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<{
    withEmail: number;
    optedIn: number;
    converted: number;
    anonymous: number;
  } | null>(null);
  const [total, setTotal] = useState(0);
  const [emailsOnly, setEmailsOnly] = useState(true);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [exportBusy, setExportBusy] = useState(false);

  const [bookings, setBookings] = useState<EnterpriseBooking[]>([]);
  const [bookingStats, setBookingStats] = useState<{
    total: number;
    upcoming: number;
  } | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("hello@contractorleads.us");
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [configBusy, setConfigBusy] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadVisitors = useCallback(async () => {
    setLoadingVisitors(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/marketing-visitors?emailsOnly=${emailsOnly ? "1" : "0"}&limit=200`,
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load site leads");
        setVisitors([]);
        setStats(null);
        return;
      }
      setVisitors(data.visitors ?? []);
      setStats(data.stats ?? null);
      setTotal(data.total ?? 0);
    } catch {
      setError("Network error loading site leads");
    } finally {
      setLoadingVisitors(false);
    }
  }, [emailsOnly]);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/enterprise-bookings");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load enterprise bookings");
        setBookings([]);
        return;
      }
      setBookings(data.bookings ?? []);
      setBookingStats(data.stats ?? null);
      if (data.config) {
        setNotifyEmail(data.config.notifyEmail ?? "hello@contractorleads.us");
        setBookingEnabled(data.config.enabled !== false);
      }
    } catch {
      setError("Network error loading enterprise bookings");
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "visitors") void loadVisitors();
  }, [tab, loadVisitors]);

  useEffect(() => {
    if (tab === "enterprise") void loadBookings();
  }, [tab, loadBookings]);

  async function downloadCsv() {
    setExportBusy(true);
    try {
      const res = await fetch("/api/admin/marketing-visitors/export?format=csv");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "site-marketing-leads.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportBusy(false);
    }
  }

  async function saveConfig() {
    setConfigBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/enterprise-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail,
          enabled: bookingEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setConfigBusy(false);
    }
  }

  async function updateBooking(
    id: string,
    patch: { status?: string; adminNotes?: string },
  ) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/enterprise-bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: data.booking?.status ?? b.status,
                adminNotes: data.booking?.adminNotes ?? b.adminNotes,
              }
            : b,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Site leads"
        description="Marketing visitors and Enterprise plan call bookings from the public site."
        actions={
          tab === "visitors" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void loadVisitors()}
                disabled={loadingVisitors}
              >
                Refresh
              </Button>
              <Button
                variant="secondary"
                loading={exportBusy}
                disabled={exportBusy}
                onClick={() => void downloadCsv()}
              >
                Export emails CSV
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => void loadBookings()}
              disabled={loadingBookings}
            >
              Refresh
            </Button>
          )
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("enterprise")}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
            tab === "enterprise"
              ? "bg-brand-600 text-white"
              : "border border-border bg-[var(--surface)] text-ink-muted hover:text-ink"
          }`}
        >
          Enterprise bookings
        </button>
        <button
          type="button"
          onClick={() => setTab("visitors")}
          className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
            tab === "visitors"
              ? "bg-brand-600 text-white"
              : "border border-border bg-[var(--surface)] text-ink-muted hover:text-ink"
          }`}
        >
          Marketing visitors
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          {error}
        </p>
      ) : null}

      {tab === "enterprise" ? (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Total bookings", bookingStats?.total],
              ["Upcoming calls", bookingStats?.upcoming],
              ["Booking form", bookingEnabled ? "Open" : "Paused"],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-border/80 bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {loadingBookings ? "—" : (value ?? 0)}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-5 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <p className="text-[14px] font-semibold text-ink">Booking settings</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
              Confirmation emails go to the prospect; internal alerts go to the notify
              address below.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="notify-email">Notify email</Label>
                <Input
                  id="notify-email"
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-[13px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={bookingEnabled}
                  onChange={(e) => setBookingEnabled(e.target.checked)}
                />
                Accept new bookings
              </label>
            </div>
            <Button
              className="mt-4"
              size="sm"
              loading={configBusy}
              onClick={() => void saveConfig()}
            >
              Save settings
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-[13px]">
                <thead className="border-b border-border/70 bg-slate-50/80 text-[11px] uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-3 py-3 font-semibold">Call time</th>
                    <th className="px-3 py-3 font-semibold">Details</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {bookings.map((b) => (
                    <tr key={b.id} className="align-top hover:bg-brand-50/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{b.name}</p>
                        <a
                          href={`mailto:${b.email}`}
                          className="text-brand-700 hover:underline"
                        >
                          {b.email}
                        </a>
                        {b.phone ? (
                          <p className="mt-0.5 text-ink-muted">{b.phone}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-ink-muted">
                        <p className="font-medium text-ink">
                          {formatSlotLabel(b.scheduledAt)}
                        </p>
                        <p className="mt-0.5 text-[11px]">
                          Booked {new Date(b.createdAt).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">
                        {b.company ? (
                          <p>
                            <span className="text-ink-faint">Co.</span> {b.company}
                          </p>
                        ) : null}
                        {b.source ? (
                          <p>
                            <span className="text-ink-faint">Source</span> {b.source}
                          </p>
                        ) : null}
                        {b.message ? (
                          <p className="mt-1 max-w-xs whitespace-pre-wrap text-[12px]">
                            {b.message}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          className="saas-input text-[12px]"
                          value={b.status}
                          disabled={savingId === b.id}
                          onChange={(e) =>
                            void updateBooking(b.id, { status: e.target.value })
                          }
                        >
                          {BOOKING_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          className="saas-input min-h-[72px] w-full min-w-[180px] text-[12px]"
                          defaultValue={b.adminNotes ?? ""}
                          placeholder="Internal notes…"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (b.adminNotes ?? "")) {
                              void updateBooking(b.id, { adminNotes: v });
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {!loadingBookings && bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                        No Enterprise bookings yet. Share{" "}
                        <a
                          href="/enterprise/book"
                          className="font-medium text-brand-700 hover:underline"
                        >
                          /enterprise/book
                        </a>{" "}
                        from pricing.
                      </td>
                    </tr>
                  ) : null}
                  {loadingBookings ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                        Loading…
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            {[
              ["With email", stats?.withEmail],
              ["Opted in", stats?.optedIn],
              ["Converted", stats?.converted],
              ["Anonymous visits", stats?.anonymous],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-border/80 bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-card)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {loadingVisitors ? "—" : (value ?? 0)}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-[13px]">
            <label className="inline-flex items-center gap-2 text-ink-muted">
              <input
                type="checkbox"
                checked={emailsOnly}
                onChange={(e) => setEmailsOnly(e.target.checked)}
                className="rounded border-border"
              />
              Emails only
            </label>
            <span className="text-ink-faint">{total} shown</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead className="border-b border-border/70 bg-slate-50/80 text-[11px] uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-3 py-3 font-semibold">Source</th>
                    <th className="px-3 py-3 font-semibold">UTM</th>
                    <th className="px-3 py-3 font-semibold">Visits</th>
                    <th className="px-3 py-3 font-semibold">Last seen</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {visitors.map((v) => (
                    <tr key={v.id} className="hover:bg-brand-50/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{v.email ?? "—"}</p>
                        <p className="text-[12px] text-ink-muted">
                          {v.landingPath ?? "/"} · cookie {v.visitorKey}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{v.source ?? "—"}</td>
                      <td className="px-3 py-3 text-ink-muted">
                        {[v.utmSource, v.utmMedium, v.utmCampaign]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </td>
                      <td className="px-3 py-3 text-ink">{v.visitCount}</td>
                      <td className="px-3 py-3 text-ink-muted">
                        {new Date(v.lastSeenAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        {v.convertedUserId ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Converted
                          </span>
                        ) : v.emailOptIn && v.email ? (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                            Opted in
                          </span>
                        ) : v.email ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Email
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            Visit only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loadingVisitors && visitors.length === 0 && !error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                        No site leads yet.
                      </td>
                    </tr>
                  ) : null}
                  {loadingVisitors ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                        Loading…
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
