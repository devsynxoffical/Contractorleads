"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineArrowUpTray,
  HiOutlinePhoto,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { fileToCompressedLogoDataUrl } from "@/lib/client/logo-compress";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export type ReportBrandingForm = {
  companyName: string;
  companyWebsite: string;
  companyTagline: string;
  companyAddress: string;
  reportAccentColor: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
};

const EMPTY: ReportBrandingForm = {
  companyName: "",
  companyWebsite: "",
  companyTagline: "",
  companyAddress: "",
  reportAccentColor: "#3D1078",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
};

export function ReportBrandingModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const titleId = useId();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ReportBrandingForm>(EMPTY);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoDirty, setLogoDirty] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSaved(false);
    setLogoDirty(false);
    setRemoveLogo(false);
    setLogoFileName(null);
    (async () => {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) {
          if (!cancelled) setError(data.error || "Could not load branding");
          return;
        }
        const p = data.profile as Record<string, string | null> | null;
        setForm({
          companyName: p?.companyName ?? "",
          companyWebsite: p?.companyWebsite ?? "",
          companyTagline: p?.companyTagline ?? "",
          companyAddress: p?.companyAddress ?? "",
          reportAccentColor: p?.reportAccentColor ?? "#3D1078",
          ownerName: p?.ownerName ?? p?.name ?? "",
          ownerEmail: p?.ownerEmail ?? "",
          ownerPhone: p?.ownerPhone ?? p?.phone ?? "",
        });
        const hasLogo = Boolean(p?.companyLogoData?.trim());
        setLogoPreview(hasLogo ? p!.companyLogoData! : null);
        setLogoFileName(hasLogo ? "Current logo" : null);
      } catch {
        if (!cancelled) setError("Could not load branding");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function onLogoPick(file: File | null) {
    setError(null);
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedLogoDataUrl(file);
      setLogoPreview(dataUrl);
      setLogoFileName(file.name);
      setLogoDirty(true);
      setRemoveLogo(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read logo");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLogoFileName(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = { ...form };
    if (removeLogo) payload.companyLogoData = null;
    else if (logoDirty && logoPreview) payload.companyLogoData = logoPreview;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save branding");
        return;
      }
      setLogoDirty(false);
      setRemoveLogo(false);
      setSaved(true);
      onSaved?.();
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError("Could not save branding");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0f0c14]/55 backdrop-blur-[3px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-2xl">
        <div className="h-1.5 w-full shrink-0" style={{ background: LOGO_GRADIENT }} />
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-[16px] font-semibold text-ink">
              Report branding
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
              Logo and company details used on PDF downloads and emailed reports.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => void handleSave(e)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {loading ? (
              <p className="py-8 text-center text-[13px] text-ink-muted">
                Loading branding…
              </p>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-[#faf8fc] p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    <div
                      className={cn(
                        "flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-[var(--surface)]",
                        logoPreview && !removeLogo
                          ? "border-brand-200"
                          : "border-dashed border-border",
                      )}
                    >
                      {logoPreview && !removeLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoPreview}
                          alt="Company logo"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <HiOutlinePhoto className="h-8 w-8 text-ink-faint" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div>
                        <Label htmlFor={fileInputId}>Company logo</Label>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          Square PNG or JPEG works best. We compress it for
                          PDFs.
                        </p>
                      </div>

                      <input
                        ref={fileInputRef}
                        id={fileInputId}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) =>
                          void onLogoPick(e.target.files?.[0] ?? null)
                        }
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={fileInputId}
                          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-[var(--surface)] px-3.5 text-[13px] font-semibold text-ink shadow-[var(--shadow-soft)] transition hover:border-brand-200 hover:text-brand-700"
                        >
                          <HiOutlineArrowUpTray className="h-4 w-4 text-brand-600" />
                          {logoPreview && !removeLogo
                            ? "Replace logo"
                            : "Upload logo"}
                        </label>
                        {logoPreview && !removeLogo ? (
                          <button
                            type="button"
                            className="inline-flex h-10 items-center rounded-xl px-3 text-[12px] font-semibold text-rose-700 transition hover:bg-rose-50"
                            onClick={() => {
                              setRemoveLogo(true);
                              setLogoDirty(false);
                              setLogoPreview(null);
                              setLogoFileName(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>

                      <p className="truncate text-[12px] text-ink-muted">
                        {logoPreview && !removeLogo
                          ? logoFileName || "Logo ready"
                          : "No logo selected"}
                      </p>
                    </div>
                  </div>
                </div>

                {(
                  [
                    ["companyName", "Company name", "Acme Growth Agency"],
                    ["companyWebsite", "Website", "https://youragency.com"],
                    [
                      "companyTagline",
                      "Report tagline",
                      "Lead Intelligence Report",
                    ],
                    ["companyAddress", "Company address", "City, State"],
                    ["ownerName", "Contact name", "Jane Doe"],
                    ["ownerEmail", "Contact email", "hello@agency.com"],
                    ["ownerPhone", "Contact phone", "(555) 000-0000"],
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`report-brand-${key}`}>{label}</Label>
                    <Input
                      id={`report-brand-${key}`}
                      value={form[key]}
                      placeholder={placeholder}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label>Report accent color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.reportAccentColor || "#3D1078"}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          reportAccentColor: e.target.value,
                        }))
                      }
                      className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-[var(--surface)] p-1"
                      aria-label="Accent color"
                    />
                    <Input
                      value={form.reportAccentColor}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          reportAccentColor: e.target.value,
                        }))
                      }
                      placeholder="#3D1078"
                      className="max-w-[140px]"
                    />
                  </div>
                </div>
              </>
            )}

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
                {error}
              </p>
            ) : null}
            {saved ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
                Branding saved — PDFs will use these details.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-[#faf8fc] px-5 py-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" loading={saving} disabled={saving || loading}>
              {saved ? "Saved" : "Save branding"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
