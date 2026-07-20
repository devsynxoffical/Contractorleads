"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiOutlineXMark, HiOutlineCheck } from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { handleMarketingHashClick } from "./marketing-scroll";
import { subscribeMarketingEmail } from "@/lib/client/marketing-track";

const WELCOME_KEY = "cl_mkt_welcome_dismissed";
const EXIT_KEY = "cl_mkt_exit_dismissed";

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mkt-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>
        <h2
          id="mkt-modal-title"
          className="pr-8 font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-tight text-slate-900"
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export function MarketingTrialModals() {
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(WELCOME_KEY)) return;
    const timer = window.setTimeout(() => setWelcomeOpen(true), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onMouseLeave = (e: MouseEvent) => {
      if (localStorage.getItem(EXIT_KEY)) return;
      if (!localStorage.getItem(WELCOME_KEY)) return;
      if (e.clientY > 12) return;
      if (welcomeOpen) return;
      setExitOpen(true);
    };

    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    return () => document.documentElement.removeEventListener("mouseleave", onMouseLeave);
  }, [welcomeOpen]);

  function dismissWelcome() {
    localStorage.setItem(WELCOME_KEY, "1");
    setWelcomeOpen(false);
    setEmail("");
    setError("");
    setSaved(false);
  }

  function dismissExit() {
    localStorage.setItem(EXIT_KEY, "1");
    setExitOpen(false);
    setEmail("");
    setError("");
    setSaved(false);
  }

  async function saveEmail(source: string) {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your work email to get updates.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await subscribeMarketingEmail({ email: trimmed, source, emailOptIn: true });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save email");
    } finally {
      setBusy(false);
    }
  }

  if (!welcomeOpen && !exitOpen) return null;

  if (welcomeOpen) {
    return (
      <ModalShell title="Start finding contractor leads in the next 2 minutes" onClose={dismissWelcome}>
        <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
          Get trial credits the moment you sign up — enough to run real searches and see actual scored
          results, not a locked demo.
        </p>
        <ul className="mt-4 space-y-2 text-[13px] text-slate-600">
          {[
            "No credit card required",
            "Trial credits included instantly",
            "Cancel anytime, no contract",
          ].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <HiOutlineCheck className="h-4 w-4 shrink-0 text-violet-500" />
              {line}
            </li>
          ))}
        </ul>

        <label className="mt-5 block text-left">
          <span className="text-[12px] font-medium text-slate-600">
            Email me lead-gen tips (optional)
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.com"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#faf8fb] px-3 py-2.5 text-[14px] text-slate-900 outline-none ring-violet-200 focus:ring-2"
            autoComplete="email"
          />
        </label>
        {error ? (
          <p className="mt-2 text-left text-[12px] text-red-600">{error}</p>
        ) : saved ? (
          <p className="mt-2 text-left text-[12px] text-emerald-600">
            Saved — we&apos;ll keep you posted. Your browser session is stored for follow-up.
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2">
          {email.trim() && !saved ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveEmail("welcome_modal")}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-[14px] font-semibold text-violet-900 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save email & continue"}
            </button>
          ) : null}
          <Link
            href="/register"
            onClick={dismissWelcome}
            className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-[14px] font-semibold text-white"
            style={{ background: LOGO_GRADIENT }}
          >
            Create free account
          </Link>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Before you go — see what a real search looks like" onClose={dismissExit}>
      <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
        Takes less than a minute. No card, no sales call required to start.
      </p>

      <label className="mt-4 block text-left">
        <span className="text-[12px] font-medium text-slate-600">
          Or leave your email for a sample playbook
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@agency.com"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#faf8fb] px-3 py-2.5 text-[14px] text-slate-900 outline-none ring-violet-200 focus:ring-2"
          autoComplete="email"
        />
      </label>
      {error ? (
        <p className="mt-2 text-left text-[12px] text-red-600">{error}</p>
      ) : saved ? (
        <p className="mt-2 text-left text-[12px] text-emerald-600">Thanks — you&apos;re on the list.</p>
      ) : null}

      {email.trim() && !saved ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveEmail("exit_modal")}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-[14px] font-semibold text-slate-800 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Email me updates"}
        </button>
      ) : null}

      <Link
        href="#interactive-demo"
        onClick={(e) => {
          dismissExit();
          handleMarketingHashClick(e, "#interactive-demo");
        }}
        className="mt-3 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-[14px] font-semibold text-white"
        style={{ background: LOGO_GRADIENT }}
      >
        Show me a sample search
      </Link>
      <button
        type="button"
        onClick={dismissExit}
        className="mt-3 w-full py-2 text-[13px] font-medium text-slate-500 hover:text-slate-800"
      >
        No thanks, maybe later
      </button>
    </ModalShell>
  );
}
