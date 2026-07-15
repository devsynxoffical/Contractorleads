"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/auth";

export function SettingsForm({ user }: { user: SessionUser }) {
  const [form, setForm] = useState({
    companyName: user.companyName ?? "",
    businessDescription: user.businessDescription ?? "",
    services: user.services ?? "",
    idealCustomer: user.idealCustomer ?? "",
    serviceAreas: user.serviceAreas ?? "",
    mainGoal: user.mainGoal ?? "",
    darkMode: user.darkMode,
  });
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, onboardingComplete: true }),
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
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.darkMode}
              onChange={(e) => setForm({ ...form, darkMode: e.target.checked })}
            />
            Dark mode (coming soon)
          </label>
        </CardContent>
      </Card>

      <Button type="submit">{saved ? "Saved" : "Save changes"}</Button>
    </form>
  );
}
