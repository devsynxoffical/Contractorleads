"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import type { EmailTemplateFields } from "@/lib/email-template-defaults";

const TYPES = [
  { id: "verify", label: "Verify email" },
  { id: "welcome", label: "Welcome" },
  { id: "reset", label: "Forgot password" },
  { id: "scrape", label: "Lead scrape" },
] as const;

type TemplateKey = (typeof TYPES)[number]["id"];

const EMPTY: EmailTemplateFields = {
  key: "scrape",
  label: "",
  enabled: true,
  subject: "",
  preheader: "",
  heroTitle: "",
  heroSubtitle: "",
  headline: "",
  body: "",
  ctaLabel: "",
  ctaPath: "",
  feature1Title: "",
  feature1Body: "",
  feature2Title: "",
  feature2Body: "",
  feature3Title: "",
  feature3Body: "",
  secondaryTitle: "",
  secondaryBody: "",
  secondaryCtaLabel: "",
  secondaryCtaPath: "",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[12px]">
      <span className="font-medium text-ink-muted">{label}</span>
      {hint ? (
        <span className="mt-0.5 block text-[11px] text-ink-faint">{hint}</span>
      ) : null}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function AdminEmailTemplatesPage() {
  const [type, setType] = useState<TemplateKey>("scrape");
  const [form, setForm] = useState<EmailTemplateFields>(EMPTY);
  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState("");
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<"load" | "save" | "reset" | "preview" | "send" | null>(
    null,
  );

  const setField = useCallback(
    <K extends keyof EmailTemplateFields>(key: K, value: EmailTemplateFields[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  async function load(key: TemplateKey) {
    setBusy("load");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/email-preview?type=${key}`);
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not load template");
        return;
      }
      setForm(data.template);
      setHtml(data.html || "");
      setSubject(data.subject || "");
    } catch {
      setMsg("Could not load template");
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    load(type);
  }, [type]);

  async function post(action: "save" | "reset" | "preview" | "send") {
    setBusy(action);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          type,
          to: to || undefined,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Request failed");
        return;
      }
      if (data.template) setForm(data.template);
      if (data.html) setHtml(data.html);
      if (data.subject) setSubject(data.subject);
      if (data.message) setMsg(data.message);
      else if (action === "preview") setMsg("Preview updated from current draft.");
    } catch {
      setMsg("Request failed");
    } finally {
      setBusy(null);
    }
  }

  const inputClass = "saas-input w-full";
  const areaClass = "saas-input w-full min-h-[88px] resize-y";

  return (
    <div>
      <AdminPageHeader
        title="Email templates"
        description="Edit subject, hero, body, features, and CTAs. Changes apply to live customer emails after Save. Use placeholders like {{name}}, {{industry}}, {{location}}, {{leadCount}}."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${
              type === t.id
                ? "bg-brand-600 text-white"
                : "bg-[#faf8fc] text-ink-muted hover:bg-brand-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-[13px] text-brand-800">
          {msg}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-4 rounded-2xl border border-border/80 bg-white p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setField("enabled", e.target.checked)}
                className="size-4 rounded border-border"
              />
              Enabled (send this email)
            </label>
            <p className="text-[12px] text-ink-muted">{form.label}</p>
          </div>

          <Field label="Internal label">
            <input
              className={inputClass}
              value={form.label}
              onChange={(e) => setField("label", e.target.value)}
            />
          </Field>

          <Field
            label="Subject line"
            hint="Placeholders: {{name}} {{industry}} {{location}} {{leadCount}} {{hotCount}} {{warmCount}}"
          >
            <input
              className={inputClass}
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
            />
          </Field>

          <Field label="Preheader (inbox preview text)">
            <input
              className={inputClass}
              value={form.preheader}
              onChange={(e) => setField("preheader", e.target.value)}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Hero title">
              <input
                className={inputClass}
                value={form.heroTitle}
                onChange={(e) => setField("heroTitle", e.target.value)}
              />
            </Field>
            <Field label="Hero subtitle">
              <input
                className={inputClass}
                value={form.heroSubtitle}
                onChange={(e) => setField("heroSubtitle", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Headline">
            <input
              className={inputClass}
              value={form.headline}
              onChange={(e) => setField("headline", e.target.value)}
            />
          </Field>

          <Field label="Body">
            <textarea
              className={areaClass}
              value={form.body}
              onChange={(e) => setField("body", e.target.value)}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary CTA label">
              <input
                className={inputClass}
                value={form.ctaLabel}
                onChange={(e) => setField("ctaLabel", e.target.value)}
              />
            </Field>
            <Field label="Primary CTA path" hint="e.g. /dashboard — token links override for verify/reset">
              <input
                className={inputClass}
                value={form.ctaPath}
                onChange={(e) => setField("ctaPath", e.target.value)}
              />
            </Field>
          </div>

          <p className="pt-1 text-[12px] font-semibold text-ink">Feature rows (optional)</p>
          {(
            [
              ["feature1Title", "feature1Body", "Feature 1"],
              ["feature2Title", "feature2Body", "Feature 2"],
              ["feature3Title", "feature3Body", "Feature 3"],
            ] as const
          ).map(([titleKey, bodyKey, label]) => (
            <div key={titleKey} className="grid gap-2 sm:grid-cols-2">
              <Field label={`${label} title`}>
                <input
                  className={inputClass}
                  value={form[titleKey]}
                  onChange={(e) => setField(titleKey, e.target.value)}
                />
              </Field>
              <Field label={`${label} body`}>
                <input
                  className={inputClass}
                  value={form[bodyKey]}
                  onChange={(e) => setField(bodyKey, e.target.value)}
                />
              </Field>
            </div>
          ))}

          <p className="pt-1 text-[12px] font-semibold text-ink">Secondary block (optional)</p>
          <Field label="Secondary title">
            <input
              className={inputClass}
              value={form.secondaryTitle}
              onChange={(e) => setField("secondaryTitle", e.target.value)}
            />
          </Field>
          <Field label="Secondary body">
            <textarea
              className={areaClass}
              value={form.secondaryBody}
              onChange={(e) => setField("secondaryBody", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Secondary CTA label">
              <input
                className={inputClass}
                value={form.secondaryCtaLabel}
                onChange={(e) => setField("secondaryCtaLabel", e.target.value)}
              />
            </Field>
            <Field label="Secondary CTA path">
              <input
                className={inputClass}
                value={form.secondaryCtaPath}
                onChange={(e) => setField("secondaryCtaPath", e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
            <Button
              onClick={() => post("save")}
              loading={busy === "save"}
              disabled={busy !== null}
            >
              Save template
            </Button>
            <Button
              variant="secondary"
              onClick={() => post("preview")}
              loading={busy === "preview"}
              disabled={busy !== null}
            >
              Refresh preview
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (
                  confirm(
                    "Reset this template to the built-in default content? Unsaved edits will be lost.",
                  )
                ) {
                  post("reset");
                }
              }}
              loading={busy === "reset"}
              disabled={busy !== null}
            >
              Reset to default
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/80 bg-white p-4">
            <p className="mb-3 text-[13px] text-ink-muted">
              Preview subject:{" "}
              <span className="font-semibold text-ink">{subject || "…"}</span>
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block min-w-[220px] flex-1 text-[12px]">
                <span className="font-medium text-ink-muted">Send test to</span>
                <input
                  className="saas-input mt-1"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Blank = your admin email"
                />
              </label>
              <Button
                onClick={() => post("send")}
                loading={busy === "send"}
                disabled={busy !== null}
              >
                Send test email
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-ink-faint">
              Test send uses the current form (save first if you want the live template updated).
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-[#ebe6df] shadow-[var(--shadow-card)]">
            {busy === "load" && !html ? (
              <div className="flex h-[640px] items-center justify-center text-[13px] text-ink-muted">
                Loading…
              </div>
            ) : (
              <iframe
                title="Email preview"
                className="h-[min(780px,80vh)] w-full bg-[#ebe6df]"
                srcDoc={html}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
