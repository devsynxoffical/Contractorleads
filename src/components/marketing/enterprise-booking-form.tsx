"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ENTERPRISE_BOOKING_TZ,
  formatSlotLabel,
} from "@/lib/enterprise-booking";

type Slot = { iso: string; label: string; dateKey: string };

function monthLabel(dateKey: string) {
  const [y, m] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: ENTERPRISE_BOOKING_TZ,
  }).format(new Date(Date.UTC(y, m - 1, 15)));
}

function dayChipLabel(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const noon = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: ENTERPRISE_BOOKING_TZ,
  }).format(noon);
  const day = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone: ENTERPRISE_BOOKING_TZ,
  }).format(noon);
  return { weekday, day: Number(day) };
}

export function EnterpriseBookingForm({ source = "pricing" }: { source?: string }) {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingDates, setLoadingDates] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ whenLabel: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/enterprise/slots")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: string[] = data.dates ?? [];
        setDates(list);
        if (list[0]) setSelectedDate(list[0]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDates(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSlots = useCallback(async (dateKey: string) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `/api/enterprise/slots?date=${encodeURIComponent(dateKey)}`,
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
      if (data.slots?.[0]?.iso) setSelectedSlot(data.slots[0].iso);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    void loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  const datesByMonth = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of dates) {
      const m = monthLabel(d);
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(d);
    }
    return [...map.entries()];
  }, [dates]);

  const selectedWhen =
    selectedSlot != null ? formatSlotLabel(selectedSlot) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please choose a date and time.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/enterprise/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company: company || undefined,
          phone: phone || undefined,
          message: message || undefined,
          scheduledAt: selectedSlot,
          timezone: ENTERPRISE_BOOKING_TZ,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setDone({ whenLabel: data.booking?.whenLabel ?? selectedWhen ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-[28px] border border-emerald-200 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <HiOutlineCheckCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-900">
          You&apos;re booked
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          Your Enterprise strategy call is set for{" "}
          <span className="font-semibold text-slate-900">{done.whenLabel}</span>.
          Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 px-6 py-8 sm:px-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[12px] font-semibold text-fuchsia-700 ring-1 ring-fuchsia-100">
          <HiOutlineSparkles className="h-3.5 w-3.5" />
          Enterprise plan
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[32px]">
          Book your strategy call
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
          Pick a time that works for you. We&apos;ll review volume, seats, white-label
          options, and custom integrations — usually 30 minutes.
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="space-y-5 border-b border-slate-100 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="space-y-1.5">
            <Label htmlFor="eb-name">Full name</Label>
            <Input
              id="eb-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eb-email">Work email</Label>
            <Input
              id="eb-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@agency.com"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="eb-company">Company</Label>
              <Input
                id="eb-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Agency name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eb-phone">Phone (optional)</Label>
              <Input
                id="eb-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eb-message">What should we prepare?</Label>
            <Textarea
              id="eb-message"
              className="min-h-[100px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Team size, monthly lead volume, white-label needs…"
            />
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
              <HiOutlineCalendarDays className="h-4 w-4 text-fuchsia-600" />
              Choose a date
              <span className="font-normal text-slate-500">· Eastern Time</span>
            </div>

            {loadingDates ? (
              <p className="text-sm text-slate-500">Loading calendar…</p>
            ) : (
              <div className="max-h-[280px] space-y-5 overflow-y-auto pr-1">
                {datesByMonth.map(([month, monthDates]) => (
                  <div key={month}>
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-slate-400">
                      {month}
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {monthDates.map((dateKey) => {
                        const { weekday, day } = dayChipLabel(dateKey);
                        const active = selectedDate === dateKey;
                        return (
                          <button
                            key={dateKey}
                            type="button"
                            onClick={() => setSelectedDate(dateKey)}
                            className={cn(
                              "flex min-h-[4.25rem] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition",
                              active
                                ? "border-fuchsia-500 bg-fuchsia-600 text-white shadow-md"
                                : "border-slate-200 bg-slate-50 text-slate-800 hover:border-fuchsia-200 hover:bg-fuchsia-50",
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wide",
                                active ? "text-white/80" : "text-slate-500",
                              )}
                            >
                              {weekday}
                            </span>
                            <span className="text-[20px] font-semibold leading-none">
                              {day}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
              <HiOutlineClock className="h-4 w-4 text-fuchsia-600" />
              Choose a time
            </div>
            {loadingSlots ? (
              <p className="text-sm text-slate-500">Loading times…</p>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                No open slots this day — pick another date.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => {
                  const active = selectedSlot === slot.iso;
                  return (
                    <button
                      key={slot.iso}
                      type="button"
                      onClick={() => setSelectedSlot(slot.iso)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-[14px] font-semibold transition",
                        active
                          ? "border-fuchsia-500 bg-fuchsia-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-800 hover:border-fuchsia-200 hover:bg-fuchsia-50",
                      )}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedWhen ? (
            <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/60 px-4 py-3 text-[13px] text-fuchsia-950">
              <span className="font-semibold">Selected:</span> {selectedWhen}
            </div>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            loading={busy}
            disabled={busy || !selectedSlot || !name.trim() || !email.trim()}
            className="h-12 w-full rounded-xl text-[15px] font-semibold text-white"
            style={{ background: LOGO_GRADIENT }}
          >
            Confirm booking
          </Button>
        </div>
      </div>
    </form>
  );
}
