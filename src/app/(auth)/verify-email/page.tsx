"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { AuthMeshBackdrop } from "@/components/auth/auth-visual";
import { AuthSiteFooter, AuthSiteHeader } from "@/components/auth/auth-chrome";

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
  const [resendEmail, setResendEmail] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

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
        if (data.email) setResendEmail(data.email);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Invalid verification link"),
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

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    const target = resendEmail.trim().toLowerCase();
    if (!target) {
      setResendMsg("Enter the business email you signed up with.");
      return;
    }
    setResendBusy(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendMsg(data.error || "Could not resend email");
      } else {
        setResendMsg(data.message || "Check your inbox for a new link.");
      }
    } catch {
      setResendMsg("Could not resend email");
    } finally {
      setResendBusy(false);
    }
  }

  const fieldClass =
    "auth-field mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 text-sm text-slate-900 outline-none transition focus:border-fuchsia-300 focus:bg-[#ffffff] focus:ring-4 focus:ring-fuchsia-100";

  return (
    <div className="auth-page relative flex min-h-[100dvh] flex-col bg-[#ffffff]">
      <AuthSiteHeader mode="register" />
      <main className="relative flex flex-1 items-center justify-center px-4 py-14">
        <AuthMeshBackdrop variant="register" />
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-[#ffffff] shadow-[0_24px_60px_rgba(80,40,120,0.1)]">
          <div className="h-1.5 w-full" style={{ background: LOGO_GRADIENT }} />
          <div className="p-7 sm:p-8">
            <div className="mb-6 flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={32} height={32} className="rounded-full" />
              <span className="font-[family-name:var(--font-display)] text-[14px] font-semibold text-slate-900">
                Contractor <span className="gradient-text">Leads</span>
              </span>
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-fuchsia-600">
              Almost there
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-900">
              {checking ? "Checking link…" : "Set your password"}
            </h1>
            {email ? (
              <p className="mt-1.5 text-sm text-slate-500">
                {name ? `${name} · ` : ""}
                {email}
              </p>
            ) : null}

            {checking ? (
              <p className="mt-6 text-sm text-slate-500">Validating…</p>
            ) : error && !email ? (
              <div className="mt-6 space-y-4">
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
                  {error}
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <p className="text-[13px] text-slate-600">
                    Need a new link? Enter your business email and we&apos;ll
                    resend it.
                  </p>
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                    className={fieldClass}
                  />
                  {resendMsg ? (
                    <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
                      {resendMsg}
                    </p>
                  ) : null}
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl text-[14px] font-semibold text-white"
                    style={{ background: LOGO_GRADIENT }}
                    loading={resendBusy}
                  >
                    {resendBusy ? "Sending…" : "Resend verification email"}
                  </Button>
                </form>
                <Link
                  href="/register"
                  className="inline-block text-[13px] font-semibold text-fuchsia-600 hover:underline"
                >
                  Sign up again
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block text-[13px]">
                  <span className="font-semibold text-slate-700">Password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className={fieldClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="block text-[13px]">
                  <span className="font-semibold text-slate-700">Confirm password</span>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className={fieldClass}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
                {error ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(217,70,239,0.28)]"
                  style={{ background: LOGO_GRADIENT }}
                  loading={loading}
                >
                  {loading ? "Creating account…" : "Create account & continue"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
      <AuthSiteFooter />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page flex min-h-[100dvh] flex-col bg-[#ffffff]">
          <AuthSiteHeader mode="register" />
          <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
          <AuthSiteFooter />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
