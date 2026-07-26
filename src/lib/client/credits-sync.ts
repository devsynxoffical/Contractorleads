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
