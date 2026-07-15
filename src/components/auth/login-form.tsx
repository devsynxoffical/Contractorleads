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
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

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

    router.push("/home");
    router.refresh();
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#111827] sm:text-[32px]">
          Sign In
        </h1>
        <p className="mt-2 text-[15px] text-[#6b7280]">
          Don&apos;t have an account?{" "}
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold text-[#7c3aed] hover:underline"
            >
              Sign up
            </button>
          ) : (
            <Link
              href="/register"
              className="font-semibold text-[#7c3aed] hover:underline"
            >
              Sign up
            </Link>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f3f4f6] text-sm font-medium text-[#111827] transition hover:bg-[#e5e7eb]"
        >
          <FcGoogle className="h-5 w-5" />
          Google
        </button>
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#f3f4f6] text-sm font-medium text-[#111827] transition hover:bg-[#e5e7eb]"
        >
          <FaApple className="h-5 w-5" />
          Apple
        </button>
      </div>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e5e7eb]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
          Or with email
        </span>
        <div className="h-px flex-1 bg-[#e5e7eb]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="text-[13px] font-semibold text-[#374151]"
          >
            Email Address
          </label>
          <div className="relative">
            <HiOutlineEnvelope className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9ca3af]" />
            <input
              id="login-email"
              name="email"
              type="email"
              required
              placeholder="name@company.com"
              className="auth-field h-12 w-full rounded-xl bg-[#f3f4f6] pl-11 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/25"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-[13px] font-semibold text-[#374151]"
            >
              Password
            </label>
            <button
              type="button"
              className="text-xs font-medium text-[#7c3aed] hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <HiOutlineLockClosed className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9ca3af]" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="auth-field h-12 w-full rounded-xl bg-[#f3f4f6] pl-11 pr-11 text-sm text-[#111827] outline-none transition placeholder:text-[#9ca3af] focus:bg-white focus:ring-2 focus:ring-[#7c3aed]/25"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            background:
              "linear-gradient(90deg, #7c3aed 0%, #c026d3 50%, #db2777 100%)",
          }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </>
  );
}
