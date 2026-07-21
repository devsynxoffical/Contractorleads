"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok }) => setValid(ok))
      .catch(() => setValid(false));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not reset password");
      return;
    }
    setMsg(data.message || "Password updated");
    window.setTimeout(() => router.push("/login"), 1200);
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
          Set a new password
        </h1>

        {valid === false && (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
            This reset link is invalid or expired.{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              Request a new one
            </Link>
            .
          </p>
        )}

        {valid && (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-[13px] font-semibold text-slate-700">
              New password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100"
              />
            </label>
            <label className="block text-[13px] font-semibold text-slate-700">
              Confirm password
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3 text-sm outline-none focus:border-fuchsia-300 focus:ring-4 focus:ring-fuchsia-100"
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
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
