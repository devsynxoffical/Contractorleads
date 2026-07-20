"use client";

function readUtm() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
  };
}

function basePayload() {
  return {
    landingPath: typeof window !== "undefined" ? window.location.pathname : "/",
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    ...readUtm(),
  };
}

export async function recordMarketingVisit() {
  await fetch("/api/marketing/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(basePayload()),
  }).catch(() => undefined);
}

export async function subscribeMarketingEmail(input: {
  email: string;
  source: string;
  emailOptIn?: boolean;
}) {
  const res = await fetch("/api/marketing/subscribe", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...basePayload(),
      email: input.email,
      source: input.source,
      emailOptIn: input.emailOptIn ?? true,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not save email");
  }
  return data;
}
