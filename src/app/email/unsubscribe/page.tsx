"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

function UnsubscribeInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing unsubscribe token.");
      return;
    }
    fetch(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Unsubscribe failed");
        setStatus("ok");
        setMessage(d.message || "You are unsubscribed.");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Unsubscribe failed");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f0ea] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_24px_60px_rgba(26,18,36,0.08)]">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.16em]"
          style={{ background: LOGO_GRADIENT, WebkitBackgroundClip: "text", color: "transparent" }}
        >
          Contractor Leads
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-900">
          Email preferences
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          {status === "loading" ? "Updating your preferences…" : message}
        </p>
        <p className="mt-6 text-[13px]">
          <Link href="/email/preferences" className="font-semibold text-fuchsia-700 hover:underline">
            Manage preferences
          </Link>
          {" · "}
          <Link href="/login" className="font-semibold text-fuchsia-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading…</div>}>
      <UnsubscribeInner />
    </Suspense>
  );
}
