"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineXMark,
  HiOutlineChartBar,
  HiOutlineHeart,
  HiOutlinePaperAirplane,
  HiOutlineFire,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";

type ChartPoint = {
  date: string;
  warmupSent: number;
  warmupReceived: number;
  campaignSent: number;
  failed: number;
  bounced: number;
};

export type AnalyticsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  mailboxEmail: string;
};

export function AnalyticsDrawer({
  isOpen,
  onClose,
  mailboxEmail,
}: AnalyticsDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [days, setDays] = useState<number>(7);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !mailboxEmail) return;
    setLoading(true);
    fetch(`/api/email-accounts/stats?email=${encodeURIComponent(mailboxEmail)}&days=${days}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStats(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, mailboxEmail, days]);

  if (!isOpen || !mounted) return null;

  const chartData = stats?.chartData || [];
  const healthReport = stats?.healthReport || { healthScore: null, known: false, attempts: 0, ok: 0, failed: 0, bounced: 0 };
  const ramp = stats?.ramp || null;
  const lastSend = stats?.lastSend || null;
  const lastSendFailing =
    Boolean(lastSend?.errorAt) &&
    (lastSend?.consecutiveFailures ?? 0) > 0 &&
    (!lastSend?.okAt || new Date(lastSend.errorAt) > new Date(lastSend.okAt));
  const maxBar = Math.max(1, ...(chartData as ChartPoint[]).map((p) => (p.warmupSent || 0) + (p.campaignSent || 0) + (p.failed || 0) + (p.bounced || 0)));

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex justify-end bg-black/50 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#141326] border-l border-slate-200 dark:border-[#26253c] p-6 shadow-2xl flex flex-col h-full overflow-y-auto text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#26253c]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400">
              <HiOutlineChartBar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Deliverability & Warmup Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{mailboxEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Days range toggle */}
        <div className="flex items-center justify-between my-5">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deliverability History</div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1b1a32] p-1 rounded-lg border border-slate-200 dark:border-[#2b2a45]">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                days === 7
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                days === 30
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {lastSendFailing && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <div className="font-bold">This mailbox cannot send right now</div>
            <div className="mt-0.5">{lastSend?.error || "The last send attempt failed."}</div>
            <div className="mt-1 text-[11px] opacity-80">
              {lastSend?.consecutiveFailures} failed attempt(s) in a row · last at{" "}
              {lastSend?.errorAt ? new Date(lastSend.errorAt).toLocaleString() : "—"}
            </div>
          </div>
        )}

        {/* Key KPI Cards (all from logged sends) */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#17162b] border border-slate-200 dark:border-[#26253c]">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <HiOutlineHeart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" /> 7-day health
            </div>
            <div
              className={`text-xl font-bold ${
                healthReport.healthScore == null
                  ? "text-slate-400"
                  : healthReport.healthScore >= 90
                  ? "text-emerald-600 dark:text-emerald-400"
                  : healthReport.healthScore >= 80
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {loading ? "…" : healthReport.healthScore == null ? "—" : `${healthReport.healthScore}%`}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {healthReport.healthScore == null
                ? "No sends in the last 7 days"
                : `${healthReport.ok} sent of ${healthReport.attempts} attempts`}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#17162b] border border-slate-200 dark:border-[#26253c]">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <HiOutlineFire className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Warmup sent
            </div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-300">
              {chartData.reduce((acc: number, c: ChartPoint) => acc + (c.warmupSent || 0), 0)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {chartData.reduce((acc: number, c: ChartPoint) => acc + (c.warmupReceived || 0), 0)} received · last {days} days
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#17162b] border border-slate-200 dark:border-[#26253c]">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <HiOutlinePaperAirplane className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" /> Campaign sends
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
              {chartData.reduce((acc: number, c: ChartPoint) => acc + (c.campaignSent || 0), 0)}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {chartData.reduce((acc: number, c: ChartPoint) => acc + (c.failed || 0) + (c.bounced || 0), 0)} failed or bounced
            </div>
          </div>
        </div>

        {/* Daily sends chart */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#17162b] border border-slate-200 dark:border-[#26253c] mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <HiOutlineArrowTrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Sends per day
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Warmup
              </span>
              <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Campaign
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Failed / bounced
              </span>
            </div>
          </div>
          {loading ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
              Loading history…
            </div>
          ) : (chartData as ChartPoint[]).every((p) => !p.warmupSent && !p.campaignSent && !p.failed && !p.bounced) ? (
            <div className="h-44 flex items-center justify-center text-center text-xs text-slate-500 dark:text-slate-400">
              No sends from this mailbox in the last {days} days.
            </div>
          ) : (
            <div className="h-40 flex items-end gap-1 pt-4 border-b border-slate-200 dark:border-[#2b2a45]">
              {(chartData as ChartPoint[]).slice(-14).map((pt) => {
                const seg = (n: number) => `${(n / maxBar) * 100}%`;
                const bad = (pt.failed || 0) + (pt.bounced || 0);
                return (
                  <div key={pt.date} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                    <div className="pointer-events-none absolute -top-12 z-10 hidden flex-col items-center whitespace-nowrap rounded border border-slate-700 bg-black/90 px-2 py-1 text-[10px] text-white group-hover:flex">
                      <span>{pt.date}</span>
                      <span className="text-indigo-300">Warmup: {pt.warmupSent}</span>
                      <span className="text-cyan-300">Campaign: {pt.campaignSent}</span>
                      <span className="text-rose-300">Failed / bounced: {bad}</span>
                    </div>
                    <div className="flex h-full w-full max-w-[14px] flex-col justify-end">
                      {bad > 0 && <div style={{ height: seg(bad) }} className="w-full rounded-t bg-rose-500/80" />}
                      {pt.campaignSent > 0 && <div style={{ height: seg(pt.campaignSent) }} className="w-full bg-cyan-500/80" />}
                      {pt.warmupSent > 0 && <div style={{ height: seg(pt.warmupSent) }} className="w-full rounded-b bg-indigo-500/80" />}
                    </div>
                    <span className="mt-1 text-[9px] text-slate-500">{pt.date.split("-").slice(1).join("/")}</span>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
            Inbox-vs-spam placement is not measured, so health is based on delivery: successful sends out of all attempts, bounces counted as failures.
          </p>
        </div>

        {/* Ramp-up from this mailbox's own settings */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#17162b] border border-slate-200 dark:border-[#26253c] space-y-3">
          <div className="text-xs font-bold text-slate-900 dark:text-white">Warmup ramp-up</div>
          {!ramp ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Warmup has not run for this mailbox yet. The schedule starts on its first warmup send.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-[#201f35] dark:bg-[#141326]">
                  <div className="text-[10px] text-slate-500">Day</div>
                  <div className="font-bold text-slate-900 dark:text-white">{ramp.dayNumber}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-[#201f35] dark:bg-[#141326]">
                  <div className="text-[10px] text-slate-500">Warmup target today</div>
                  <div className="font-bold text-slate-900 dark:text-white">{ramp.warmupTarget} / day</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-[#201f35] dark:bg-[#141326]">
                  <div className="text-[10px] text-slate-500">Stage</div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {!ramp.enabled
                      ? "Warmup paused"
                      : ramp.status === "warming"
                      ? "Warming (no campaigns)"
                      : ramp.status === "ready_limited"
                      ? "Early outreach"
                      : "Full scale"}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  { from: 1, to: 14, label: "Days 1–14", note: "warmup only, no campaign sends" },
                  { from: 15, to: 21, label: "Days 15–21", note: "up to 15 campaign sends / day" },
                  { from: 22, to: Infinity, label: "Day 22+", note: "up to 35 campaign sends / day" },
                ].map((st) => {
                  const state = ramp.dayNumber > st.to ? "Done" : ramp.dayNumber >= st.from ? "Current" : "Next";
                  return (
                    <div
                      key={st.label}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-[#201f35] dark:bg-[#141326]"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{st.label}</span>
                      <span className="flex-1 text-slate-500 dark:text-slate-400">{st.note}</span>
                      <span
                        className={
                          state === "Done"
                            ? "font-medium text-emerald-600 dark:text-emerald-400"
                            : state === "Current"
                            ? "font-medium text-indigo-600 dark:text-indigo-400"
                            : "font-medium text-slate-400"
                        }
                      >
                        {state}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                Warmup volume: starts at {ramp.startVolume}/day, +{ramp.dailyIncrement} per day, up to {ramp.maxDailyWarmup}/day. Change it in Warmup Settings.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#26253c] mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
