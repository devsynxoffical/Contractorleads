"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const PERKS = [
  "Bulk email — message many leads at once with personalization",
  "SMS / text messaging to lead phone numbers (Twilio)",
  "Shared inbox + delivery tracking for every send",
];

export function MessagingAddonCard({
  active,
  comped,
  available,
  status,
  priceUsd,
}: {
  active: boolean;
  comped: boolean;
  available: boolean;
  status: string;
  priceUsd: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/messaging-addon", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not start checkout");
      if (json.url) window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setBusy(false);
    }
  }

  async function cancel() {
    if (!confirm("Cancel the Messaging add-on? Bulk email and SMS will turn off at the end of the period.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/messaging-addon", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not cancel");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel");
      setBusy(false);
    }
  }

  return (
    <section
      className={`rounded-2xl border p-5 shadow-[var(--shadow-card)] sm:p-6 ${
        active
          ? "border-emerald-400/50 bg-emerald-500/5"
          : "border-brand-200/70 bg-[var(--surface)]"
      }`}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
              <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-[16px] font-semibold text-ink">
                Messaging add-on
              </h3>
              <p className="text-[12px] text-ink-muted">
                Bulk email &amp; SMS outreach · ${priceUsd.toFixed(2)}/mo
              </p>
            </div>
            {active ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
                <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                {comped ? "Included" : "Active"}
              </span>
            ) : null}
          </div>

          <ul className="mt-4 space-y-1.5">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-2 text-[13px] text-ink-muted"
              >
                <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                {perk}
              </li>
            ))}
          </ul>

          {error ? (
            <p className="mt-3 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700">
              {error}
            </p>
          ) : null}
          {status === "past_due" ? (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-900 dark:text-amber-100">
              Payment for the add-on is past due — update your card under Manage
              billing to keep it active.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {active ? (
            comped ? (
              <p className="text-[12px] text-ink-faint">Granted by your account team</p>
            ) : (
              <Button variant="secondary" size="sm" onClick={cancel} loading={busy}>
                Cancel add-on
              </Button>
            )
          ) : available ? (
            <Button size="sm" onClick={subscribe} loading={busy}>
              Add for ${priceUsd.toFixed(2)}/mo
            </Button>
          ) : (
            <p className="max-w-[12rem] text-right text-[12px] text-ink-faint">
              Coming soon — ask an admin to finish Stripe setup.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
