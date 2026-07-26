"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const STORAGE_KEY = "cl_billing_coupon";

export function readBillingCouponCode() {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function BillingCouponField() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const saved = readBillingCouponCode();
    if (saved) {
      setCode(saved);
      setApplied(true);
      setMessage(`Coupon ${saved} will apply at checkout`);
    }
  }, []);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      const normalized = String(data.coupon?.code || code)
        .trim()
        .toUpperCase();
      sessionStorage.setItem(STORAGE_KEY, normalized);
      setCode(normalized);
      setApplied(true);
      setMessage(
        `${normalized} applied — ${data.coupon.discountLabel}${
          data.coupon.duration && data.coupon.duration !== "once"
            ? ` (${data.coupon.duration})`
            : " on first invoice"
        }`,
      );
    } catch (err) {
      setApplied(false);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setError(err instanceof Error ? err.message : "Invalid coupon");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setCode("");
    setApplied(false);
    setMessage(null);
    setError(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
      <form
        onSubmit={apply}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="billing-coupon">Have a coupon code?</Label>
          <Input
            id="billing-coupon"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setApplied(false);
              setMessage(null);
              setError(null);
            }}
            placeholder="e.g. SAVE20"
            className="uppercase"
            autoComplete="off"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={busy} disabled={!code.trim()}>
            {busy ? "Checking…" : applied ? "Applied" : "Apply"}
          </Button>
          {applied || code ? (
            <Button type="button" variant="secondary" onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </form>
      {message ? (
        <p className="mt-2 text-[13px] font-medium text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-[13px] text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
