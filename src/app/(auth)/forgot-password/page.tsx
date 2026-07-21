"use client";

import { useState } from "react";
import Link from "next/link";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setMsg(data.message || "Check your email for a reset link.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f0ea] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_rgba(26,18,36,0.08)]">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ background: LOGO_GRADIENT, WebkitBackgroundClip: "text", color: "transparent" }}
        >
          Contractor Leads
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-900">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your business email and we’ll send a secure reset link (expires in 1 hour).
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-[13px] font-semibold text-slate-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100"
              placeholder="you@agency.com"
            />
          </label>
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
          )}
          {msg && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{msg}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: LOGO_GRADIENT }}
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          <Link href="/login" className="font-semibold text-fuchsia-700 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
