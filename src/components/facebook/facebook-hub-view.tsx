"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaFacebook } from "react-icons/fa";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineLinkSlash,
  HiOutlineMegaphone,
} from "react-icons/hi2";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { leadDetailHref } from "@/lib/nav-context";

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
    return { type: "ok", text: "Facebook connected." };
  }
  const error = searchParams.get("error");
  if (!error) return null;
  if (error === "oauth_not_configured" || error === "connect_unavailable") {
    return {
      type: "err",
      text: "Facebook connect isn’t available yet. You can still browse Facebook pages found on your leads below.",
    };
  }
  if (error === "access_denied") {
    return { type: "err", text: "Facebook connect was cancelled." };
  }
  return {
    type: "err",
    text: "Couldn’t connect Facebook. Try again in a moment.",
  };
}

function locationLabel(lead: HubLead) {
  return [lead.city, lead.state].filter(Boolean).join(", ") || null;
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
        setBanner({
          type: "err",
          text: "Couldn’t load Facebook for your leads.",
        });
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
      setBanner({
        type: "err",
        text: "Couldn’t load Facebook for your leads.",
      });
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
          setBanner({
            type: "err",
            text: "Couldn’t load Facebook for your leads.",
          });
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
    if (!confirm("Disconnect your Facebook profile?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/facebook", { method: "DELETE" });
      if (!res.ok) {
        setBanner({ type: "err", text: "Couldn’t disconnect. Try again." });
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
  const leads = data?.leads ?? [];

  return (
    <div className="page-pad space-y-6">
      <PageHeader
        title="Facebook"
        description="See Facebook pages and ads tied to your leads."
        backHref="/dashboard"
        backLabel="Back to dashboard"
        crumbs={[
          { label: "Home", href: "/home" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Facebook" },
        ]}
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
          ) : null
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

      <div className="rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
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
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">
                {connection.profile.name || "Facebook account"}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                Connected
                {connection.profile.connectedAt
                  ? ` · ${new Date(connection.profile.connectedAt).toLocaleDateString()}`
                  : ""}
                {connection.expired ? " · session expired" : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2]">
              <FaFacebook className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-ink">
                Profile connect coming soon
              </p>
              <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-ink-muted">
                You can still browse Facebook pages and ads found on your leads
                below. Profile connect will be back once Meta setup is ready.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Facebook pages",
            value: data?.counts.withFacebook ?? 0,
            hint: "Leads with a page",
          },
          {
            label: "Running ads",
            value: data?.counts.withAds ?? 0,
            hint: "Leads with active ads",
          },
          {
            label: "Story ads",
            value: data?.counts.withStories ?? 0,
            hint: "Ads on Stories",
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
              {loading ? "—" : stat.value}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <HiOutlineMegaphone className="h-5 w-5 text-brand-600" />
            <h2 className="text-[15px] font-semibold text-ink">
              Leads on Facebook
            </h2>
          </div>
          <p className="mt-1 text-[12px] text-ink-muted">
            Pages and ads we’ve found for businesses in your workspace.
          </p>
        </div>

        <div className="divide-y divide-border">
          {loading && !leads.length ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-muted">
              Loading leads…
            </p>
          ) : !leads.length ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[14px] font-medium text-ink">
                No Facebook pages yet
              </p>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-muted">
                Generate leads in Lead Finder. When a business has a Facebook
                page, it shows up here.
              </p>
              <Link
                href="/leads/search"
                className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-[13px] font-semibold text-white transition hover:bg-brand-700"
              >
                Open Lead Finder
              </Link>
            </div>
          ) : (
            leads.map((lead) => {
              const place = locationLabel(lead);
              return (
                <div key={lead.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={leadDetailHref(lead.id, "dashboard")}
                        className="text-[14px] font-semibold text-ink hover:text-brand-700"
                      >
                        {lead.businessName}
                      </Link>
                      <p className="mt-0.5 text-[12px] text-ink-muted">
                        {[lead.industry, place].filter(Boolean).join(" · ") ||
                          "Lead"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {lead.facebook ? (
                          <Badge variant="verified">Page found</Badge>
                        ) : null}
                        {lead.totalAds > 0 ? (
                          <Badge variant="brand">
                            {lead.totalAds} ad{lead.totalAds === 1 ? "" : "s"}
                          </Badge>
                        ) : lead.adsChecked ? (
                          <Badge>No active ads</Badge>
                        ) : null}
                        {lead.storyAds > 0 ? (
                          <Badge variant="hot">
                            {lead.storyAds} stor
                            {lead.storyAds === 1 ? "y" : "ies"}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lead.facebook ? (
                        <a
                          href={lead.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[12px] font-semibold text-[#1877F2] transition hover:bg-[#1877F2]/08"
                        >
                          <FaFacebook className="h-3.5 w-3.5" />
                          Open page
                          <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                      {lead.searchUrl ? (
                        <a
                          href={lead.searchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[12px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
                        >
                          Ads Library
                          <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                      <Link
                        href={leadDetailHref(lead.id, "dashboard")}
                        className="inline-flex h-9 items-center rounded-xl border border-border bg-white px-3 text-[12px] font-semibold text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
                      >
                        View lead
                      </Link>
                    </div>
                  </div>

                  {lead.ads.length > 0 ? (
                    <ul className="mt-3 space-y-2 rounded-xl bg-[var(--input-bg)]/50 p-3">
                      {lead.ads.slice(0, 3).map((ad) => (
                        <li
                          key={ad.id || ad.adSnapshotUrl}
                          className="text-[12px] leading-snug text-ink-muted"
                        >
                          <span className="font-medium text-ink">
                            {ad.pageName || "Ad"}
                          </span>
                          {ad.placementLabels.length ? (
                            <span>
                              {" "}
                              · {ad.placementLabels.join(", ")}
                            </span>
                          ) : null}
                          {ad.adCreativeBodies[0] ? (
                            <p className="mt-0.5 line-clamp-2 text-ink-faint">
                              {ad.adCreativeBodies[0]}
                            </p>
                          ) : null}
                          {ad.adSnapshotUrl ? (
                            <a
                              href={ad.adSnapshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-600 hover:underline"
                            >
                              View ad
                              <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                            </a>
                          ) : null}
                        </li>
                      ))}
                      {lead.ads.length > 3 ? (
                        <li className="text-[11px] text-ink-faint">
                          +{lead.ads.length - 3} more ads on this lead
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
