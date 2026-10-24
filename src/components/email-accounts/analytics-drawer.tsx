"use client";

import { useEffect, useState } from "react";
import {
  HiOutlineXMark,
  HiOutlineChartBar,
  HiOutlineHeart,
  HiOutlinePaperAirplane,
  HiOutlineFire,
  HiOutlineArrowTrendingUp,
} from "react-icons/hi2";

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [days, setDays] = useState<number>(7);

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

  if (!isOpen) return null;

  const chartData = stats?.chartData || [];
  const healthReport = stats?.healthReport || { healthScore: 98.3, status: "healthy" };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#141326] border-l border-[#26253c] p-6 shadow-2xl flex flex-col h-full overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#26253c]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <HiOutlineChartBar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Deliverability & Warmup Analytics
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{mailboxEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Days range toggle */}
        <div className="flex items-center justify-between my-5">
          <div className="text-xs font-semibold text-slate-300">Deliverability History</div>
          <div className="flex items-center gap-1 bg-[#1b1a32] p-1 rounded-lg border border-[#2b2a45]">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                days === 7
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                days === 30
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Key KPI Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-[#17162b] border border-[#26253c]">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <HiOutlineHeart className="w-3.5 h-3.5 text-rose-400" /> 7d Health Score
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {healthReport.healthScore}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Inbox Placement</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17162b] border border-[#26253c]">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <HiOutlineFire className="w-3.5 h-3.5 text-amber-400" /> Warmup Volume
            </div>
            <div className="text-xl font-bold text-indigo-300">
              {chartData.reduce((acc: number, c: any) => acc + (c.warmupSent || 0), 0)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Warmup Emails Sent</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#17162b] border border-[#26253c]">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <HiOutlinePaperAirplane className="w-3.5 h-3.5 text-cyan-400" /> Campaign Sends
            </div>
            <div className="text-xl font-bold text-slate-200">
              {chartData.reduce((acc: number, c: any) => acc + (c.campaignSent || 0), 0)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cold Leads Contacted</div>
          </div>
        </div>

        {/* Deliverability Bar Chart */}
        <div className="p-4 rounded-xl bg-[#17162b] border border-[#26253c] mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <HiOutlineArrowTrendingUp className="w-4 h-4 text-emerald-400" />
              Inbox vs Spam Placement Over Time
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Inbox
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Spam / Rescued
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              Loading deliverability history...
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-40 flex items-end gap-1.5 pt-4 border-b border-[#2b2a45]">
                {chartData.slice(-14).map((pt: any, idx: number) => {
                  const maxH = 25;
                  const inboxH = Math.min(100, (pt.inboxCount / maxH) * 100);
                  const spamH = Math.min(100, (pt.spamCount / maxH) * 100);

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col justify-end items-center h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-black/90 text-white text-[10px] py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap border border-slate-700">
                        <span>{pt.date}</span>
                        <span className="text-emerald-400">Inbox: {pt.inboxCount}</span>
                        <span className="text-rose-400">Spam: {pt.spamCount}</span>
                      </div>

                      {/* Bar columns */}
                      <div className="w-full max-w-[14px] flex flex-col justify-end h-full">
                        {spamH > 0 && (
                          <div
                            style={{ height: `${spamH}%` }}
                            className="w-full bg-rose-500/80 rounded-t"
                          />
                        )}
                        <div
                          style={{ height: `${Math.max(8, inboxH)}%` }}
                          className="w-full bg-emerald-500/80 rounded-t"
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1">
                        {pt.date.split("-").slice(1).join("/")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ramp-Up Schedule Roadmap */}
        <div className="p-4 rounded-xl bg-[#17162b] border border-[#26253c] space-y-3">
          <div className="text-xs font-bold text-white">4-Week Safe Ramp-Up Roadmap</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#141326] border border-[#201f35]">
              <span className="font-semibold text-slate-300">Days 1–7 (Start):</span>
              <span className="text-slate-400 font-mono">2–5 warmup/day · 0 campaign</span>
              <span className="text-emerald-400 font-medium">Completed</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#141326] border border-[#201f35]">
              <span className="font-semibold text-slate-300">Days 8–14 (Building):</span>
              <span className="text-slate-400 font-mono">15–25 warmup/day · 0 campaign</span>
              <span className="text-emerald-400 font-medium">Completed</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#141326] border border-[#201f35]">
              <span className="font-semibold text-slate-300">Days 15–21 (Early Outreach):</span>
              <span className="text-slate-400 font-mono">25–30 warmup/day · 10–15 campaign</span>
              <span className="text-indigo-400 font-medium">Active Stage</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#141326] border border-[#201f35]">
              <span className="font-semibold text-slate-300">Days 22+ (Full Scale):</span>
              <span className="text-slate-400 font-mono">20 maintenance · up to 35 campaign/day</span>
              <span className="text-slate-500 font-medium">Next</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#26253c] mt-auto flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
