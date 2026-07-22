"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineUser,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

type RegisterFormProps = {
  onSwitchToLogin?: () => void;
};

function RegisterFormInner({ onSwitchToLogin }: RegisterFormProps) {
  const searchParams = useSearchParams();
  const referralCode = (searchParams.get("ref") || "").trim().toUpperCase();
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
        referralCode: referralCode || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    setSuccess(
      data.message || "Check your business email for a verification link.",
    );
    if (data.verifyUrl) setDevLink(data.verifyUrl);
    setLoading(false);
  }

  const fieldClass =
    "auth-field h-12 w-full rounded-xl border border-slate-200 bg-[#f8fafc] pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-300 focus:bg-[#ffffff] focus:ring-4 focus:ring-fuchsia-100";

  return (
    <>
      <div className="mb-7">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[30px]">
          Create account
        </h1>
        <p className="mt-2 text-[14px] text-slate-500">
          Business email required. Already have an account?{" "}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-fuchsia-600 hover:text-fuchsia-700"
            >
              Sign in
            </button>
          ) : (
            <Link
              href="/login"
              className="font-semibold text-fuchsia-600 hover:text-fuchsia-700"
            >
              Sign in
            </Link>
          )}
        </p>
        {referralCode ? (
          <p className="mt-3 inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
            Referred by code {referralCode}
          </p>
        ) : null}
      </div>

      {success ? (
        <div className="space-y-3 rounded-2xl border border-fuchsia-100 bg-fuchsia-50/60 p-4 text-sm text-slate-600">
          <p className="font-semibold text-fuchsia-700">Check your inbox</p>
          <p>{success}</p>
          {devLink ? (
            <p className="text-[12px] text-slate-500">
              Dev mode (no email provider configured):{" "}
              <a
                href={devLink}
                className="break-all font-semibold text-fuchsia-600 hover:underline"
              >
                Open verification link
              </a>
            </p>
          ) : null}
          <Link
            href="/login"
            className="inline-block font-semibold text-fuchsia-600 hover:text-fuchsia-700"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="reg-name"
              className="text-[13px] font-semibold text-slate-700"
            >
              Full name
            </label>
            <div className="relative">
              <HiOutlineUser className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Your full name"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reg-email"
              className="text-[13px] font-semibold text-slate-700"
            >
              Business email
            </label>
            <div className="relative">
              <HiOutlineEnvelope className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@yourcompany.com"
                className={fieldClass}
              />
            </div>
            <p className="text-[12px] text-slate-400">
              Free inboxes (Gmail, Yahoo, Outlook, etc.) are not allowed.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reg-phone"
              className="text-[13px] font-semibold text-slate-700"
            >
              Phone number <span className="text-fuchsia-600">*</span>
            </label>
            <div className="relative">
              <HiOutlinePhone className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+1 (555) 000-0000"
                className={fieldClass}
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 pt-1 text-[13px] text-slate-500">
            <input
              type="checkbox"
              name="terms"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-200"
            />
            <span>
              I agree to the{" "}
              <Link href="#" className="font-semibold text-fuchsia-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="font-semibold text-fuchsia-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

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
