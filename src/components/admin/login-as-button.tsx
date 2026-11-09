"use client";

import { createContext, useContext, useState } from "react";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { cn } from "@/lib/utils";

/** Whether the signed-in admin may log in as customers (Super Admin / Owner only). */
const CanImpersonateContext = createContext(false);

export function CanImpersonateProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <CanImpersonateContext.Provider value={value}>{children}</CanImpersonateContext.Provider>;
}

export function useCanImpersonate() {
  return useContext(CanImpersonateContext);
}

/**
 * "Log in as" a customer: starts an impersonation session and opens the app as them.
 * The app shows a banner with "Back to admin", which returns to the page this was
 * clicked on. Renders nothing for admins who are not allowed to impersonate.
 */
export function LoginAsButton({
  userId,
  disabled,
  className,
  label = "Log in as",
  onError,
}: {
  userId: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  onError?: (message: string) => void;
}) {
  const allowed = useCanImpersonate();
  const [busy, setBusy] = useState(false);
  if (!allowed) return null;

  async function go(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const returnTo = window.location.pathname + window.location.search;
    const res = await fetch(`/api/admin/customers/${encodeURIComponent(userId)}/impersonate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnTo }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok) {
      setBusy(false);
      const msg =
        data.error === "CANNOT_IMPERSONATE_ADMIN"
          ? "Admin accounts can't be logged into."
          : data.error === "NOT_FOUND"
            ? "User not found."
            : data.error || "Could not log in as this user.";
      if (onError) onError(msg);
      else window.alert(msg);
      return;
    }
    // Full reload so every server component picks up the new session.
    window.location.href = data.redirectTo || "/home";
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={disabled || busy}
      title={disabled ? "Reactivate this account to log in as it" : "Open the app as this user"}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <HiOutlineArrowRightOnRectangle className="h-3.5 w-3.5" aria-hidden />
      {busy ? "Opening…" : label}
    </button>
  );
}
