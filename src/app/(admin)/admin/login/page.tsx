"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
} from "react-icons/hi2";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push(data.redirectTo || "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell--hud relative flex min-h-[100dvh] items-center justify-center px-4">
      <div className="hud-viewport-bg pointer-events-none absolute inset-0" />
      <div className="hud-panel relative z-[1] w-full max-w-md !p-0 overflow-hidden">
        <span className="hud-bracket hud-bracket-tl" aria-hidden />
        <span className="hud-bracket hud-bracket-tr" aria-hidden />
        <span className="hud-bracket hud-bracket-bl" aria-hidden />
        <span className="hud-bracket hud-bracket-br" aria-hidden />

        <div className="border-b border-brand-500/15 px-7 py-5 sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-500">
            Admin portal
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white">
            Control Panel sign in
          </h1>
          <p className="mt-1.5 text-sm text-[#8b9aab]">
            For Super Admin, Manager, and Sub Admin staff. Agencies use the
            regular login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-7 py-6 sm:px-8">
          <label className="block text-[12px]">
            <span className="font-medium text-[#8b9aab]">Email</span>
            <div className="relative mt-1">
              <HiOutlineEnvelope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6b7c]" />
              <input
                type="email"
                required
                autoComplete="username"
                className="saas-input w-full !pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@leadflow.us"
              />
            </div>
          </label>
          <label className="block text-[12px]">
            <span className="font-medium text-[#8b9aab]">Password</span>
            <div className="relative mt-1">
              <HiOutlineLockClosed className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c6b7c]" />
              <input
                type="password"
                required
                autoComplete="current-password"
                className="saas-input w-full !pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </label>

          {error && (
            <p className="rounded-lg border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 px-3 py-2 text-[13px] text-[#ff4d6d]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="hud-btn-primary mt-1 w-full justify-center disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in to admin"}
          </button>
        </form>

        <p className="border-t border-brand-500/10 px-7 py-4 text-center text-[12px] text-[#5c6b7c] sm:px-8">
          Agency account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-500 hover:underline"
          >
            Use agency login
          </Link>
        </p>
      </div>
    </div>
  );
}
