"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineXMark,
  HiOutlineEnvelope,
  HiOutlineDocumentArrowUp,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiOutlineArrowPath,
} from "react-icons/hi2";

export type AddAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => Promise<void>;
};

export function AddAccountModal({
  isOpen,
  onClose,
  onAccountAdded,
}: AddAccountModalProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"smtp" | "google" | "microsoft" | "csv">("smtp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // Form state
  const [email, setEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [password, setPassword] = useState("");
  const [host, setHost] = useState("smtp.hostinger.com");
  const [port, setPort] = useState(465);
  const [provider, setProvider] = useState("hostinger");
  const [dailyLimit, setDailyLimit] = useState(30);

  // CSV State
  const [csvContent, setCsvContent] = useState("");

  if (!isOpen || !mounted) return null;

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/email-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          senderName,
          password,
          host,
          port,
          provider,
          dailyLimit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add account");
      }

      setSuccess("Account successfully verified and connected via Hostinger gateway!");
      await onAccountAdded();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleCsvSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csvContent.trim()) {
      setError("Please paste CSV data with header: email,password,host,port,name");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    const lines = csvContent.trim().split("\n");
    let imported = 0;
    let failed = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || (i === 0 && line.toLowerCase().includes("email"))) continue; // skip header

      const parts = line.split(",").map((p) => p.trim());
      const mEmail = parts[0];
      const mPass = parts[1];
      const mHost = parts[2] || "smtp.hostinger.com";
      const mPort = parseInt(parts[3] || "465", 10);
      const mName = parts[4] || mEmail.split("@")[0];

      if (!mEmail || !mPass) continue;

      try {
        const res = await fetch("/api/email-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: mEmail,
            senderName: mName,
            password: mPass,
            host: mHost,
            port: mPort,
            provider: "custom",
            dailyLimit: 30,
          }),
        });
        if (res.ok) imported++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setSuccess(`Bulk import finished: ${imported} accounts connected, ${failed} failed.`);
    await onAccountAdded();
    setLoading(false);
    if (imported > 0) {
      setTimeout(() => onClose(), 2000);
    }
  }

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141326] border border-[#26253c] rounded-2xl p-6 shadow-2xl flex flex-col text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#26253c]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HiOutlineEnvelope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Connect Email Account</h2>
              <p className="text-xs text-slate-400">
                Validated via Hostinger mail gateway to ensure deliverability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#1b1a32] rounded-xl border border-[#2b2a45] my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab("smtp");
              setHost("smtp.hostinger.com");
              setPort(465);
              setProvider("hostinger");
            }}
            className={`py-1.5 rounded-lg transition ${
              tab === "smtp" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Hostinger / SMTP
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("google");
              setHost("smtp.gmail.com");
              setPort(465);
              setProvider("google");
            }}
            className={`py-1.5 rounded-lg transition ${
              tab === "google" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Google Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("microsoft");
              setHost("smtp.office365.com");
              setPort(587);
              setProvider("microsoft");
            }}
            className={`py-1.5 rounded-lg transition ${
              tab === "microsoft" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Microsoft 365
          </button>
          <button
            type="button"
            onClick={() => setTab("csv")}
            className={`py-1.5 rounded-lg transition ${
              tab === "csv" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Bulk CSV
          </button>
        </div>

        {/* Alert Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <HiOutlineExclamationCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <HiOutlineCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Single Account Form */}
        {tab !== "csv" ? (
          <form onSubmit={handleSingleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jennifer.jackson@yourdomain.com"
                className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white focus:outline-hidden focus:border-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sender Name</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Jennifer Jackson"
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white focus:outline-hidden focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Daily Campaign Limit
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white focus:outline-hidden focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Password / App Password <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "google" ? "Google 16-character App Password" : "••••••••••••"}
                className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white focus:outline-hidden focus:border-indigo-500 transition"
              />
              {tab === "google" && (
                <p className="text-[11px] text-slate-400 mt-1">
                  For Google Workspace, generate an <strong>App Password</strong> under Google Account → Security → 2-Step Verification.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white focus:outline-hidden focus:border-indigo-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Port</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white focus:outline-hidden focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#26253c] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition disabled:opacity-50"
              >
                {loading && <HiOutlineArrowPath className="w-4 h-4 animate-spin" />}
                {loading ? "Verifying via Relay..." : "Connect & Verify Account"}
              </button>
            </div>
          </form>
        ) : (
          /* Bulk CSV Import Form */
          <form onSubmit={handleCsvSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Paste CSV Mailboxes List
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Format: <code className="text-indigo-300">email,password,host,port,name</code>
              </p>
              <textarea
                rows={7}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={`jennifer@mydomain.com,MyPass123!,smtp.hostinger.com,465,Jennifer Jackson\nmichael@mydomain.com,MyPass123!,smtp.hostinger.com,465,Michael Smith`}
                className="w-full p-3 rounded-xl bg-[#0f0e1e] border border-[#2b2a45] text-white font-mono text-xs focus:outline-hidden focus:border-indigo-500 transition"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#17162b] border border-[#26253c] text-[11px] text-slate-300">
              Each mailbox will be automatically tested, stored on the Hostinger mail gateway, and have its domain DNS verified.
            </div>

            <div className="pt-3 border-t border-[#26253c] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white transition disabled:opacity-50"
              >
                <HiOutlineDocumentArrowUp className="w-4 h-4" />
                {loading ? "Importing & Verifying..." : "Import All Mailboxes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
