"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineUser,
} from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

type RegisterFormProps = {
  onSwitchToLogin?: () => void;
};

function RegisterFormInner({ onSwitchToLogin }: RegisterFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);
    setDevLink(null);

    const form = new FormData(e.currentTarget);
    const phone = String(form.get("phone") || "").trim();
    if (!phone || phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    if (!form.get("terms")) {
      setError("Please agree to the Terms of Service");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    setSuccess(
      data.message ||
        "Check your business email for a verification link."
    );
    if (data.verifyUrl) setDevLink(data.verifyUrl);
    setLoading(false);
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-brand-500 sm:text-[32px] [text-shadow:0_0_28px_var(--brand-glow)]">
          Create Account
        </h1>
        <p className="mt-2 text-[15px] text-[#8b9aab]">
          Use your official business email. We will send a verification link
          before you set a password.{" "}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-brand-500 hover:underline"
            >
              Log in
            </button>
          ) : (
            <Link
              href="/login"
              className="font-semibold text-brand-500 hover:underline"
            >
              Log in
            </Link>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 border border-brand-500/25 bg-brand-500/08 text-sm font-medium text-white transition hover:bg-brand-500/15"
        >
          <FcGoogle className="h-5 w-5" />
          Google
        </button>
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 border border-brand-500/25 bg-brand-500/08 text-sm font-medium text-white transition hover:bg-brand-500/15"
        >
          <FaApple className="h-5 w-5" />
          Apple
        </button>
      </div>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-brand-500/20" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5c6b7c]">
          Or with business email
        </span>
        <div className="h-px flex-1 bg-brand-500/20" />
      </div>

      {success ? (
        <div className="space-y-3 border border-brand-500/25 bg-brand-500/08 p-4 text-sm text-[#c5d0dc]">
          <p className="font-semibold text-brand-500">Check your inbox</p>
          <p>{success}</p>
          {devLink && (
            <p className="text-[12px] text-[#8b9aab]">
              Dev mode (no email provider configured):{" "}
              <a
                href={devLink}
                className="font-semibold text-brand-500 break-all hover:underline"
              >
                Open verification link
              </a>
            </p>
          )}
          <Link
            href="/login"
            className="inline-block font-semibold text-brand-500 hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="reg-name"
              className="text-[13px] font-semibold text-[#8b9aab]"
            >
              Full Name
            </label>
            <div className="relative">
              <HiOutlineUser className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5c6b7c]" />
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                placeholder="Your full name"
                className="auth-field h-12 w-full rounded-xl pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reg-email"
              className="text-[13px] font-semibold text-[#8b9aab]"
            >
              Business Email
            </label>
            <div className="relative">
              <HiOutlineEnvelope className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5c6b7c]" />
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                placeholder="you@yourcompany.com"
                className="auth-field h-12 w-full rounded-xl pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
            <p className="text-[12px] text-[#5c6b7c]">
              Free inboxes (Gmail, Yahoo, Outlook, etc.) are not allowed.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reg-phone"
              className="text-[13px] font-semibold text-[#8b9aab]"
            >
              Phone Number <span className="text-brand-500">*</span>
            </label>
            <div className="relative">
              <HiOutlinePhone className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5c6b7c]" />
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                className="auth-field h-12 w-full rounded-xl pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-1 text-[13px] text-[#8b9aab]">
            <input
              type="checkbox"
              name="terms"
              className="mt-0.5 h-4 w-4 rounded border-brand-500/40 bg-transparent text-brand-500 focus:ring-brand-500"
            />
            <span>
              I agree to the{" "}
              <Link href="#" className="font-medium text-brand-500 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-medium text-brand-500 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="hud-btn-primary mt-2 h-12 w-full justify-center rounded-xl text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending verification…" : "Send verification email"}
          </button>
        </form>
      )}
    </>
  );
}

export function RegisterForm(props: RegisterFormProps) {
  return (
    <Suspense fallback={null}>
      <RegisterFormInner {...props} />
    </Suspense>
  );
}
