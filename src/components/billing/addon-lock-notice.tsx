"use client";

import Link from "next/link";
import { HiOutlineLockClosed } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { MESSAGING_ADDON_PRICE_LABEL } from "@/lib/messaging-addon";

export const MESSAGING_ADDON_UPGRADE_HREF = "/billing?addon=messaging";

/** True when an API response is the Messaging add-on 402 gate. */
export function isMessagingAddonLocked(
  res: { status: number },
  data: unknown,
): boolean {
  return (
    res.status === 402 &&
    typeof data === "object" &&
    data !== null &&
    (data as { code?: unknown }).code === "messaging_addon_required"
  );
}

const TITLES: Record<"email" | "sms", string> = {
  email: "Email sending is locked",
  sms: "SMS is locked",
};

/**
 * Lock card shown wherever an outbound email/SMS action needs the
 * Messaging add-on. Links to Plans & Billing with the add-on preselected.
 */
export function AddonLockNotice({
  feature,
  compact = false,
  className,
}: {
  feature: "email" | "sms";
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border border-brand-200/70 bg-brand-50/40 text-ink dark:bg-brand-950/20",
        compact ? "px-3 py-2.5" : "p-5",
        className,
      )}
    >
      <div
        className={cn(
          "flex gap-3",
          compact ? "items-center" : "flex-col sm:flex-row sm:items-center",
        )}
      >
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600",
            compact ? "h-8 w-8" : "h-10 w-10",
          )}
        >
          <HiOutlineLockClosed className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-semibold text-ink",
              compact ? "text-[13px]" : "text-[15px]",
            )}
          >
            {TITLES[feature]}
          </p>
          <p
            className={cn(
              "text-ink-muted",
              compact ? "text-[12px]" : "mt-0.5 text-[13px]",
            )}
          >
            The Messaging add-on ({MESSAGING_ADDON_PRICE_LABEL}) unlocks bulk
            email, 1:1 email, sequences and SMS.
          </p>
        </div>
        <Link
          href={MESSAGING_ADDON_UPGRADE_HREF}
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 font-semibold text-white shadow-sm transition hover:bg-brand-700",
            compact ? "h-8 px-3 text-[12px]" : "h-10 px-4 text-[13px]",
          )}
        >
          Unlock messaging
        </Link>
      </div>
    </div>
  );
}
