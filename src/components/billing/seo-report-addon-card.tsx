"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HiOutlineChartBarSquare, HiOutlineCheckCircle } from "react-icons/hi2";
import { openRazorpayModal } from "@/lib/client/razorpay-checkout";

type LatestReport = {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
} | null;

export function SeoReportAddonCard({
  available,
  priceUsd,
  latestReport,
}: {
  available: boolean;
  priceUsd: number;
  latestReport: LatestReport;
}) {
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buyReport() {
    if (!website.trim()) {
      setError("Please enter a valid website URL.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/seo-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website }),
      });
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
        description: `AI Website + SEO Report for ${website}`,
        prefill: {
          name: json.user?.name,
          email: json.user?.email,
          contact: json.user?.phone,
        },
        onSuccess: async (payResponse) => {
          try {
            const verifyRes = await fetch("/api/billing/seo-report", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payResponse,
                website,
              }),
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

  return (
    <section className="rounded-2xl border border-brand-200/70 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
                <HiOutlineChartBarSquare className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[16px] font-semibold text-ink">
                  AI Website + SEO Report
                </h3>
                <p className="text-[12px] text-ink-muted">
                  Detailed technical + local SEO + CRO action plan
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-[13px] text-ink-muted">
              <li className="flex items-start gap-2">
                <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                Live crawl of website content and SEO hygiene signals
              </li>
              <li className="flex items-start gap-2">
                <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                Prioritized fixes and 30-day implementation sprint
              </li>
              <li className="flex items-start gap-2">
                <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                Generated report is saved to your account
              </li>
            </ul>
          </div>
          <p className="shrink-0 rounded-full bg-brand-500/10 px-3 py-1 text-[12px] font-semibold text-brand-700">
            ${priceUsd.toFixed(2)} per report
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-[12px] font-medium text-ink-muted">
            Website URL to analyze
            <input
              className="saas-input mt-1.5 text-[13px]"
              placeholder="https://yourclientsite.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          {available ? (
            <Button size="sm" onClick={buyReport} loading={busy} className="font-bold">
              Buy report for ${priceUsd.toFixed(2)}
            </Button>
          ) : (
            <p className="text-right text-[12px] text-ink-faint">
              Configure Razorpay keys to enable.
            </p>
          )}
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-700">
            {error}
          </p>
        ) : null}

        {latestReport ? (
          <div className="rounded-xl border border-border/80 bg-[var(--input-bg)] p-3">
            <p className="text-[12px] font-semibold text-ink">
              Latest report: {latestReport.title || "Website SEO report"}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Generated {new Date(latestReport.createdAt).toLocaleString()}
            </p>
            <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-ink-muted">
              {latestReport.content}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
