import { ADMIN_STAFF_ROLES } from "@/lib/roles";

/**
 * The "Messaging" add-on is a separate $30/mo subscription that unlocks
 * bulk email sending and (soon) SMS/text messaging. It is independent of the
 * base plan — any paying or trialing user can add it.
 */
export const MESSAGING_ADDON_PRICE_USD = 30;
export const MESSAGING_ADDON_NAME = "Messaging add-on";

const ACTIVE_ADDON_STATUSES = new Set(["active", "trialing"]);

export type MessagingAddonUser = {
  role?: string | null;
  messagingAddonStatus?: string | null;
  messagingAddonManual?: boolean | null;
};

function isStaffRole(role?: string | null) {
  return Boolean(
    role && (ADMIN_STAFF_ROLES as readonly string[]).includes(role),
  );
}

/** True when the user can use bulk email + SMS (add-on active, comped, or staff). */
export function hasMessagingAddon(user: MessagingAddonUser): boolean {
  if (isStaffRole(user.role)) return true;
  if (user.messagingAddonManual) return true;
  return ACTIVE_ADDON_STATUSES.has(
    (user.messagingAddonStatus || "").toLowerCase().trim(),
  );
}

/** Normalize a raw Stripe subscription status into our stored value. */
export function normalizeAddonStatus(status: string | null | undefined) {
  const s = (status || "").toLowerCase().trim();
  if (s === "active") return "active";
  if (s === "trialing") return "trialing";
  if (s === "past_due" || s === "unpaid") return "past_due";
  if (s === "canceled" || s === "cancelled") return "canceled";
  if (s === "incomplete" || s === "incomplete_expired") return "inactive";
  return s || "inactive";
}
