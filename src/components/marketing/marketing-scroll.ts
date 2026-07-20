import type Lenis from "lenis";
import type { MouseEvent } from "react";

let marketingLenis: Lenis | null = null;

export function setMarketingLenis(instance: Lenis | null) {
  marketingLenis = instance;
}

/** Smooth-scroll to a hash selector or element (works with Lenis on the marketing page). */
export function scrollToMarketingHash(
  hashOrSelector: string,
  offset = 0,
) {
  if (typeof document === "undefined") return;
  const selector = hashOrSelector.startsWith("#") ? hashOrSelector : `#${hashOrSelector}`;
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return;

  if (marketingLenis) {
    marketingLenis.scrollTo(el, { offset, duration: 1.05 });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hash = selector.startsWith("#") ? selector : `#${selector}`;
  window.history.replaceState(null, "", hash);
}

export function handleMarketingHashClick(
  e: MouseEvent<HTMLAnchorElement>,
  hash: string,
  offset = 0,
) {
  e.preventDefault();
  scrollToMarketingHash(hash, offset);
}
