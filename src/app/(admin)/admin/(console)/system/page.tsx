"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import type { EnvKeyStatus } from "@/lib/admin";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

type RazorpayStatus = {
  configured: boolean;
  liveReady: boolean;
  source: string;
  keyIdMasked: string | null;
  keySecretConfigured: boolean;
  webhookSecretConfigured: boolean;
  mode: "live" | "test" | "none";
  updatedAt: string | null;
  webhookUrl: string;
};

type EmailStatus = {
  resendConfigured: boolean;
  resendHint: string | null;
  sendgridConfigured: boolean;
  sendgridHint: string | null;
  fromEmail: string;
  liveReady: boolean;
  provider: string;
  source: string;
  updatedAt: string | null;
};

type TwilioStatus = {
  accountSidConfigured: boolean;
  accountSidHint: string | null;
  authTokenConfigured: boolean;
  authTokenHint: string | null;
  fromNumber: string;
  messagingServiceSid: string;
  liveReady: boolean;
  source: string;
  updatedAt: string | null;
  webhookUrl: string;
};

type PlatformKeyStatus = {
  field: string;
  key: string;
  group: string;
  configured: boolean;
  source: "database" | "environment" | "none";
  hint: string | null;
};

const PLATFORM_FIELDS: Array<{
  field: string;
  label: string;
  placeholder: string;
  group: string;
}> = [
  {
    field: "googlePlacesApiKey",
    label: "Google Places API key",
    placeholder: "AIza…",
    group: "Lead sources",
  },
  {
    field: "googlePlacesApiKey2",
    label: "Google Places API key (backup)",
    placeholder: "AIza… — used automatically if the primary fails",
    group: "Lead sources",
  },
  {
    field: "yelpFusionApiKey",
    label: "Yelp Fusion API key",
    placeholder: "Yelp Fusion key",
    group: "Lead sources",
  },
  {
    field: "openaiApiKey",
    label: "OpenAI API key",
    placeholder: "sk-…",
    group: "AI",
  },
  {
    field: "serperApiKey",
    label: "Serper API key",
    placeholder: "64-char key from serper.dev",
    group: "Enrichment",
  },
  {
    field: "ninjapearApiKey",
    label: "NinjaPear API key",
    placeholder: "NinjaPear (nubela.co) key",
    group: "Enrichment",
  },
  {
    field: "metaAppId",
    label: "Meta App ID",
    placeholder: "Facebook App ID",
    group: "Meta",
  },
  {
    field: "metaAppSecret",
    label: "Meta App Secret",
    placeholder: "Facebook App Secret",
    group: "Meta",
  },
  {
    field: "metaAccessToken",
    label: "Meta Access Token",
    placeholder: "Long-lived access token",
    group: "Meta",
  },
];

const PLATFORM_GROUPS = ["Lead sources", "AI", "Enrichment", "Meta"] as const;

export default function AdminSystemPage() {
  const [keys, setKeys] = useState<EnvKeyStatus[]>([]);
  const [note, setNote] = useState("");
  const [razorpay, setRazorpay] = useState<RazorpayStatus | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState("");
  const [razorpayBusy, setRazorpayBusy] = useState(false);
  const [razorpayMessage, setRazorpayMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<EmailStatus | null>(null);
  const [resendApiKey, setResendApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [twilio, setTwilio] = useState<TwilioStatus | null>(null);
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [twilioMessagingSid, setTwilioMessagingSid] = useState("");
  const [twilioBusy, setTwilioBusy] = useState(false);
  const [twilioMessage, setTwilioMessage] = useState<string | null>(null);
  const [platformKeys, setPlatformKeys] = useState<PlatformKeyStatus[]>([]);
  const [platformValues, setPlatformValues] = useState<Record<string, string>>(
    {},
  );
  const [platformBusy, setPlatformBusy] = useState(false);
  const [platformMessage, setPlatformMessage] = useState<string | null>(null);

  async function load() {
    const [sys, razorpayRes, emailRes, twilioRes, platformRes] =
      await Promise.all([
        fetch("/api/admin/system").then((r) => r.json()),
        fetch("/api/admin/razorpay").then((r) => r.json()),
        fetch("/api/admin/email-provider").then((r) => r.json()),
        fetch("/api/admin/twilio").then((r) => r.json()),
        fetch("/api/admin/platform-keys").then((r) => r.json()),
      ]);
    setKeys(sys.keys ?? []);
    setNote(sys.note ?? "");
    setRazorpay(razorpayRes);
    setRazorpayKeyId("");
    setRazorpayKeySecret("");
    setRazorpayWebhookSecret("");
    setEmail(emailRes);
    setFromEmail(emailRes.fromEmail || "");
    setResendApiKey("");
    setTwilio(twilioRes);
    setTwilioFromNumber(twilioRes.fromNumber || "");
    setTwilioMessagingSid(twilioRes.messagingServiceSid || "");
    setTwilioAccountSid("");
    setTwilioAuthToken("");
    setPlatformKeys(platformRes.keys ?? []);
    setPlatformValues({});
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailBusy(true);
    setEmailMessage(null);
    try {
      const res = await fetch("/api/admin/email-provider", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resendApiKey: resendApiKey.trim() || undefined,
          fromEmail,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setEmailMessage(
        json.liveReady
          ? "Email settings saved. Live sending is active."
          : "Saved, but no provider key yet — emails cannot be sent.",
      );
      setEmail(json);
      setResendApiKey("");
    } catch (err) {
      setEmailMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEmailBusy(false);
    }
  }

  async function saveTwilio(e: React.FormEvent) {
    e.preventDefault();
    setTwilioBusy(true);
    setTwilioMessage(null);
    try {
      const res = await fetch("/api/admin/twilio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: twilioAccountSid.trim() || undefined,
          authToken: twilioAuthToken.trim() || undefined,
          fromNumber: twilioFromNumber,
          messagingServiceSid: twilioMessagingSid,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setTwilioMessage(
        json.liveReady
          ? "Twilio saved. SMS sending is ready."
          : "Saved, but SID/token/from number still incomplete.",
      );
      setTwilio(json);
      setTwilioAccountSid("");
      setTwilioAuthToken("");
      setTwilioFromNumber(json.fromNumber || "");
      setTwilioMessagingSid(json.messagingServiceSid || "");
    } catch (err) {
      setTwilioMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setTwilioBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function savePlatformKeys(e: React.FormEvent) {
    e.preventDefault();
    setPlatformBusy(true);
    setPlatformMessage(null);
    try {
      const body: Record<string, string> = {};
      for (const f of PLATFORM_FIELDS) {
        const v = (platformValues[f.field] ?? "").trim();
        if (v) body[f.field] = v;
      }
      const res = await fetch("/api/admin/platform-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setPlatformMessage("Platform keys saved — effective values updated.");
      setPlatformKeys(json.keys ?? []);
      setPlatformValues({});
    } catch (err) {
      setPlatformMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPlatformBusy(false);
    }
  }

  async function clearPlatformKey(field: string) {
    setPlatformBusy(true);
    setPlatformMessage(null);
    try {
      const res = await fetch("/api/admin/platform-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Clear failed");
      setPlatformMessage("Cleared — env fallback applies if set.");
      setPlatformKeys(json.keys ?? []);
      setPlatformValues((v) => ({ ...v, [field]: "" }));
    } catch (err) {
      setPlatformMessage(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setPlatformBusy(false);
    }
  }

  async function saveRazorpay(e: React.FormEvent) {
    e.preventDefault();
    setRazorpayBusy(true);
    startNavigationProgress();
    setRazorpayMessage(null);
    try {
      const res = await fetch("/api/admin/razorpay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId: razorpayKeyId.trim() || undefined,
          keySecret: razorpayKeySecret.trim() || undefined,
          webhookSecret: razorpayWebhookSecret.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setRazorpayMessage(
        json.configured
          ? `Razorpay settings saved (${json.mode.toUpperCase()} mode). Checkout is ready.`
          : "Saved, but Key ID or Secret is incomplete.",
      );
      await load();
    } catch (err) {
      setRazorpayMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setRazorpayBusy(false);
      stopNavigationProgress();
    }
  }

  async function clearRazorpaySecret(
    which: "keyId" | "keySecret" | "webhookSecret",
  ) {
    setRazorpayBusy(true);
    setRazorpayMessage(null);
    try {
      const res = await fetch("/api/admin/razorpay", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clearKeyId: which === "keyId",
          clearKeySecret: which === "keySecret",
          clearWebhookSecret: which === "webhookSecret",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Clear failed");
      setRazorpayMessage("Cleared. Default credentials still apply.");
      await load();
    } catch (err) {
      setRazorpayMessage(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setRazorpayBusy(false);
    }
  }

  const groups = [...new Set(keys.map((k) => k.group))];

  return (
    <div>
      <AdminPageHeader
        title="System & API Keys"
        description="Manage Stripe Billing, email, SMS, Hostinger SMTP mailboxes, and platform API keys here. Other host-level secrets stay in Railway / .env."
      />

      <section className="mb-6 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/10 via-[var(--surface)] to-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-brand-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-400">
                Outbound Pool
              </span>
              <h2 className="text-sm font-semibold text-ink">
                Super Admin Hostinger SMTP Pool
              </h2>
            </div>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
              25 Hostinger mailboxes across 5 domains (<code>roofingagency.us</code>, <code>roofinggrowth.us</code>, <code>roofingmedia.us</code>, <code>roofingpartners.us</code>, <code>roofingclients.us</code>) available for platform-wide cold email outreach and automatic load rotation.
            </p>
          </div>
          <Link
            href="/admin/smtp"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            Manage 25 Mailboxes →
          </Link>
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Transactional email
            </h2>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
              Powers signup verification, password resets, and purchase
              confirmations. Lead outreach uses each user&apos;s own Resend key
              under Setup → Email — not this admin key.
            </p>
          </div>
          {email ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                email.liveReady
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-amber-500/15 text-amber-800"
              }`}
            >
              {email.liveReady ? "Live" : "Not configured"}
            </span>
          ) : null}
        </div>

        {email ? (
          <p className="mt-3 text-[12px] text-ink-faint">
            Provider: {email.provider} · Source: {email.source}
            {email.updatedAt
              ? ` · Updated ${new Date(email.updatedAt).toLocaleString()}`
              : ""}
          </p>
        ) : null}

        <form onSubmit={saveEmail} className="mt-4 space-y-3">
          <label className="block text-[12px] font-medium text-ink-muted">
            Resend API key (re_…)
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                email?.resendConfigured
                  ? `Configured ${email.resendHint || ""} — paste to replace`
                  : "re_…"
              }
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
            />
          </label>

          <label className="block text-[12px] font-medium text-ink-muted">
            From address (must use a domain verified in Resend)
            <input
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder="Contractor Leads <hello@contractorleads.us>"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </label>
          <p className="text-[12px] text-ink-muted">
            Prefer a replyable address like hello@ or support@ — avoid noreply@.
            For best deliverability, send from a subdomain (e.g.
            mail.contractorleads.us) once it&apos;s verified in Resend.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" disabled={emailBusy} size="sm">
              {emailBusy ? "Saving…" : "Save email settings"}
            </Button>
            {emailMessage ? (
              <p className="text-[13px] text-ink-muted">{emailMessage}</p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Twilio SMS</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
              Powers text messaging for users with the Messaging add-on. Buy a
              US number in Twilio, then paste credentials here (or set env
              vars).
            </p>
          </div>
          {twilio ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                twilio.liveReady
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-amber-500/15 text-amber-800"
              }`}
            >
              {twilio.liveReady ? "Live" : "Not configured"}
            </span>
          ) : null}
        </div>

        {twilio ? (
          <p className="mt-3 text-[12px] text-ink-faint">
            Source: {twilio.source}
            {twilio.updatedAt
              ? ` · Updated ${new Date(twilio.updatedAt).toLocaleString()}`
              : ""}
          </p>
        ) : null}

        <form onSubmit={saveTwilio} className="mt-4 space-y-3">
          <label className="block text-[12px] font-medium text-ink-muted">
            Account SID (AC…)
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                twilio?.accountSidConfigured
                  ? `Configured ${twilio.accountSidHint || ""} — paste to replace`
                  : "AC…"
              }
              value={twilioAccountSid}
              onChange={(e) => setTwilioAccountSid(e.target.value)}
            />
          </label>

          <label className="block text-[12px] font-medium text-ink-muted">
            Auth Token
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                twilio?.authTokenConfigured
                  ? `Configured ${twilio.authTokenHint || ""} — paste to replace`
                  : "Auth token from Twilio Console"
              }
              value={twilioAuthToken}
              onChange={(e) => setTwilioAuthToken(e.target.value)}
            />
          </label>

          <label className="block text-[12px] font-medium text-ink-muted">
            From number (E.164)
            <input
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder="+15551234567"
              value={twilioFromNumber}
              onChange={(e) => setTwilioFromNumber(e.target.value)}
            />
          </label>

          <label className="block text-[12px] font-medium text-ink-muted">
            Messaging Service SID (optional, MG…)
            <input
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder="MG… — preferred over From number when set"
              value={twilioMessagingSid}
              onChange={(e) => setTwilioMessagingSid(e.target.value)}
            />
          </label>

          {twilio?.webhookUrl ? (
            <p className="rounded-lg bg-[#faf8fc] px-3 py-2 text-[12px] text-ink-muted dark:bg-[var(--input-bg)]">
              Inbound webhook (paste in Twilio → Phone Number → Messaging):
              <br />
              <span className="font-mono text-[11px] text-ink">
                {twilio.webhookUrl}
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" disabled={twilioBusy} size="sm">
              {twilioBusy ? "Saving…" : "Save Twilio settings"}
            </Button>
            {twilioMessage ? (
              <p className="text-[13px] text-ink-muted">{twilioMessage}</p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Razorpay Payment Gateway</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
              Live and test payment processing for subscriptions, credits, and add-ons.
            </p>
          </div>
          {razorpay ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                razorpay?.liveReady
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : razorpay?.configured
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                    : "bg-rose-500/15 text-rose-800"
              }`}
            >
              {razorpay?.liveReady
                ? "Live Mode Ready"
                : razorpay?.configured
                  ? "Test Mode Active"
                  : "Incomplete"}
            </span>
          ) : null}
        </div>

        {razorpay ? (
          <p className="mt-3 text-[12px] text-ink-faint">
            Source: {razorpay.source}
            {razorpay.updatedAt
              ? ` · Updated ${new Date(razorpay.updatedAt).toLocaleString()}`
              : ""}
            {" · "}
            Webhook URL:{" "}
            <code className="font-mono text-ink-muted">{razorpay.webhookUrl}</code>
          </p>
        ) : null}

        <form onSubmit={saveRazorpay} className="mt-4 space-y-3">
          <label className="block text-[12px] font-medium text-ink-muted">
            Razorpay Key ID (rzp_live_… / rzp_test_…)
            <input
              type="text"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                razorpay?.keyIdMasked
                  ? `Configured ${razorpay.keyIdMasked} — paste to replace`
                  : "rzp_live_…"
              }
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
            />
          </label>
          {razorpay?.configured ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() => void clearRazorpaySecret("keyId")}
              disabled={razorpayBusy}
            >
              Reset to default Key ID
            </button>
          ) : null}

          <label className="block text-[12px] font-medium text-ink-muted">
            Razorpay Key Secret
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                razorpay?.keySecretConfigured
                  ? "Configured (Live Secret Active) — paste to replace"
                  : "Paste your Razorpay Key Secret"
              }
              value={razorpayKeySecret}
              onChange={(e) => setRazorpayKeySecret(e.target.value)}
            />
          </label>
          {razorpay?.keySecretConfigured ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() => void clearRazorpaySecret("keySecret")}
              disabled={razorpayBusy}
            >
              Reset to default Key Secret
            </button>
          ) : null}

          <label className="block text-[12px] font-medium text-ink-muted">
            Webhook Secret (optional, for signature verification)
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                razorpay?.webhookSecretConfigured
                  ? "Configured — paste to replace"
                  : "Webhook secret from Razorpay Dashboard → Webhooks"
              }
              value={razorpayWebhookSecret}
              onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
            />
          </label>
          {razorpay?.webhookSecretConfigured ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() => void clearRazorpaySecret("webhookSecret")}
              disabled={razorpayBusy}
            >
              Clear saved webhook secret
            </button>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={razorpayBusy} size="sm">
              {razorpayBusy ? "Saving…" : "Save Razorpay settings"}
            </Button>
            {razorpayMessage ? (
              <p className="text-[13px] text-ink-muted font-medium">{razorpayMessage}</p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mb-6 rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Platform API keys</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
              Serper, Google Places, OpenAI, NinjaPear, Yelp Fusion, and Meta
              secrets used by Lead Finder, enrichment, AI scoring, and the Ads
              Library. Empty fields fall back to Railway / .env — no need to
              redeploy when you rotate a key here. Google Places supports a
              backup key that is used automatically if the primary hits quota,
              billing, or auth errors.
            </p>
          </div>
        </div>

        <form onSubmit={savePlatformKeys} className="mt-4 space-y-4">
          {PLATFORM_GROUPS.map((group) => {
            const fields = PLATFORM_FIELDS.filter((f) => f.group === group);
            if (!fields.length) return null;
            return (
              <div key={group}>
                <p className="text-[12px] font-semibold text-ink">{group}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {fields.map((f) => {
                    const status = platformKeys.find(
                      (k) => k.field === f.field,
                    );
                    return (
                      <label
                        key={f.field}
                        className="block text-[12px] font-medium text-ink-muted"
                      >
                        {f.label}
                        <input
                          type="password"
                          autoComplete="off"
                          className="saas-input mt-1.5 font-mono text-[13px]"
                          placeholder={
                            status?.configured
                              ? `Configured ${status.hint || ""} — paste to replace`
                              : f.placeholder
                          }
                          value={platformValues[f.field] ?? ""}
                          onChange={(e) =>
                            setPlatformValues((v) => ({
                              ...v,
                              [f.field]: e.target.value,
                            }))
                          }
                        />
                        {status?.source === "database" ? (
                          <span className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700">
                            Saved in database
                            <button
                              type="button"
                              className="font-semibold text-brand-600 hover:underline"
                              onClick={() => void clearPlatformKey(f.field)}
                              disabled={platformBusy}
                            >
                              Clear
                            </button>
                          </span>
                        ) : status?.source === "environment" ? (
                          <span className="mt-1 block text-[11px] text-ink-faint">
                            From environment (Railway / .env)
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" disabled={platformBusy} size="sm">
              {platformBusy ? "Saving…" : "Save platform keys"}
            </Button>
            {platformMessage ? (
              <p className="text-[13px] text-ink-muted">{platformMessage}</p>
            ) : null}
          </div>
        </form>
      </section>

      {note && (
        <p className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {note}
        </p>
      )}

      <div className="space-y-5">
        {groups.map((group) => (
          <section
            key={group}
            className="rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]"
          >
            <h2 className="text-sm font-semibold text-ink">{group}</h2>
            <ul className="mt-3 space-y-2">
              {keys
                .filter((k) => k.group === group)
                .map((k) => (
                  <li
                    key={k.key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#faf8fc] px-3 py-2 text-[13px] dark:bg-[var(--input-bg)]"
                  >
                    <span className="font-mono text-[12px] text-ink">
                      {k.key}
                    </span>
                    <span className="text-[12px] text-ink-muted">
                      {k.configured ? (
                        <>
                          Configured{" "}
                          <span className="font-mono text-ink-faint">
                            {k.hint}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-amber-800">
                          Missing
                        </span>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
