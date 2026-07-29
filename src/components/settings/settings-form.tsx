"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionUser } from "@/lib/session-user";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useTheme } from "@/components/theme/theme-provider";

const MAX_LOGO_BYTES = 350_000;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a PNG, JPEG, or WebP image");
  }
  if (file.size > 5_000_000) {
    throw new Error("Logo file is too large (max 5MB before compress)");
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 320;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = 0.9;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_LOGO_BYTES && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_LOGO_BYTES) {
    throw new Error("Logo is still too large — try a simpler square logo");
  }
  return dataUrl;
}

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoDirty, setLogoDirty] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (!res.ok || cancelled) return;
        const p = data.profile as {
          companyLogoData?: string | null;
          companyWebsite?: string | null;
          companyTagline?: string | null;
          companyAddress?: string | null;
          reportAccentColor?: string | null;
        } | null;
        if (p?.companyLogoData) setLogoPreview(p.companyLogoData);
        setForm((f) => ({
          ...f,
          companyWebsite: p?.companyWebsite ?? f.companyWebsite,
          companyTagline: p?.companyTagline ?? f.companyTagline,
          companyAddress: p?.companyAddress ?? f.companyAddress,
          reportAccentColor: p?.reportAccentColor ?? f.reportAccentColor,
        }));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onLogoPick(file: File | null) {
    setError(null);
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setLogoPreview(dataUrl);
      setLogoDirty(true);
      setRemoveLogo(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read logo");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const darkMode = theme === "dark";
    const payload: Record<string, unknown> = {
      ...form,
      darkMode,
      onboardingComplete: true,
    };
    if (removeLogo) payload.companyLogoData = null;
    else if (logoDirty && logoPreview) payload.companyLogoData = logoPreview;

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
    setLogoDirty(false);
    setRemoveLogo(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Report branding</CardTitle>
          <p className="text-[12px] text-ink-muted">
            Your logo, company name, and contact details appear on intelligence
            report PDFs you download or email to leads.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[#faf8fc]">
              {logoPreview && !removeLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Company logo"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <span className="px-2 text-center text-[11px] text-ink-muted">
                  No logo
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="company-logo">Company logo</Label>
              <Input
                id="company-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => void onLogoPick(e.target.files?.[0] ?? null)}
              />
              <p className="text-[11px] text-ink-muted">
                Square PNG/JPEG works best. We compress it automatically for PDF
                headers.
              </p>
              {(logoPreview || user.hasCompanyLogo) && (
                <button
                  type="button"
                  className="text-[12px] font-medium text-rose-700 hover:underline"
                  onClick={() => {
                    setRemoveLogo(true);
                    setLogoDirty(false);
                    setLogoPreview(null);
                  }}
                >
                  Remove logo
                </button>
              )}
            </div>
          </div>

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
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.companyWebsite}
              onChange={(e) =>
                setForm({ ...form, companyWebsite: e.target.value })
              }
              placeholder="https://youragency.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Report tagline</Label>
            <Input
              value={form.companyTagline}
              onChange={(e) =>
                setForm({ ...form, companyTagline: e.target.value })
              }
              placeholder="Lead Intelligence Report"
            />
          </div>
          <div className="space-y-2">
            <Label>Company address</Label>
            <Input
              value={form.companyAddress}
              onChange={(e) =>
                setForm({ ...form, companyAddress: e.target.value })
              }
              placeholder="City, State"
            />
          </div>
          <div className="space-y-2">
            <Label>Report accent color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.reportAccentColor || "#3D1078"}
                onChange={(e) =>
                  setForm({ ...form, reportAccentColor: e.target.value })
                }
                className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-white p-1"
                aria-label="Accent color"
              />
              <Input
                value={form.reportAccentColor}
                onChange={(e) =>
                  setForm({ ...form, reportAccentColor: e.target.value })
                }
                placeholder="#3D1078"
                className="max-w-[140px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-[var(--shadow-card)]">
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
