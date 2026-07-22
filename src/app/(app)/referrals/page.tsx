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
  creditsPerReferral: number;
  successfulReferrals: number;
  creditsEarned: number;
  milestones: Array<{ minReferrals: number; bonusCredits: number }>;
  progressToNext: {
    current: number;
    target: number;
    remaining: number;
    bonusCredits: number;
  } | null;
  referrals: Array<{
    id: string;
    status: string;
    rewardCredits: number;
    milestoneBonus: number;
    createdAt: string;
    referred: {
      email: string;
      name: string | null;
      companyName: string | null;
      createdAt: string;
    };
  }>;
};

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed to load");
        setData(json);
      })
      .catch((e) =>
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

  if (error) {
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

  return (
    <div className="page-pad space-y-5">
      <PageHeader
        title="Referrals"
        description={
          data.enabled
            ? `Earn ${data.creditsPerReferral} credits for every agency that signs up with your link. Hit milestones for bonus credits.`
            : "The referral program is currently paused by an admin."
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Successful referrals
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {data.successfulReferrals}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Credits earned
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {Math.round(data.creditsEarned * 10) / 10}
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

      {data.progressToNext && (
        <Card>
          <CardContent className="py-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Next milestone: {data.progressToNext.target} referrals
                </p>
                <p className="mt-1 text-[13px] text-ink-muted">
                  {data.progressToNext.remaining} more to unlock{" "}
                  <strong>{data.progressToNext.bonusCredits} bonus credits</strong>
                </p>
              </div>
              <p className="text-[13px] tabular-nums text-ink-muted">
                {data.progressToNext.current} / {data.progressToNext.target}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0ebf5]">
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
      )}

      {data.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Milestone rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.milestones.map((m) => {
                const hit = data.successfulReferrals >= m.minReferrals;
                return (
                  <li
                    key={m.minReferrals}
                    className="flex items-center justify-between rounded-xl border border-border bg-[#faf8fb] px-3 py-2.5 text-[13px]"
                  >
                    <span>
                      {m.minReferrals}+ referrals
                    </span>
                    <span className="font-semibold tabular-nums text-brand-700">
                      +{m.bonusCredits} credits
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
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">People you referred</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.referrals.length ? (
            <p className="text-sm text-ink-muted">
              No referrals yet. Share your link to start earning credits.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-faint">
                  <tr>
                    <th className="px-2 py-2 font-medium">User</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Credits</th>
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
                      <td className="px-2 py-2.5 capitalize">{r.status}</td>
                      <td className="px-2 py-2.5 tabular-nums">
                        {r.rewardCredits + r.milestoneBonus}
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
    </div>
  );
}
