"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const HUD_GRADIENT = "var(--logo-gradient)";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("Missing verification token");
      setChecking(false);
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Invalid link");
        setEmail(data.email);
        setName(data.name);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Invalid verification link")
      )
      .finally(() => setChecking(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(data.redirectTo || "/auth/splash");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.05) 1px, transparent 1px), radial-gradient(ellipse 70% 50% at 50% 40%, rgba(147,51,234,0.2), transparent 55%), linear-gradient(180deg, rgba(7,13,24,0.55) 0%, rgba(7,13,24,0.9) 100%), url(/hud-cover.png)",
          backgroundSize: "48px 48px, 48px 48px, auto, auto, cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
      <div className="hud-panel relative z-10 w-full max-w-md !p-0 overflow-hidden">
        <span className="hud-bracket hud-bracket-tl" aria-hidden />
        <span className="hud-bracket hud-bracket-tr" aria-hidden />
        <span className="hud-bracket hud-bracket-bl" aria-hidden />
        <span className="hud-bracket hud-bracket-br" aria-hidden />
        <div className="h-1.5 w-full" style={{ background: HUD_GRADIENT }} />
        <div className="p-7 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-500">
            Contractor Leads
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
            {checking ? "Checking link…" : "Set your password"}
          </h1>
          {email && (
            <p className="mt-1.5 text-sm text-[#8b9aab]">
              {name ? `${name} · ` : ""}
              {email}
            </p>
          )}

          {checking ? (
            <p className="mt-6 text-sm text-[#8b9aab]">Validating…</p>
          ) : error && !email ? (
            <div className="mt-6 space-y-3">
              <p className="border border-red-400/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
                {error}
              </p>
              <Link
                href="/register"
                className="inline-block text-[13px] font-semibold text-brand-500 hover:underline"
              >
                Sign up again
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <label className="block text-[12px]">
                <span className="font-medium text-[#8b9aab]">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="auth-field saas-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="block text-[12px]">
                <span className="font-medium text-[#8b9aab]">Confirm password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="auth-field saas-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
              {error && (
                <p className="border border-red-400/40 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">
                  {error}
                </p>
              )}
              <Button type="submit" className="hud-btn-primary w-full" loading={loading}>
                {loading ? "Creating account…" : "Create account & continue"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center text-sm text-[#8b9aab]">
          Loading…
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
