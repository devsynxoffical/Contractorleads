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
  priceGrowth: string;
  priceAgency: string;
  priceMessaging: string;
  checkoutReady: boolean;
  messagingReady: boolean;
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

export default function AdminSystemPage() {
  const [keys, setKeys] = useState<EnvKeyStatus[]>([]);
  const [note, setNote] = useState("");
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [publishableKey, setPublishableKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [priceStarter, setPriceStarter] = useState("");
  const [priceGrowth, setPriceGrowth] = useState("");
  const [priceAgency, setPriceAgency] = useState("");
  const [priceMessaging, setPriceMessaging] = useState("");
  const [email, setEmail] = useState<EmailStatus | null>(null);
  const [resendApiKey, setResendApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [sys, stripeRes, emailRes] = await Promise.all([
      fetch("/api/admin/system").then((r) => r.json()),
      fetch("/api/admin/stripe").then((r) => r.json()),
      fetch("/api/admin/email-provider").then((r) => r.json()),
    ]);
    setKeys(sys.keys ?? []);
    setNote(sys.note ?? "");
    setStripe(stripeRes);
    setSecretKey("");
    setPublishableKey("");
    setWebhookSecret("");
    setPriceStarter(stripeRes.priceStarter || "");
    setPriceGrowth(stripeRes.priceGrowth || "");
    setPriceAgency(stripeRes.priceAgency || "");
    setPriceMessaging(stripeRes.priceMessaging || "");
    setEmail(emailRes);
    setFromEmail(emailRes.fromEmail || "");
    setResendApiKey("");
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
      await load();
    } catch (err) {
      setEmailMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setEmailBusy(false);
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
          priceGrowth,
          priceAgency,
          priceMessaging,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setMessage(
        json.checkoutReady
          ? "Stripe settings saved. Checkout is ready."
          : "Saved. Add secret key + all three live price IDs to enable Checkout.",
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
              confirmations. Without a key, live signups fail instead of showing
              a dev link.
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
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-[12px] font-medium text-ink-muted">
              Starter price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceStarter}
                onChange={(e) => setPriceStarter(e.target.value)}
              />
            </label>
            <label className="block text-[12px] font-medium text-ink-muted">
              Growth price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceGrowth}
                onChange={(e) => setPriceGrowth(e.target.value)}
              />
            </label>
            <label className="block text-[12px] font-medium text-ink-muted">
              Agency price ID
              <input
                className="saas-input mt-1.5 font-mono text-[13px]"
                placeholder="price_…"
                value={priceAgency}
                onChange={(e) => setPriceAgency(e.target.value)}
              />
            </label>
          </div>

          <p className="pt-2 text-[12px] font-semibold text-ink">
            Messaging add-on price ID ($30/mo — unlocks bulk email + SMS)
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
              Create a $30/mo recurring price in Stripe and paste its price ID here.
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
