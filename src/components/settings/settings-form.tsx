"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/session-user";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTheme } from "@/components/theme/theme-provider";

export function SettingsForm({ user }: { user: SessionUser }) {
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({
    name: user.name ?? "",
    phone: user.phone ?? "",
    companyName: user.companyName ?? "",
    companyWebsite: user.companyWebsite ?? "",
    companyTagline: user.companyTagline ?? "",
    companyAddress: user.companyAddress ?? "",
    reportAccentColor: user.reportAccentColor ?? "#3D1078",
    ownerName: user.ownerName ?? "",
    ownerEmail: user.ownerEmail ?? "",
    ownerPhone: user.ownerPhone ?? "",
    businessDescription: user.businessDescription ?? "",
    services: user.services ?? "",
    idealCustomer: user.idealCustomer ?? "",
    serviceAreas: user.serviceAreas ?? "",
    mainGoal: user.mainGoal ?? "",
    darkMode: theme === "dark",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const darkMode = theme === "dark";
    const payload: Record<string, unknown> = {
      name: form.name,
      phone: form.phone,
      companyName: form.companyName,
      ownerName: form.ownerName,
      ownerEmail: form.ownerEmail,
      ownerPhone: form.ownerPhone,
      businessDescription: form.businessDescription,
      services: form.services,
      idealCustomer: form.idealCustomer,
      serviceAreas: form.serviceAreas,
      mainGoal: form.mainGoal,
      darkMode,
      onboardingComplete: true,
    };

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save settings");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <p className="text-[12px] text-ink-muted">
            Used for AI context and outreach. Report logo and PDF branding are
            set from the Lead intelligence report section (Setup logo).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company name</Label>
            <Input
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              placeholder="Acme Growth Agency"
            />
          </div>
          {[
            ["name", "Your name", "input"],
            ["phone", "Phone", "input"],
            ["ownerName", "Agency owner name", "input"],
            ["ownerEmail", "Owner email", "input"],
            ["ownerPhone", "Owner phone", "input"],
            ["businessDescription", "Description", "textarea"],
            ["services", "Services", "textarea"],
            ["idealCustomer", "Ideal customer", "textarea"],
            ["serviceAreas", "Service areas", "input"],
            ["mainGoal", "Main goal", "textarea"],
          ].map(([key, label, type]) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              {type === "input" ? (
                <Input
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ) : (
                <Textarea
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Theme</p>
              <p className="text-[12px] text-ink-muted">
                Pink–purple brand gradient · dark or light canvas
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                setForm((f) => ({ ...f, darkMode: true }));
              }}
              className={`flex-1 rounded-xl border px-3 py-3 text-left text-[12px] transition ${
                theme === "dark"
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-border text-ink-muted hover:border-brand-500/40"
              }`}
            >
              <span className="block font-semibold">Dark</span>
              <span className="text-ink-faint">Navy canvas · neon logo glow</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                setForm((f) => ({ ...f, darkMode: false }));
              }}
              className={`flex-1 rounded-xl border px-3 py-3 text-left text-[12px] transition ${
                theme === "light"
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-border text-ink-muted hover:border-brand-500/40"
              }`}
            >
              <span className="block font-semibold">Light</span>
              <span className="text-ink-faint">Soft lilac · same brand accents</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
          {error}
        </p>
      ) : null}

      <Button type="submit" loading={saving} disabled={saving}>
        {saved ? "Saved" : "Save changes"}
      </Button>
    </form>
  );
}
