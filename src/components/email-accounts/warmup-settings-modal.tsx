"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineXMark,
  HiOutlineFire,
  HiOutlineCheck,
  HiOutlineBolt,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

export type WarmupSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mailbox: any;
  onSettingsSaved: () => Promise<void>;
};

export function WarmupSettingsModal({
  isOpen,
  onClose,
  mailbox,
  onSettingsSaved,
}: WarmupSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(mailbox?.warmupEnabled ?? true);
  const [startVolume, setStartVolume] = useState(3);
  const [increment, setIncrement] = useState(2);
  const [maxPerDay, setMaxPerDay] = useState(25);
  const [replyRate, setReplyRate] = useState(35);
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

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

  if (!isOpen || !mailbox || !mounted) return null;

  async function handleRunTest() {
    setTesting(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await fetch("/api/email-accounts/test-warmup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxEmail: mailbox.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to trigger warmup test");
      }
      setTestResult(data.details);
      await onSettingsSaved();
    } catch (err: any) {
      setTestError(err.message || "Failed to execute warmup test");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch("/api/email-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxIds: [mailbox.id],
          action: enabled ? "warmup_on" : "warmup_off",
        }),
      });

      await onSettingsSaved();
      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#141326] border border-slate-200 dark:border-[#26253c] rounded-2xl p-6 shadow-2xl flex flex-col text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#26253c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400">
              <HiOutlineFire className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Warmup Settings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{mailbox.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 my-4 text-xs">
          {/* Main Enable Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1b1a32] border border-slate-200 dark:border-[#2b2a45]">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">Enable Automated Warmup</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Exchanges peer-to-peer warmup emails across the 65 mailbox pool
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Start Volume / Day</label>
              <input
                type="number"
                min="1"
                max="10"
                value={startVolume}
                onChange={(e) => setStartVolume(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0f0e1e] border border-slate-200 dark:border-[#2b2a45] text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Daily Increment</label>
              <input
                type="number"
                min="1"
                max="5"
                value={increment}
                onChange={(e) => setIncrement(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0f0e1e] border border-slate-200 dark:border-[#2b2a45] text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Max Warmup Emails / Day</label>
              <input
                type="number"
                min="10"
                max="50"
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0f0e1e] border border-slate-200 dark:border-[#2b2a45] text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Target Reply Rate %</label>
              <input
                type="number"
                min="10"
                max="50"
                value={replyRate}
                onChange={(e) => setReplyRate(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0f0e1e] border border-slate-200 dark:border-[#2b2a45] text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="weekdays"
              checked={weekdaysOnly}
              onChange={(e) => setWeekdaysOnly(e.target.checked)}
              className="rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0"
            />
            <label htmlFor="weekdays" className="text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              Send on weekdays only (recommended for B2B reputation)
            </label>
          </div>

          {/* LIVE VERIFICATION TEST BOX */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/20 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <HiOutlineBolt className="w-4 h-4 text-amber-500" />
                  Live Warmup Verification
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Send a live test warmup email right now to verify peer dispatch & delivery.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunTest}
                disabled={testing}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs cursor-pointer shrink-0"
              >
                {testing ? (
                  <>
                    <HiOutlineArrowPath className="w-3.5 h-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <HiOutlineBolt className="w-3.5 h-3.5" />
                    Send Test Now
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Verified! Warmup email dispatched via Hostinger relay (200 OK)</span>
                </div>
                <div className="pl-5 text-[11px] text-emerald-700 dark:text-emerald-300 font-mono space-y-0.5">
                  <div><span className="font-semibold text-emerald-900 dark:text-emerald-100">From:</span> {testResult.from}</div>
                  <div><span className="font-semibold text-emerald-900 dark:text-emerald-100">To:</span> {testResult.to}</div>
                  <div><span className="font-semibold text-emerald-900 dark:text-emerald-100">Subject:</span> {testResult.subject}</div>
                  <div className="text-[10px] opacity-80">Message ID: {testResult.messageId}</div>
                </div>
              </div>
            )}

            {testError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-1.5">
                <HiOutlineExclamationTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{testError}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#26253c] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition disabled:opacity-50 shadow-sm"
            >
              <HiOutlineCheck className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
