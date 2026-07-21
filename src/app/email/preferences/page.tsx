"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

function PreferencesInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    fetch(`/api/email/preferences${qs}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.email) setEmail(d.email);
        if (typeof d.emailMarketingOptIn === "boolean") setOptIn(d.emailMarketingOptIn);
      })
      .catch(() => {});
  }, [token]);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/email/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailMarketingOptIn: optIn, token: token || undefined }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg(res.ok ? "Preferences saved." : data.error || "Could not save");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f0ea] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_rgba(26,18,36,0.08)]">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ background: LOGO_GRADIENT, WebkitBackgroundClip: "text", color: "transparent" }}
        >
          Contractor Leads
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-900">
          Manage email preferences
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {email ? `For ${email}` : "Choose which product emails you receive."}
        </p>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#faf8fc] p-4 text-[13px] text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
          />
          <span>
            <strong className="block text-slate-900">Lead scrape & product updates</strong>
            Emails when a search finishes, plus product tips. Transactional mail (verify email,
            password reset) still sends when required.
          </span>
        </label>

        {msg && (
          <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">{msg}</p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="mt-5 h-12 w-full rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: LOGO_GRADIENT }}
        >
          {busy ? "Saving…" : "Save preferences"}
        </button>

        <p className="mt-5 text-center text-[13px]">
          <Link href="/login" className="font-semibold text-fuchsia-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EmailPreferencesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <PreferencesInner />
    </Suspense>
  );
}
