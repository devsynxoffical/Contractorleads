"use client";

import { useState } from "react";
import { HiOutlineCheck, HiOutlineEnvelope } from "react-icons/hi2";
import { subscribeMarketingEmail } from "@/lib/client/marketing-track";

const PERKS = [
  "Outreach templates that book calls",
  "New scoring and audit features first",
  "No spam — unsubscribe in one click",
];

/** Always-visible email capture so visitors who dismiss the modals still convert. */
export function MarketingEmailOptIn() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your work email to subscribe.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await subscribeMarketingEmail({
        email: trimmed,
        source: "homepage_inline",
        emailOptIn: true,
      });
      setSaved(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="newsletter"
      className="relative overflow-hidden border-t border-slate-200/80 bg-[#faf8fb] py-16 sm:py-20"
      aria-labelledby="newsletter-title"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(217,70,239,0.10), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-5xl gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-[12px] font-semibold text-fuchsia-700">
            <HiOutlineEnvelope className="h-3.5 w-3.5" />
            Free playbook
          </span>
          <h2
            id="newsletter-title"
            className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.6rem,3.5vw,2.35rem)] font-semibold tracking-tight text-slate-900"
          >
            Get the contractor outreach playbook
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
            Join agency owners who get our lead-gen breakdowns — the exact scripts,
            audits, and offers that turn scored leads into signed retainers.
          </p>
          <ul className="mt-5 space-y-2">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-2 text-[13px] text-slate-600"
              >
                <HiOutlineCheck className="h-4 w-4 shrink-0 text-violet-500" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-24px_rgba(88,28,135,0.35)] sm:p-7">
          {saved ? (
            <div className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <HiOutlineCheck className="h-6 w-6" />
              </span>
              <p className="mt-4 text-[16px] font-semibold text-slate-900">
                You&apos;re on the list
              </p>
              <p className="mt-1.5 text-[13px] text-slate-600">
                Check your inbox — the playbook is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label
                htmlFor="newsletter-email"
                className="text-[13px] font-semibold text-slate-800"
              >
                Work email
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                autoComplete="email"
                aria-invalid={Boolean(error)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-[#faf8fb] px-3.5 py-3 text-[14px] text-slate-900 outline-none ring-violet-200 transition focus:ring-2"
              />
              {error ? (
                <p role="alert" className="mt-2 text-[12px] text-red-600">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-violet-600 px-4 py-3 text-[14px] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
              >
                {busy ? "Subscribing…" : "Send me the playbook"}
              </button>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                No card required. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
