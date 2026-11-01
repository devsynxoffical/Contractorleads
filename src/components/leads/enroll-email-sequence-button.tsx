"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MESSAGING_ADDON_UPGRADE_HREF,
  isMessagingAddonLocked,
} from "@/components/billing/addon-lock-notice";

export function EnrollEmailSequenceButton({
  savedLeadId,
  hasEmail,
}: {
  savedLeadId: string;
  hasEmail: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [addonLocked, setAddonLocked] = useState(false);

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
      if (isMessagingAddonLocked(res, data)) {
        setAddonLocked(true);
        return;
      }
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(
      data.enrolled
        ? "Day 1 sent · follow-up days queued"
        : "No leads enrolled",
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy || !hasEmail}
        onClick={enroll}
        className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
      >
        {busy ? "Enrolling…" : "Enroll in nurture"}
      </button>
      {addonLocked ? (
        <span className="text-[12px] text-ink-muted">
          Sequences need the{" "}
          <Link
            href={MESSAGING_ADDON_UPGRADE_HREF}
            className="font-semibold text-brand-600 underline"
          >
            Messaging add-on
          </Link>
          .
        </span>
      ) : null}
      {msg ? <span className="text-[12px] text-ink-muted">{msg}</span> : null}
    </div>
  );
}
