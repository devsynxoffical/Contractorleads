export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Tell the server the user closed the payment modal without paying so the
 * abandoned-checkout recovery sequence can mark the attempt. Fire-and-forget.
 */
export function reportCheckoutDismissed(orderId: string): void {
  if (typeof window === "undefined" || !orderId) return;
  void fetch("/api/billing/checkout/dismissed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
    keepalive: true,
  }).catch(() => {
    /* best effort */
  });
}

export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  onDismiss?: () => void;
};

export async function openRazorpayModal(options: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error("Failed to load Razorpay payment gateway. Please check your internet connection.");
  }

  const rzp = new (window as any).Razorpay({
    key: options.keyId,
    amount: options.amount,
    currency: options.currency,
    name: options.name || "Contractor Leads",
    description: options.description || "Subscription Plan",
    order_id: options.orderId,
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: {
      color: options.theme?.color || "#3D1078",
    },
    handler: function (response: any) {
      void options.onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: function () {
        if (options.onDismiss) options.onDismiss();
      },
    },
  });

  rzp.open();
}
