"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/session-user";
import { CREDIT_COSTS } from "@/lib/constants";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineSparkles,
} from "react-icons/hi2";

type AiProfile = {
  name: string;
  companyName: string;
  businessDescription: string;
  services: string;
  idealCustomer: string;
  serviceAreas: string;
  mainGoal: string;
  aiCustomInstructions: string;
};

export function AiAssistantSettingsForm({ user }: { user: SessionUser }) {
  const [form, setForm] = useState<AiProfile>({
    name: user.name ?? "",
    companyName: user.companyName ?? "",
    businessDescription: user.businessDescription ?? "",
    services: user.services ?? "",
    idealCustomer: user.idealCustomer ?? "",
    serviceAreas: user.serviceAreas ?? "",
    mainGoal: user.mainGoal ?? "",
    aiCustomInstructions: user.aiCustomInstructions ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof AiProfile, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        onboardingComplete: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(
        typeof data.error === "string" ? data.error : "Could not save settings",
      );
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fields: Array<{
    key: keyof AiProfile;
    label: string;
    hint: string;
    type: "input" | "textarea";
    placeholder: string;
  }> = [
    {
      key: "name",
      label: "Your name",
      hint: "How the assistant should address you",
      type: "input",
      placeholder: "Alex",
    },
    {
      key: "companyName",
      label: "Agency / company",
      hint: "Used in outreach angles and examples",
      type: "input",
      placeholder: "Peak Digital Agency",
    },
    {
      key: "businessDescription",
      label: "What you do",
      hint: "Short description of your agency",
      type: "textarea",
      placeholder: "We run Google + Meta ads for roofing and HVAC contractors…",
    },
    {
      key: "services",
      label: "Services you sell",
      hint: "What you offer contractors",
      type: "textarea",
      placeholder: "Lead gen, website rebuilds, Google Local Services Ads…",
    },
    {
      key: "idealCustomer",
      label: "Ideal contractor customer",
      hint: "Who you want to sell to",
      type: "textarea",
      placeholder: "Owner-operators doing $500k–$3M with weak online presence…",
    },
    {
      key: "serviceAreas",
      label: "Markets / geos",
      hint: "Cities, states, or regions you focus on",
      type: "input",
      placeholder: "Texas, Arizona, Florida",
    },
    {
      key: "mainGoal",
      label: "Main goal with Contractor Leads",
      hint: "What good looks like for you this quarter",
      type: "textarea",
      placeholder: "Book 8 discovery calls a week from hot roofing leads…",
    },
    {
      key: "aiCustomInstructions",
      label: "Custom AI instructions",
      hint: "How the AI should talk and act for YOUR agency — tone, banned topics, your specific offers, call-to-action rules. Applies to chat, cold emails, SMS, and sales scripts.",
      type: "textarea",
      placeholder: "Always write in a casual, confident voice.\nNever mention discounts or price.\nOffer a free 15-minute website audit as the CTA.\nSign emails as the agency owner, not 'the team'.",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={handleSave} className="space-y-5">
        <Card className="border-border shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="text-[16px]">Assistant context</CardTitle>
            <p className="mt-1 text-[13px] text-ink-muted">
              These details personalize Ask Contractor Leads — hooks, offers, and
              scripts that match your agency. Billing, security, and email live
              elsewhere.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label>{field.label}</Label>
                <p className="text-[12px] text-ink-muted">{field.hint}</p>
                {field.type === "input" ? (
                  <Input
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Textarea
                    value={form[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={saving}>
            {saved ? "Saved" : "Save AI settings"}
          </Button>
          <Link
            href="/ask-expert"
            className="text-[13px] font-semibold text-brand-600 hover:underline"
          >
            Back to chat
          </Link>
        </div>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            How this is used
          </p>
          <ul className="mt-3 space-y-2.5 text-[13px] text-ink-muted">
            <li className="flex gap-2">
              <HiOutlineSparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Answers match your services and markets
            </li>
            <li className="flex gap-2">
              <HiOutlineChatBubbleLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Chat remembers context across turns
            </li>
            <li className="flex gap-2">
              <HiOutlineDocumentText className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Scripts & outreach use your ICP and goal
            </li>
          </ul>
          <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2 text-[12px] text-brand-700">
            {CREDIT_COSTS.assistant} credits per message in Ask Contractor Leads
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Related
          </p>
          <div className="mt-3 flex flex-col gap-2 text-[13px]">
            <Link
              href="/ask-expert"
              className="font-semibold text-ink hover:text-brand-700"
            >
              Ask Contractor Leads →
            </Link>
            <Link
              href="/scripts"
              className="font-semibold text-ink hover:text-brand-700"
            >
              My Scripts →
            </Link>
            <Link
              href="/settings"
              className="text-ink-muted hover:text-brand-700"
            >
              Full workspace settings
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
