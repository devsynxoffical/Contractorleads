"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { openRazorpayModal } from "@/lib/client/razorpay-checkout";

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
      if (!res.ok || !json.orderId || !json.keyId) {
        throw new Error(json.error || "Could not start checkout");
      }

      await openRazorpayModal({
        keyId: json.keyId,
        orderId: json.orderId,
        amount: json.amount,
        currency: json.currency || "USD",
        name: "Contractor Leads",
        description: "Messaging Add-on ($30/mo)",
        prefill: {
          name: json.user?.name,
          email: json.user?.email,
          contact: json.user?.phone,
        },
        onSuccess: async (payResponse) => {
          try {
            const verifyRes = await fetch("/api/billing/messaging-addon", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payResponse),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.ok) {
              window.location.reload();
            } else {
              setError(verifyData.error || "Payment verification failed");
              setBusy(false);
            }
          } catch {
            setError("Error verifying payment");
            setBusy(false);
          }
        },
        onDismiss: () => {
          setBusy(false);
        },
      });
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
                Turn on bulk email + Twilio SMS for all leads in your account.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {PERKS.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2 text-[13px] text-ink-muted"
              >
                <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0 rounded-xl border border-brand-200/50 bg-brand-50/40 p-4 text-center dark:bg-brand-950/20 sm:min-w-[200px]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            Monthly add-on
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-3xl font-extrabold text-ink">
              ${priceUsd}
            </span>
            <span className="text-[12px] text-ink-muted">/mo</span>
          </div>

          <div className="mt-4">
            {active ? (
              <div className="space-y-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {comped ? "Active (Comped)" : "Active"}
                </span>
                {!comped ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => void cancel()}
                      disabled={busy}
                      className="text-[11px] text-ink-muted underline hover:text-red-600"
                    >
                      {busy ? "Updating…" : "Cancel add-on"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : available ? (
              <Button
                type="button"
                onClick={() => void subscribe()}
                disabled={busy}
                className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
                size="sm"
              >
                {busy ? "Opening…" : "Turn on messaging"}
              </Button>
            ) : (
              <span className="text-[12px] text-ink-muted">
                Configure Razorpay keys to enable.
              </span>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-[12px] text-red-600">{error}</p>
      ) : null}
    </section>
  );
}
