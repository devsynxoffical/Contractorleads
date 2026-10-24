"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HiOutlineClipboardDocument,
  HiOutlineUserPlus,
  HiOutlineUserGroup,
  HiOutlineShoppingBag,
  HiOutlineCurrencyDollar,
  HiOutlineBanknotes,
  HiOutlineArrowTrendingUp,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineShare,
  HiOutlineArrowPath,
  HiOutlineQuestionMarkCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi2";

type ReferralStats = {
  code: string;
  shareUrl: string;
  enabled: boolean;
  commissionPercent: number;
  minWithdrawalUsd: number;
  milestones: Array<{ minReferrals: number; bonusUsd: number }>;
  totalSignups: number;
  totalSales: number;
  totalRevenueUsd: number;
  totalEarnedUsd: number;
  payableBalanceUsd: number;
  pendingPayoutsUsd: number;
  completedPayoutsUsd: number;
  payoutThresholdUsd: number;
  isEligibleForPayout: boolean;
  remainingForPayoutUsd: number;
  payoutProgressPercent: number;
  successfulReferrals: number;
  pendingReferrals: number;
  balanceUsd: number;
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
    totalRevenueUsd: number;
    totalCommissionUsd: number;
    totalSalesCount: number;
    planAtReward: string | null;
    createdAt: string;
    rewardedAt: string | null;
    referred: {
      email: string;
      name: string | null;
      companyName: string | null;
      createdAt: string;
      plan: string;
    };
  }>;
  sales: Array<{
    id: string;
    amountUsd: number;
    commissionUsd: number;
    commissionRate: number;
    plan: string;
    type: string;
    paymentProvider: string | null;
    status: string;
    createdAt: string;
    customerEmail: string;
    customerName: string | null;
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
  return `$${(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"sales" | "signups" | "payouts" | "faq">("sales");

  // Withdrawal form state
  const [amountUsd, setAmountUsd] = useState("");
  const [method, setMethod] = useState<"paypal" | "bank" | "other">("paypal");
  const [payoutDetails, setPayoutDetails] = useState("");

  async function load() {
    const res = await fetch("/api/referrals");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load affiliate data");
    setData(json);
  }

  useEffect(() => {
    load().catch((e) =>
      setError(e instanceof Error ? e.message : "Failed to load affiliate data"),
    );
  }, []);

  async function copyLink() {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setError("Could not copy link to clipboard");
    }
  }

  async function copyCode() {
    if (!data?.code) return;
    try {
      await navigator.clipboard.writeText(data.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setError("Could not copy code to clipboard");
    }
  }

  function shareTwitter() {
    if (!data?.shareUrl) return;
    const text = encodeURIComponent(
      "Looking for verified, exclusive contractor and home service leads? Check out Contractor Leads:",
    );
    const url = encodeURIComponent(data.shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  }

  function shareLinkedIn() {
    if (!data?.shareUrl) return;
    const url = encodeURIComponent(data.shareUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  }

  function shareWhatsApp() {
    if (!data?.shareUrl) return;
    const text = encodeURIComponent(
      `Hey! Check out Contractor Leads for high-intent contractor leads and verified home service projects: ${data.shareUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }

  function shareEmail() {
    if (!data?.shareUrl) return;
    const subject = encodeURIComponent("Contractor Leads - Verified Exclusive Leads");
    const body = encodeURIComponent(
      `Hi,\n\nI wanted to share Contractor Leads with you. It gives contractors and agencies instant access to verified homeowner project leads:\n\n${data.shareUrl}\n\nSign up today to get started!`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  async function submitWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;

    const reqAmount = Number(amountUsd);
    if (!reqAmount || reqAmount < data.payoutThresholdUsd) {
      setError(
        `Minimum payout threshold is ${money(data.payoutThresholdUsd)}. Your payable balance must be at least ${money(data.payoutThresholdUsd)} to request a payout.`,
      );
      return;
    }

    if (reqAmount > data.payableBalanceUsd) {
      setError(
        `Requested amount exceeds your available payable balance (${money(data.payableBalanceUsd)}).`,
      );
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/referrals/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountUsd: reqAmount,
          method,
          payoutDetails,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Withdrawal request failed");
      setMessage(`Payout request of ${money(reqAmount)} submitted successfully! Our team will process it shortly.`);
      setAmountUsd("");
      setPayoutDetails("");
      await load();
      setActiveTab("payouts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout request failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div className="page-pad">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-pad flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <HiOutlineArrowPath className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-ink-muted">Loading affiliate dashboard…</p>
      </div>
    );
  }

  const hasPendingWithdraw = data.withdrawals.some((w) => w.status === "pending");

  return (
    <div className="page-pad space-y-6">
      {/* Header */}
      <PageHeader
        title="Affiliate Program"
        description="Earn 30% recurring cash commission on every eligible customer purchase and ongoing subscription renewal. Track your sign-ups, sales, deal volume, and payouts below."
        backHref="/dashboard"
        backLabel="Back to dashboard"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Affiliate Program" },
        ]}
      />

      {/* Program Highlights Banner */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-brand-200/70 bg-gradient-to-r from-brand-50/70 via-indigo-50/40 to-surface p-4 text-[13px] text-ink dark:border-brand-500/20 dark:from-brand-500/10 dark:to-surface">
        <div className="flex items-center gap-1.5 font-semibold text-brand-700 dark:text-brand-300">
          <HiOutlineShieldCheck className="h-5 w-5 text-brand-600" />
          <span>Affiliate Terms:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
            30% Commission Rate
          </span>
          <span className="inline-flex items-center rounded-lg bg-blue-100/80 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
            Recurring Renewals Included
          </span>
          <span className="inline-flex items-center rounded-lg bg-amber-100/80 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
            $500 Minimum Payout Threshold
          </span>
          <span className="inline-flex items-center rounded-lg bg-purple-100/80 px-2.5 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-500/20 dark:text-purple-300">
            30-Day Cookie Attribution
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <HiOutlineInformationCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {message ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <HiOutlineCheckCircle className="h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      {/* Unique Referral Link & Quick Sharing Card */}
      <Card className="border-border bg-surface shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
              <HiOutlineUserPlus className="h-5 w-5 text-brand-600" />
              Your Unique Referral Link
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-ink-muted">Referral Code:</span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/70 px-2.5 py-1 font-mono text-xs font-bold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                title="Click to copy code"
              >
                {data.code}
                <span className="text-[10px] uppercase text-brand-600">
                  {copiedCode ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              className="saas-input flex-1 font-mono text-[13px] text-ink select-all"
              value={data.shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              type="button"
              onClick={copyLink}
              className="shrink-0 font-medium"
            >
              <HiOutlineClipboardDocument className="mr-1.5 h-4 w-4" />
              {copiedLink ? "Link Copied!" : "Copy Referral Link"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[12px] text-ink-muted">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">Share directly:</span>
              <button
                type="button"
                onClick={shareTwitter}
                className="rounded-lg border border-border px-2.5 py-1 text-ink transition hover:bg-slate-100 hover:text-ink dark:hover:bg-white/5"
              >
                X (Twitter)
              </button>
              <button
                type="button"
                onClick={shareLinkedIn}
                className="rounded-lg border border-border px-2.5 py-1 text-ink transition hover:bg-slate-100 hover:text-ink dark:hover:bg-white/5"
              >
                LinkedIn
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="rounded-lg border border-border px-2.5 py-1 text-ink transition hover:bg-slate-100 hover:text-ink dark:hover:bg-white/5"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={shareEmail}
                className="rounded-lg border border-border px-2.5 py-1 text-ink transition hover:bg-slate-100 hover:text-ink dark:hover:bg-white/5"
              >
                Email
              </button>
            </div>
            <p className="text-[11px] text-ink-faint">
              Cookies persist for 30 days · Covers initial purchases and renewals
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5 Core Affiliate KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* KPI 1: Total Sign-ups */}
        <Card className="relative overflow-hidden border-border bg-surface transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                Total Sign-ups
              </span>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <HiOutlineUserGroup className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink">
              {data.totalSignups}
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              <span className="font-semibold text-emerald-600">
                {data.successfulReferrals} paid
              </span>{" "}
              · {data.pendingReferrals} free accounts
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Sales Generated */}
        <Card className="relative overflow-hidden border-border bg-surface transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                Total Sales
              </span>
              <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300">
                <HiOutlineShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink">
              {data.totalSales}
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              Initial deals + recurring renewals
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Total Revenue Generated */}
        <Card className="relative overflow-hidden border-border bg-surface transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                Total Revenue
              </span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <HiOutlineArrowTrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink">
              {money(data.totalRevenueUsd)}
            </p>
            <p className="mt-1 text-[12px] text-ink-muted">
              Gross deal volume generated
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Affiliate Commission Earned */}
        <Card className="relative overflow-hidden border-brand-200/80 bg-gradient-to-b from-brand-50/40 to-surface transition hover:shadow-md dark:border-brand-500/30 dark:from-brand-500/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Commission Earned
              </span>
              <div className="rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                <HiOutlineCurrencyDollar className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-brand-700 dark:text-brand-300">
              {money(data.totalEarnedUsd)}
            </p>
            <p className="mt-1 text-[12px] font-semibold text-emerald-600">
              {data.commissionPercent}% rate on eligible sales
            </p>
          </CardContent>
        </Card>

        {/* KPI 5: Payouts Status */}
        <Card className="relative overflow-hidden border-border bg-surface transition hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                Payable Balance
              </span>
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                <HiOutlineBanknotes className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-ink">
              {money(data.payableBalanceUsd)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
              <span>Paid: {money(data.completedPayoutsUsd)}</span>
              <span>·</span>
              <span className="text-amber-700 dark:text-amber-400">
                Pending: {money(data.pendingPayoutsUsd)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minimum Payout Threshold ($500) & Payout Request Section */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left: Threshold Progress Widget (7 cols) */}
        <Card className="lg:col-span-7 border-border bg-surface shadow-[var(--shadow-card)]">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-ink">
                <HiOutlineBanknotes className="h-5 w-5 text-brand-600" />
                Minimum Payout Threshold Status
              </CardTitle>
              {data.isEligibleForPayout ? (
                <Badge variant="verified">Eligible for Payout</Badge>
              ) : (
                <Badge variant="warm">
                  {money(data.remainingForPayoutUsd)} Remaining
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Affiliates become eligible for payout once their payable commission balance reaches the{" "}
              <strong className="text-ink">${data.payoutThresholdUsd} minimum payout threshold</strong>.
              All earned commissions remain securely stored in your wallet until requested.
            </p>

            {/* Progress Bar Container */}
            <div className="space-y-1.5 rounded-xl border border-border bg-[var(--input-bg)] p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">
                  Payable Balance: {money(data.payableBalanceUsd)}
                </span>
                <span className="font-medium text-ink-muted">
                  Threshold: {money(data.payoutThresholdUsd)} ({data.payoutProgressPercent}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.isEligibleForPayout
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-brand-500 to-indigo-500"
                  }`}
                  style={{ width: `${data.payoutProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                <span>$0.00</span>
                <span>$250.00</span>
                <span className="font-semibold text-brand-700 dark:text-brand-300">
                  ${data.payoutThresholdUsd}.00 (Unlocked)
                </span>
              </div>
            </div>

            {data.isEligibleForPayout ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>
                  <strong>Threshold Reached:</strong> You have accumulated {money(data.payableBalanceUsd)} in payable commissions. You may request a payout using the form on the right.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <HiOutlineClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  <strong>Goal in progress:</strong> You are {money(data.remainingForPayoutUsd)} away from unlocking payouts. Share your link with contractor groups and agencies to earn 30% on their plan subscriptions!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Withdrawal Form or Status (5 cols) */}
        <Card className="lg:col-span-5 border-border bg-surface shadow-[var(--shadow-card)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-ink">
              Request Affiliate Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasPendingWithdraw ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <div className="flex items-center gap-2 font-semibold">
                  <HiOutlineClock className="h-5 w-5 text-amber-600" />
                  <span>Pending Payout In Review</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300/90">
                  You have a pending withdrawal request of {money(data.pendingPayoutsUsd)} currently being processed by our accounting team. Payouts are reviewed and disbursed weekly.
                </p>
              </div>
            ) : data.isEligibleForPayout ? (
              <form onSubmit={submitWithdraw} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink-muted">Payout Amount (USD)</span>
                    <button
                      type="button"
                      onClick={() => setAmountUsd(String(data.payableBalanceUsd))}
                      className="text-[11px] font-semibold text-brand-600 hover:underline"
                    >
                      Withdraw Full Balance ({money(data.payableBalanceUsd)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={data.payoutThresholdUsd}
                    max={data.payableBalanceUsd}
                    step="0.01"
                    required
                    placeholder={`Min. $${data.payoutThresholdUsd}.00`}
                    className="saas-input mt-1"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    disabled={busy}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-muted">
                    Payout Method
                  </label>
                  <select
                    className="saas-input mt-1"
                    value={method}
                    onChange={(e) =>
                      setMethod(e.target.value as "paypal" | "bank" | "other")
                    }
                    disabled={busy}
                  >
                    <option value="paypal">PayPal (Fastest)</option>
                    <option value="bank">Direct Bank Wire / ACH</option>
                    <option value="other">Wise / Other Electronic Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-muted">
                    Account Details
                  </label>
                  <input
                    required
                    className="saas-input mt-1 text-[13px]"
                    placeholder={
                      method === "paypal"
                        ? "Your PayPal email address"
                        : method === "bank"
                          ? "Bank name, account holder, routing & account number"
                          : "Wise email, account details or instructions"
                    }
                    value={payoutDetails}
                    onChange={(e) => setPayoutDetails(e.target.value)}
                    disabled={busy}
                  />
                </div>

                <Button
                  type="submit"
                  loading={busy}
                  disabled={busy || !amountUsd || Number(amountUsd) < data.payoutThresholdUsd}
                  className="w-full mt-2 font-medium"
                >
                  Request Payout {amountUsd && Number(amountUsd) > 0 ? `(${money(Number(amountUsd))})` : ""}
                </Button>
              </form>
            ) : (
              <div className="space-y-3 rounded-xl border border-dashed border-border bg-[var(--input-bg)] p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-ink-muted">
                  <HiOutlineBanknotes className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Payout Form Locked</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Reach the minimum $500 payout threshold to request cash withdrawals. You currently have {money(data.payableBalanceUsd)} payable balance.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={copyLink}
                  className="text-xs"
                >
                  <HiOutlineShare className="mr-1.5 h-3.5 w-3.5" />
                  Share Link to Earn More
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Affiliate Reporting Ledger & Interactive Tabs */}
      <Card className="border-border bg-surface shadow-[var(--shadow-card)]">
        <CardHeader className="border-b border-border pb-0">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-ink">
                Affiliate Activity & Reporting
              </CardTitle>
              <p className="text-xs text-ink-muted">
                Audit and inspect all tracked sign-ups, deal conversions, subscription renewals, and payouts.
              </p>
            </div>

            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-[var(--input-bg)] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("sales")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "sales"
                    ? "bg-surface text-ink shadow-sm dark:bg-white/10"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Sales & Renewals ({data.sales.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("signups")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "signups"
                    ? "bg-surface text-ink shadow-sm dark:bg-white/10"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Referred Sign-ups ({data.referrals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("payouts")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "payouts"
                    ? "bg-surface text-ink shadow-sm dark:bg-white/10"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Payout History ({data.withdrawals.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("faq")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "faq"
                    ? "bg-surface text-ink shadow-sm dark:bg-white/10"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Program FAQ
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* TAB 1: Sales & Renewals Ledger */}
          {activeTab === "sales" ? (
            <div>
              {!data.sales.length ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-ink-muted">
                    <HiOutlineShoppingBag className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-ink">No sales tracked yet</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    When visitors you refer purchase a plan or renew their monthly subscription, your 30% commission will record here instantly.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                      <tr>
                        <th className="px-2 py-2.5 font-medium">Customer</th>
                        <th className="px-2 py-2.5 font-medium">Plan / Package</th>
                        <th className="px-2 py-2.5 font-medium">Type</th>
                        <th className="px-2 py-2.5 font-medium">Deal Price</th>
                        <th className="px-2 py-2.5 font-medium">Rate</th>
                        <th className="px-2 py-2.5 font-medium">Commission</th>
                        <th className="px-2 py-2.5 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.sales.map((s) => (
                        <tr key={s.id} className="hover:bg-[var(--input-bg)]">
                          <td className="px-2 py-3">
                            <p className="font-semibold text-ink">
                              {s.customerName || "Customer"}
                            </p>
                            <p className="text-[11px] text-ink-muted">{s.customerEmail}</p>
                          </td>
                          <td className="px-2 py-3 font-medium text-ink capitalize">
                            {s.plan}
                          </td>
                          <td className="px-2 py-3">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                s.type === "renewal"
                                  ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/20 dark:text-purple-300"
                                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300"
                              }`}
                            >
                              {s.type === "renewal" ? "Subscription Renewal" : "Initial Purchase"}
                            </span>
                          </td>
                          <td className="px-2 py-3 tabular-nums font-semibold text-ink">
                            {money(s.amountUsd)}
                          </td>
                          <td className="px-2 py-3 tabular-nums font-medium text-ink-muted">
                            {s.commissionRate || 30}%
                          </td>
                          <td className="px-2 py-3 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            +{money(s.commissionUsd)}
                          </td>
                          <td className="px-2 py-3 text-[12px] text-ink-muted">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {/* TAB 2: Referred Sign-ups */}
          {activeTab === "signups" ? (
            <div>
              {!data.referrals.length ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-ink-muted">
                    <HiOutlineUserGroup className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-ink">No referrals yet</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Share your unique referral link to start tracking user sign-ups and deal conversions.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                      <tr>
                        <th className="px-2 py-2.5 font-medium">Referred User</th>
                        <th className="px-2 py-2.5 font-medium">Current Plan</th>
                        <th className="px-2 py-2.5 font-medium">Status</th>
                        <th className="px-2 py-2.5 font-medium">Sales Count</th>
                        <th className="px-2 py-2.5 font-medium">Deal Volume</th>
                        <th className="px-2 py-2.5 font-medium">Total Commission</th>
                        <th className="px-2 py-2.5 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.referrals.map((r) => (
                        <tr key={r.id} className="hover:bg-[var(--input-bg)]">
                          <td className="px-2 py-3">
                            <p className="font-semibold text-ink">
                              {r.referred.companyName || r.referred.name || "Referred Lead"}
                            </p>
                            <p className="text-[11px] text-ink-muted">{r.referred.email}</p>
                          </td>
                          <td className="px-2 py-3 font-medium text-ink capitalize">
                            {r.referred.plan || "free"}
                          </td>
                          <td className="px-2 py-3">
                            <Badge
                              variant={r.status === "rewarded" ? "verified" : "default"}
                            >
                              {r.status === "rewarded" ? "Active Customer" : "Registered Free"}
                            </Badge>
                          </td>
                          <td className="px-2 py-3 tabular-nums font-medium text-ink">
                            {r.totalSalesCount || (r.status === "rewarded" ? 1 : 0)}
                          </td>
                          <td className="px-2 py-3 tabular-nums font-semibold text-ink">
                            {money(r.totalRevenueUsd || 0)}
                          </td>
                          <td className="px-2 py-3 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                            {money((r.totalCommissionUsd || r.commissionUsd || 0) + (r.milestoneBonusUsd || 0))}
                          </td>
                          <td className="px-2 py-3 text-[12px] text-ink-muted">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {/* TAB 3: Payout History */}
          {activeTab === "payouts" ? (
            <div>
              {!data.withdrawals.length ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-ink-muted">
                    <HiOutlineBanknotes className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-ink">No payouts yet</h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Once your payable commission balance reaches $500, submit a payout request and it will display here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-left text-sm">
                    <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                      <tr>
                        <th className="px-2 py-2.5 font-medium">Amount</th>
                        <th className="px-2 py-2.5 font-medium">Method</th>
                        <th className="px-2 py-2.5 font-medium">Payout Details</th>
                        <th className="px-2 py-2.5 font-medium">Status</th>
                        <th className="px-2 py-2.5 font-medium">Requested</th>
                        <th className="px-2 py-2.5 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {data.withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-[var(--input-bg)]">
                          <td className="px-2 py-3 tabular-nums font-bold text-ink">
                            {money(w.amountUsd)}
                          </td>
                          <td className="px-2 py-3 capitalize text-ink font-medium">
                            {w.method}
                          </td>
                          <td className="px-2 py-3 text-xs text-ink-muted font-mono">
                            {w.payoutDetails}
                          </td>
                          <td className="px-2 py-3">
                            <Badge
                              variant={
                                w.status === "paid"
                                  ? "verified"
                                  : w.status === "rejected"
                                    ? "hot"
                                    : "warm"
                              }
                            >
                              {w.status === "paid"
                                ? "Paid / Disbursed"
                                : w.status === "rejected"
                                  ? "Rejected"
                                  : "In Review"}
                            </Badge>
                          </td>
                          <td className="px-2 py-3 text-[12px] text-ink-muted">
                            {new Date(w.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-3 text-[12px] text-ink-muted">
                            {w.adminNote || (w.processedAt ? `Processed on ${new Date(w.processedAt).toLocaleDateString()}` : "Pending review")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {/* TAB 4: Program FAQ & Terms */}
          {activeTab === "faq" ? (
            <div className="space-y-4 py-2 text-[13px] text-ink">
              <div className="rounded-xl border border-border p-4 space-y-1 bg-[var(--input-bg)]">
                <h4 className="font-semibold text-ink flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4 text-brand-600" />
                  What is the affiliate commission rate?
                </h4>
                <p className="text-ink-muted leading-relaxed">
                  You earn <strong>30% cash commission</strong> on every eligible deal or package price purchased by users who register through your referral link.
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-1 bg-[var(--input-bg)]">
                <h4 className="font-semibold text-ink flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4 text-brand-600" />
                  Are recurring subscription renewals included?
                </h4>
                <p className="text-ink-muted leading-relaxed">
                  <strong>Yes!</strong> As long as your referred customer maintains an active subscription, you continue to earn 30% recurring commission every billing cycle when their plan renews.
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-1 bg-[var(--input-bg)]">
                <h4 className="font-semibold text-ink flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4 text-brand-600" />
                  What is the minimum payout threshold?
                </h4>
                <p className="text-ink-muted leading-relaxed">
                  The minimum payout threshold is <strong>$500.00</strong>. Affiliates become eligible to request a cash withdrawal once their payable commission balance reaches $500.
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-1 bg-[var(--input-bg)]">
                <h4 className="font-semibold text-ink flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4 text-brand-600" />
                  How does referral attribution work?
                </h4>
                <p className="text-ink-muted leading-relaxed">
                  When a prospective contractor or agency visits Contractor Leads via your referral link, an attribution cookie is securely stored in their browser for <strong>30 days</strong>. If they register an account during that period, their account is permanently attributed to your affiliate ID.
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-1 bg-[var(--input-bg)]">
                <h4 className="font-semibold text-ink flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4 text-brand-600" />
                  Which payout methods are supported?
                </h4>
                <p className="text-ink-muted leading-relaxed">
                  We disburse payouts via <strong>PayPal</strong>, <strong>Direct Bank Wire / ACH</strong>, or <strong>Wise</strong>. Payout requests are verified and disbursed promptly by our accounting team.
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
