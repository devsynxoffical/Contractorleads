"use client";

import { useState } from "react";

export function EnrollEmailSequenceButton({
  savedLeadId,
  hasEmail,
}: {
  savedLeadId: string;
  hasEmail: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function enroll() {
    if (!hasEmail) {
      setMsg("Lead has no email");
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/email/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savedLeadId }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(data.enrolled ? "Day 1 sent · Days 2–3 queued" : "No leads enrolled");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy || !hasEmail}
        onClick={enroll}
        className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
      >
        {busy ? "Enrolling…" : "Email Day 1–3"}
      </button>
      {msg ? <span className="text-[11px] text-ink-faint">{msg}</span> : null}
    </div>
  );
}
