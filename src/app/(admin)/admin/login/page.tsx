"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

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
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f1f7] px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-border/80 bg-white shadow-[var(--shadow-elevated)]">
        <div className="h-1.5 w-full" style={{ background: LOGO_GRADIENT }} />
        <div className="p-7 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            Super Admin
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink">
            Admin portal sign in
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Separate from agency login. Only SUPER_ADMIN accounts can enter.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                className="saas-input mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@leadflow.us"
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-medium text-ink-muted">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="saas-input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in to admin"}
            </Button>
          </form>

          <p className="mt-5 text-center text-[12px] text-ink-faint">
            Agency account?{" "}
            <Link href="/login" className="font-semibold text-brand-600 hover:underline">
              Use agency login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
