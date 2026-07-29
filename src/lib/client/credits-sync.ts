/** Browser event so the app shell can refresh the sidebar credit balance. */

export const CREDITS_CHANGED_EVENT = "contractorleads:credits-changed";

export type CreditsChangedDetail = {
  creditsRemaining?: number;
};

export function notifyCreditsChanged(creditsRemaining?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CreditsChangedDetail>(CREDITS_CHANGED_EVENT, {
      detail: { creditsRemaining },
    }),
  );
}

/** Fetch the live balance (e.g. after an admin grant while the tab stays open). */
export async function fetchCreditsRemaining(): Promise<number | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { creditsRemaining?: number };
    };
    const next = data?.user?.creditsRemaining;
    return typeof next === "number" && Number.isFinite(next) ? next : null;
  } catch {
    return null;
  }
}
