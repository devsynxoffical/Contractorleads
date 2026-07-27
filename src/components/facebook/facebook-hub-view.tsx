"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaFacebook } from "react-icons/fa";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineLinkSlash,
  HiOutlineMegaphone,
} from "react-icons/hi2";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FbConnection =
  | {
      connected: false;
      oauthConfigured: boolean;
      schemaPending?: boolean;
    }
  | {
      connected: true;
      oauthConfigured: boolean;
      expired: boolean;
      profile: {
        id: string;
        name: string | null;
        pictureUrl: string | null;
        connectedAt: string | null;
        expiresAt: string | null;
      };
    };

type HubAd = {
  id: string;
  pageName: string;
  pageId: string;
  adSnapshotUrl: string;
  adCreativeBodies: string[];
  adDeliveryStartTime?: string;
  publisherPlatforms: string[];
  hasStory: boolean;
  placementLabels: string[];
};

type HubLead = {
  id: string;
  businessName: string;
  city: string | null;
  state: string | null;
  industry: string | null;
  facebook: string | null;
  leadScore: number | null;
  qualityTier: string | null;
  facebookAdsCheckedAt: string | null;
  adsChecked: boolean;
  totalAds: number;
  storyAds: number;
  searchUrl: string | null;
  message: string | null;
  ads: HubAd[];
};

type HubPayload = {
  connection: FbConnection;
  leads: HubLead[];
  counts: {
    withFacebook: number;
    withAds: number;
    withStories: number;
  };
};

type Banner = { type: "ok" | "err"; text: string };

function bannerFromSearchParams(searchParams: URLSearchParams): Banner | null {
  if (searchParams.get("connected") === "1") {
    return { type: "ok", text: "Facebook profile connected." };
  }
  const error = searchParams.get("error");
  if (!error) return null;
  if (error === "oauth_not_configured") {
    return {
      type: "err",
      text: "Facebook OAuth is not configured. Ask your admin to set META_APP_ID and META_APP_SECRET, then add the callback URL in Meta Developer settings.",
    };
  }
  return { type: "err", text: error };
}

export function FacebookHubView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<HubPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(() =>
    bannerFromSearchParams(searchParams),
  );
  const cleanedQuery = useRef(false);

  const applyHubPayload = useCallback(
    (json: HubPayload & { error?: string }, ok: boolean) => {
      if (!ok && !json.leads) {
        setBanner({ type: "err", text: json.error || "Could not load FB hub" });
        setData(null);
        return;
      }
      setData({
        connection: json.connection,
        leads: Array.isArray(json.leads) ? json.leads : [],
        counts: json.counts ?? {
          withFacebook: 0,
          withAds: 0,
          withStories: 0,
        },
      });
      if (ok && json.error) {
        setBanner({ type: "err", text: json.error });
      }
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facebook/hub");
      const json = (await res.json()) as HubPayload & { error?: string };
      applyHubPayload(json, res.ok);
    } catch {
      setBanner({ type: "err", text: "Could not load FB hub" });
    } finally {
      setLoading(false);
    }
  }, [applyHubPayload]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/facebook/hub");
        const json = (await res.json()) as HubPayload & { error?: string };
        if (cancelled) return;
        applyHubPayload(json, res.ok);
      } catch {
        if (!cancelled) {
          setBanner({ type: "err", text: "Could not load FB hub" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyHubPayload]);

  useEffect(() => {
    if (cleanedQuery.current) return;
    if (!searchParams.get("connected") && !searchParams.get("error")) return;
    cleanedQuery.current = true;
    router.replace("/facebook", { scroll: false });
  }, [searchParams, router]);

  async function disconnect() {
    if (!confirm("Disconnect your Facebook profile from Contractor Leads?")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/facebook", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setBanner({
          type: "err",
          text: (json as { error?: string }).error || "Disconnect failed",
        });
        return;
      }
      setBanner({ type: "ok", text: "Facebook disconnected." });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const connection = data?.connection;
  const connected = connection?.connected === true;

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Facebook"
        description="Sync your Facebook profile, then review Meta ads and story placements for your leads."
        actions={
          connected ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={disconnect}
              loading={busy}
            >
              <HiOutlineLinkSlash className="h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <a
              href="/api/integrations/facebook/start"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1877F2] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#166fe5]"
            >
              <FaFacebook className="h-4 w-4" />
              Connect Facebook
            </a>
          )
        }
      />

      {banner && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl px-4 py-3 text-[13px]",
            banner.type === "ok"
              ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80"
              : "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80",
          )}
        >
          {banner.type === "ok" ? (
            <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <HiOutlineExclamationCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{banner.text}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaFacebook className="h-5 w-5 text-[#1877F2]" />
            Profile sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !connection ? (
            <p className="text-[13px] text-ink-muted">Loading…</p>
          ) : connected && connection.connected ? (
            <div className="flex flex-wrap items-center gap-4">
              {connection.profile.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- FB CDN hosts vary by region
                <img
                  src={connection.profile.pictureUrl}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-[#1877F2]/25"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2]/15 text-[#1877F2]">
                  <FaFacebook className="h-7 w-7" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">
                  {connection.profile.name || "Facebook user"}
                </p>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  Connected
                  {connection.profile.connectedAt
                    ? ` · ${new Date(connection.profile.connectedAt).toLocaleDateString()}`
                    : ""}
                  {connection.expired ? " · token expired — reconnect" : ""}
                </p>
                <p className="mt-1 text-[12px] text-ink-faint">
                  Your token is used when checking Ads Library for leads.
                </p>
              </div>
              {connection.expired && (
                <a
                  href="/api/integrations/facebook/start"
                  className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl bg-[#1877F2] px-3 text-[12px] font-semibold text-white"
                >
                  Reconnect
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Connect your Facebook profile to sync ads lookups with your Meta
                access. You&apos;ll then see lead Facebook pages, active ads, and
                story placements in this section.
              </p>
              {!connection?.oauthConfigured && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                  OAuth is not configured on this server yet. Set{" "}
                  <code className="font-mono text-[11px]">META_APP_ID</code> and{" "}
                  <code className="font-mono text-[11px]">META_APP_SECRET</code>,
                  and add{" "}
                  <code className="font-mono text-[11px]">
                    /api/integrations/facebook/callback
                  </code>{" "}
                  as a Valid OAuth Redirect URI in Meta Developer.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "FB pages",
            value: data?.counts.withFacebook ?? 0,
            hint: "Leads with a Facebook URL",
          },
          {
            label: "Active ads",
            value: data?.counts.withAds ?? 0,
            hint: "Leads with Ads Library hits",
          },
          {
            label: "Story ads",
            value: data?.counts.withStories ?? 0,
            hint: "Ads with Stories placement",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-soft)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HiOutlineMegaphone className="h-5 w-5 text-brand-600" />
            Lead ads & stories
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
              Coming soon
            </span>
          </CardTitle>
          <p className="mt-1 text-[12px] text-ink-muted">
            Facebook Ads Library checks for your leads — including Stories
            placements.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 px-4 py-8 text-center">
            <p className="text-[14px] font-semibold text-amber-950">
              Coming soon
            </p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-amber-900/80">
              Meta Ads Library scanning is temporarily unavailable for both
              agency and admin workspaces while we finish this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
