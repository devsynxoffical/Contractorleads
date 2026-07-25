"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LOGO_GRADIENT } from "@/components/layout/page-header";

export function BillingCheckoutButton({
  planId,
  label,
  popular,
  disabled,
  manage,
  className,
}: {
  planId: string;
  label: string;
  popular?: boolean;
  disabled?: boolean;
  /** Open Stripe Customer Portal instead of Checkout */
  manage?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        manage ? "/api/billing/portal" : "/api/billing/checkout",
        {
          method: "POST",
          headers: manage ? undefined : { "Content-Type": "application/json" },
          body: manage ? undefined : JSON.stringify({ plan: planId }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        updated?: boolean;
        redirectUrl?: string;
      };
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.updated) {
        window.location.href =
          data.redirectUrl || "/billing?checkout=success";
        return;
      }
      setError(data.error || "No checkout URL returned");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`space-y-2 ${className ?? "mt-4"}`}>
      <Button
        variant="secondary"
        size="sm"
        className="h-9 w-full"
        disabled={disabled || loading}
        onClick={() => void onClick()}
        style={
          popular && !disabled && !manage
            ? { background: LOGO_GRADIENT, color: "white", border: 0 }
            : undefined
        }
      >
        {loading ? (manage ? "Opening…" : "Updating…") : label}
      </Button>
      {error ? (
        <p className="text-[11px] leading-snug text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
