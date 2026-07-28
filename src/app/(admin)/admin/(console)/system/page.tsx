"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import type { EnvKeyStatus } from "@/lib/admin";
import {
  startNavigationProgress,
  stopNavigationProgress,
} from "@/components/layout/navigation-progress";

type StripeStatus = {
  secretKeyConfigured: boolean;
  secretKeyHint: string | null;
  publishableKeyConfigured: boolean;
  publishableKeyHint: string | null;
  webhookSecretConfigured: boolean;
  webhookSecretHint: string | null;
  priceStarter: string;
  priceStarterAnnual: string;
  priceGrowth: string;
  priceGrowthAnnual: string;
  priceAgency: string;
  priceAgencyAnnual: string;
  priceMessaging: string;
  priceSeoReport: string;
  checkoutReady: boolean;
  messagingReady: boolean;
  seoReportReady: boolean;
  source: string;
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

export default function AdminSystemPage() {
  const [keys, setKeys] = useState<EnvKeyStatus[]>([]);
  const [note, setNote] = useState("");
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [priceStarter, setPriceStarter] = useState("");
  const [priceStarterAnnual, setPriceStarterAnnual] = useState("");
  const [priceGrowth, setPriceGrowth] = useState("");
  const [priceGrowthAnnual, setPriceGrowthAnnual] = useState("");
  const [priceAgency, setPriceAgency] = useState("");
  const [priceAgencyAnnual, setPriceAgencyAnnual] = useState("");
  const [priceMessaging, setPriceMessaging] = useState("");
  const [priceSeoReport, setPriceSeoReport] = useState("");
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [sys, stripeRes, emailRes, twilioRes] = await Promise.all([
      fetch("/api/admin/system").then((r) => r.json()),
      fetch("/api/admin/stripe").then((r) => r.json()),
      fetch("/api/admin/email-provider").then((r) => r.json()),
      fetch("/api/admin/twilio").then((r) => r.json()),
    ]);
    setKeys(sys.keys ?? []);
    setNote(sys.note ?? "");
    setStripe(stripeRes);
    setSecretKey("");
    setPublishableKey("");
    setWebhookSecret("");
    setPriceStarter(stripeRes.priceStarter || "");
    setPriceStarterAnnual(stripeRes.priceStarterAnnual || "");
    setPriceGrowth(stripeRes.priceGrowth || "");
    setPriceGrowthAnnual(stripeRes.priceGrowthAnnual || "");
    setPriceAgency(stripeRes.priceAgency || "");
    setPriceAgencyAnnual(stripeRes.priceAgencyAnnual || "");
    setPriceMessaging(stripeRes.priceMessaging || "");
    setPriceSeoReport(stripeRes.priceSeoReport || "");
    setEmail(emailRes);
    setFromEmail(emailRes.fromEmail || "");
    setResendApiKey("");
    setTwilio(twilioRes);
    setTwilioFromNumber(twilioRes.fromNumber || "");
    setTwilioMessagingSid(twilioRes.messagingServiceSid || "");
    setTwilioAccountSid("");
    setTwilioAuthToken("");
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

  async function saveStripe(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    startNavigationProgress();
    setMessage(null);
    try {
      const res = await fetch("/api/admin/stripe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey: secretKey.trim() || undefined,
          publishableKey: publishableKey.trim() || undefined,
          webhookSecret: webhookSecret.trim() || undefined,
          priceStarter,
          priceStarterAnnual,
          priceGrowth,
          priceGrowthAnnual,
          priceAgency,
          priceAgencyAnnual,
          priceMessaging,
          priceSeoReport,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setMessage(
        json.checkoutReady
          ? "Stripe settings saved. Checkout is ready."
          : "Saved. Add secret key + monthly/annual price IDs for Starter, Growth, and Agency to enable Checkout.",
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
      stopNavigationProgress();
    }
  }

  async function clearSecret(
    which: "secretKey" | "publishableKey" | "webhookSecret",
  ) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/stripe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clearSecretKey: which === "secretKey",
          clearPublishableKey: which === "publishableKey",
          clearWebhookSecret: which === "webhookSecret",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Clear failed");
      setMessage("Cleared. Env fallback still applies if set.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setBusy(false);
    }
  }

  const groups = [...new Set(keys.map((k) => k.group))];

  return (
    <div>
      <AdminPageHeader
        title="System & API Keys"
        description="Manage Stripe Billing and email provider keys here. Other platform secrets stay in host env (Railway / .env)."
      />

      <section className="mb-6 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]">
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
          <p className="text-[11px] text-ink-faint">
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

      <section className="mb-6 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]">
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

      <section className="mb-6 rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Stripe Billing</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
              Use live keys with live price IDs (or test with test). Mixing
              modes causes “No such price” errors on upgrade.
            </p>
          </div>
          {stripe ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                stripe.checkoutReady
                  ? "bg-emerald-500/15 text-emerald-700"
                  : "bg-amber-500/15 text-amber-800"
              }`}
            >
              {stripe.checkoutReady ? "Checkout ready" : "Incomplete"}
            </span>
          ) : null}
        </div>

        {stripe ? (
          <p className="mt-3 text-[12px] text-ink-faint">
            Source: {stripe.source}
            {stripe.updatedAt
              ? ` · Updated ${new Date(stripe.updatedAt).toLocaleString()}`
              : ""}
            {" · "}
            Webhook URL:{" "}
            <code className="font-mono text-ink-muted">{stripe.webhookUrl}</code>
          </p>
        ) : null}

        <form onSubmit={saveStripe} className="mt-4 space-y-3">
          <label className="block text-[12px] font-medium text-ink-muted">
            Secret API key (sk_live_… / sk_test_…)
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                stripe?.secretKeyConfigured
                  ? `Configured ${stripe.secretKeyHint || ""} — paste to replace`
                  : "sk_…"
              }
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </label>
          {stripe?.secretKeyConfigured ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() => void clearSecret("secretKey")}
              disabled={busy}
            >
              Clear saved secret key
            </button>
          ) : null}

          <label className="block text-[12px] font-medium text-ink-muted">
            Publishable key (pk_live_… / pk_test_…)
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                stripe?.publishableKeyConfigured
                  ? `Configured ${stripe.publishableKeyHint || ""} — paste to replace`
                  : "pk_…"
              }
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
            />
          </label>
          {stripe?.publishableKeyConfigured ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() => void clearSecret("publishableKey")}
              disabled={busy}
            >
              Clear saved publishable key
            </button>
          ) : null}

          <label className="block text-[12px] font-medium text-ink-muted">
            Webhook signing secret (optional)
            <input
              type="password"
              autoComplete="off"
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder={
                stripe?.webhookSecretConfigured
                  ? `Configured ${stripe.webhookSecretHint || ""} — paste to replace`
                  : "whsec_…"
              }
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
          </label>
          {stripe?.webhookSecretConfigured ? (
            <button
              type="button"
              className="text-[12px] font-semibold text-brand-600 hover:underline"
              onClick={() => void clearSecret("webhookSecret")}
              disabled={busy}
            >
              Clear saved webhook secret
            </button>
          ) : null}

          <p className="pt-2 text-[12px] font-semibold text-ink">
            Plan price IDs (from Stripe → Products, Live mode)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-[12px] font-medium text-ink-muted">
              Starter monthly price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceStarter}
                onChange={(e) => setPriceStarter(e.target.value)}
              />
            </label>
            <label className="block text-[12px] font-medium text-ink-muted">
              Starter annual price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceStarterAnnual}
                onChange={(e) => setPriceStarterAnnual(e.target.value)}
              />
            </label>
            <label className="block text-[12px] font-medium text-ink-muted">
              Growth monthly price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceGrowth}
                onChange={(e) => setPriceGrowth(e.target.value)}
              />
            </label>
            <label className="block text-[12px] font-medium text-ink-muted">
              Growth annual price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceGrowthAnnual}
                onChange={(e) => setPriceGrowthAnnual(e.target.value)}
              />
            </label>
            <label className="block text-[12px] font-medium text-ink-muted">
              Agency monthly price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceAgency}
                onChange={(e) => setPriceAgency(e.target.value)}
              />
            </label>
            <label className="block text-[12px] font-medium text-ink-muted">
              Agency annual price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceAgencyAnnual}
                onChange={(e) => setPriceAgencyAnnual(e.target.value)}
              />
            </label>
          </div>

          <p className="pt-2 text-[12px] font-semibold text-ink">
            Messaging add-on price ID ($15.50/mo — unlocks bulk email + SMS)
          </p>
          <label className="block text-[12px] font-medium text-ink-muted">
            Messaging add-on price ID
            <input
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder="price_…"
              value={priceMessaging}
              onChange={(e) => setPriceMessaging(e.target.value)}
            />
            <span className="mt-1 block text-[11px] text-ink-faint">
              Create a $15.50/mo recurring price in Stripe and paste its price ID here.
              {stripe ? (
                stripe.messagingReady ? (
                  <span className="ml-1 font-semibold text-emerald-600">Add-on ready.</span>
                ) : (
                  <span className="ml-1 font-semibold text-amber-600">
                    Add-on not configured yet.
                  </span>
                )
              ) : null}
            </span>
          </label>

          <p className="pt-2 text-[12px] font-semibold text-ink">
            AI Website + SEO report add-on price ID ($15 one-time checkout)
          </p>
          <label className="block text-[12px] font-medium text-ink-muted">
            SEO report add-on price ID
            <input
              className="saas-input mt-1.5 font-mono text-[13px]"
              placeholder="price_…"
              value={priceSeoReport}
              onChange={(e) => setPriceSeoReport(e.target.value)}
            />
            <span className="mt-1 block text-[11px] text-ink-faint">
              Create a $15 one-time price in Stripe and paste its price ID here.
              {stripe ? (
                stripe.seoReportReady ? (
                  <span className="ml-1 font-semibold text-emerald-600">Add-on ready.</span>
                ) : (
                  <span className="ml-1 font-semibold text-amber-600">
                    Add-on not configured yet.
                  </span>
                )
              ) : null}
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" disabled={busy} size="sm">
              {busy ? "Saving…" : "Save Stripe settings"}
            </Button>
            {message ? (
              <p className="text-[13px] text-ink-muted">{message}</p>
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
            className="rounded-2xl border border-border/80 bg-white p-5 shadow-[var(--shadow-card)] dark:bg-[var(--surface)]"
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
