"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HiOutlineClipboardDocument, HiOutlineUserPlus } from "react-icons/hi2";

type ReferralStats = {
  code: string;
  shareUrl: string;
  enabled: boolean;
  commissionPercent: number;
  minWithdrawalUsd: number;
  successfulReferrals: number;
  pendingReferrals: number;
  balanceUsd: number;
  totalEarnedUsd: number;
  milestones: Array<{ minReferrals: number; bonusUsd: number }>;
  progressToNext: {
    current: number;
    target: number;
    remaining: number;
    bonusUsd: number;
  } | null;
  referrals: Array<{
    id: string;
    status: string;
    commissionUsd: number;
    milestoneBonusUsd: number;
    planAtReward: string | null;
    createdAt: string;
    referred: {
      email: string;
      name: string | null;
      companyName: string | null;
      createdAt: string;
      plan: string;
    };
  }>;
  withdrawals: Array<{
    id: string;
    amountUsd: number;
    method: string;
    payoutDetails: string;
    status: string;
    adminNote: string | null;
    createdAt: string;
    processedAt: string | null;
  }>;
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amountUsd, setAmountUsd] = useState("");
  const [method, setMethod] = useState<"paypal" | "bank" | "other">("paypal");
  const [payoutDetails, setPayoutDetails] = useState("");

  async function load() {
    const res = await fetch("/api/referrals");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load");
    setData(json);
  }

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load referrals"),
    );
  }, []);

  async function copyLink() {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link");
    }
  }

  async function submitWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/referrals/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUsd: Number(amountUsd),
          method,
          payoutDetails,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Withdrawal failed");
      setMessage(`Withdrawal of ${money(Number(amountUsd))} submitted.`);
      setAmountUsd("");
      setPayoutDetails("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div className="page-pad">
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-pad">
        <p className="animate-pulse text-sm text-ink-muted">Loading referrals…</p>
      </div>
    );
  }

  const hasPendingWithdraw = data.withdrawals.some((w) => w.status === "pending");

  return (
    <div className="page-pad space-y-5">
      <PageHeader
        title="Referrals"
        description={
          data.enabled
            ? `Earn ${data.commissionPercent}% cash commission when someone you refer purchases a paid plan. Withdraw to PayPal or bank — not credits.`
            : "The referral program is currently paused by an admin."
        }
      />

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Available balance
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {money(data.balanceUsd)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Total earned
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {money(data.totalEarnedUsd)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Converted / pending
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {data.successfulReferrals}
              <span className="text-base font-medium text-ink-muted">
                {" "}
                / {data.pendingReferrals}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Your code
            </p>
            <p className="mt-1 font-mono text-xl font-bold tracking-wider text-brand-700">
              {data.code}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HiOutlineUserPlus className="h-5 w-5 text-brand-600" />
            Your referral link
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            readOnly
            className="saas-input flex-1 font-mono text-[13px]"
            value={data.shareUrl}
          />
          <Button type="button" onClick={copyLink}>
            <HiOutlineClipboardDocument className="h-4 w-4" />
            {copied ? "Copied" : "Copy link"}
          </Button>
        </CardContent>
      </Card>

      {data.enabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdraw earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-[13px] text-ink-muted">
              Minimum withdrawal {money(data.minWithdrawalUsd)}. Requests are
              reviewed by an admin before payout.
            </p>
            {hasPendingWithdraw ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                You already have a pending withdrawal. Wait for it to be paid or
                rejected before requesting another.
              </p>
            ) : (
              <form onSubmit={submitWithdraw} className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[12px]">
                  <span className="font-medium text-ink-muted">Amount (USD)</span>
                  <input
                    type="number"
                    min={data.minWithdrawalUsd}
                    step="0.01"
                    required
                    className="saas-input mt-1"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <label className="block text-[12px]">
                  <span className="font-medium text-ink-muted">Payout method</span>
                  <select
                    className="saas-input mt-1"
                    value={method}
                    onChange={(e) =>
                      setMethod(e.target.value as "paypal" | "bank" | "other")
                    }
                    disabled={busy}
                  >
                    <option value="paypal">PayPal</option>
                    <option value="bank">Bank transfer</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block text-[12px] sm:col-span-2">
                  <span className="font-medium text-ink-muted">
                    Payout details
                  </span>
                  <input
                    required
                    className="saas-input mt-1"
                    placeholder={
                      method === "paypal"
                        ? "PayPal email"
                        : method === "bank"
                          ? "Bank name, account holder, routing/account"
                          : "How should we pay you?"
                    }
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    disabled={busy}
                  />
                </label>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={busy} disabled={busy}>
                    Request withdrawal
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

      {data.progressToNext ? (
        <Card>
          <CardContent className="py-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Next milestone: {data.progressToNext.target} paid referrals
                </p>
                <p className="mt-1 text-[13px] text-ink-muted">
                  {data.progressToNext.remaining} more to unlock{" "}
                  <strong>{money(data.progressToNext.bonusUsd)} bonus</strong>
                </p>
              </div>
              <p className="text-[13px] tabular-nums text-ink-muted">
                {data.progressToNext.current} / {data.progressToNext.target}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--input-bg)]">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (data.progressToNext.current / data.progressToNext.target) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {data.milestones.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Milestone bonuses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.milestones.map((m) => {
                const hit = data.successfulReferrals >= m.minReferrals;
                return (
                  <li
                    key={m.minReferrals}
                    className="flex items-center justify-between rounded-xl border border-border bg-[var(--input-bg)] px-3 py-2.5 text-[13px]"
                  >
                    <span>{m.minReferrals}+ paid referrals</span>
                    <span className="font-semibold tabular-nums text-brand-700">
                      +{money(m.bonusUsd)}
                      {hit ? (
                        <Badge variant="verified" className="ml-2">
                          Unlocked
                        </Badge>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">People you referred</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.referrals.length ? (
            <p className="text-sm text-ink-muted">
              No referrals yet. Share your link — you earn when they buy a plan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-2 py-2 font-medium">User</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Commission</th>
                    <th className="px-2 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrals.map((r) => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="px-2 py-2.5">
                        <p className="font-medium text-ink">
                          {r.referred.companyName || r.referred.name || "—"}
                        </p>
                        <p className="text-[12px] text-ink-muted">
                          {r.referred.email}
                        </p>
                      </td>
                      <td className="px-2 py-2.5 capitalize">
                        {r.status === "pending" ? "Awaiting purchase" : r.status}
                      </td>
                      <td className="px-2 py-2.5 tabular-nums">
                        {r.status === "rewarded"
                          ? money(r.commissionUsd + r.milestoneBonusUsd)
                          : "—"}
                      </td>
                      <td className="px-2 py-2.5 text-[12px] text-ink-muted">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data.withdrawals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Withdrawal history</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.withdrawals.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-[13px]"
                >
                  <div>
                    <p className="font-semibold tabular-nums text-ink">
                      {money(w.amountUsd)} · {w.method}
                    </p>
                    <p className="text-[12px] text-ink-muted">
                      {new Date(w.createdAt).toLocaleString()}
                      {w.adminNote ? ` · ${w.adminNote}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      w.status === "paid"
                        ? "verified"
                        : w.status === "rejected"
                          ? "default"
                          : "brand"
                    }
                  >
                    {w.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
