"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { readBillingCouponCode } from "@/components/billing/billing-coupon-field";
import { openRazorpayModal } from "@/lib/client/razorpay-checkout";

export function BillingCheckoutButton({
  planId,
  label,
  billingPeriod = "monthly",
  popular,
  disabled,
  manage,
  className,
}: {
  planId: string;
  label: string;
  billingPeriod?: "monthly" | "annual";
  popular?: boolean;
  disabled?: boolean;
  /** Open subscription management */
  manage?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const couponCode = readBillingCouponCode();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          billingPeriod,
          ...(couponCode ? { couponCode } : {}),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
        plan?: string;
        user?: { name?: string; email?: string; phone?: string };
        redirectUrl?: string;
      };

      if (!res.ok || !data.orderId || !data.keyId) {
        setError(data.error || "Failed to initialize payment");
        setLoading(false);
        return;
      }

      await openRazorpayModal({
        keyId: data.keyId,
        orderId: data.orderId,
        amount: data.amount || 0,
        currency: data.currency || "USD",
        name: "Contractor Leads",
        description: `${label} (${billingPeriod === "annual" ? "Annual" : "Monthly"})`,
        prefill: {
          name: data.user?.name,
          email: data.user?.email,
          contact: data.user?.phone,
        },
        onSuccess: async (payResponse) => {
          try {
            const verifyRes = await fetch("/api/billing/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...payResponse,
                plan: planId,
                billingPeriod,
                couponCode,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.ok) {
              window.location.href = verifyData.redirectUrl || "/billing?checkout=active";
            } else {
              setError(verifyData.error || "Payment verification failed");
              setLoading(false);
            }
          } catch {
            setError("Error verifying payment");
            setLoading(false);
          }
        },
        onDismiss: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  return (
    <div className={`space-y-2 ${className ?? "mt-4"}`}>
      <Button
        variant="secondary"
        size="sm"
        className="h-9 w-full font-bold"
        disabled={disabled || loading}
        onClick={() => void onClick()}
        style={
          popular && !disabled
            ? { background: LOGO_GRADIENT, color: "white", border: 0 }
            : undefined
        }
      >
        {loading ? "Processing…" : label}
      </Button>
      {error ? (
        <p className="text-[11px] leading-snug text-red-600 font-medium">{error}</p>
      ) : null}
    </div>
  );
}
