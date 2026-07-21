"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

type LoginFormProps = {
  onSwitchToRegister?: () => void;
};

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }

    router.push("/auth/splash");
    router.refresh();
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Sign in
        </h1>
        <p className="mt-2 text-[14px] text-slate-500">
          Don&apos;t have an account?{" "}
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-fuchsia-600 hover:text-fuchsia-700"
            >
              Create one free
            </button>
          ) : (
            <Link
              href="/register"
              className="font-semibold text-fuchsia-600 hover:text-fuchsia-700"
            >
              Create one free
            </Link>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="text-[13px] font-semibold text-slate-700"
          >
            Email
          </label>
          <div className="relative">
            <HiOutlineEnvelope className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@agency.com"
              className="auth-field h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-300 focus:bg-[#ffffff] focus:ring-4 focus:ring-fuchsia-100"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-[13px] font-semibold text-slate-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="auth-field h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-300 focus:bg-[#ffffff] focus:ring-4 focus:ring-fuchsia-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fuchsia-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <HiOutlineEyeSlash className="h-[18px] w-[18px]" />
              ) : (
                <HiOutlineEye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-12 w-full items-center justify-center rounded-xl text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(217,70,239,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          style={{ background: LOGO_GRADIENT }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}
