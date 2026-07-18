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
    companyName: user.companyName ?? "",
    businessDescription: user.businessDescription ?? "",
    services: user.services ?? "",
    idealCustomer: user.idealCustomer ?? "",
    serviceAreas: user.serviceAreas ?? "",
    mainGoal: user.mainGoal ?? "",
    darkMode: theme === "dark",
  });
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const darkMode = theme === "dark";
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        darkMode,
        onboardingComplete: true,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["companyName", "Company name", "input"],
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

      <Button type="submit">{saved ? "Saved" : "Save changes"}</Button>
    </form>
  );
}
