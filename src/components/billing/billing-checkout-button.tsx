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
}: {
  planId: string;
  label: string;
  popular?: boolean;
  disabled?: boolean;
  /** Open Stripe Customer Portal instead of Checkout */
  manage?: boolean;
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No checkout URL returned");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={disabled || loading}
        onClick={() => void onClick()}
        style={
          popular && !disabled
            ? { background: LOGO_GRADIENT, color: "white", border: 0 }
            : undefined
        }
      >
        {loading ? "Redirecting…" : label}
      </Button>
      {error ? (
        <p className="text-[11px] leading-snug text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
