"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function MetaPixelTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const tick = () => {
      if (cancelled) return;
      attempts += 1;

      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        // Pixel wants PageView on every SPA navigation.
        window.fbq("track", "PageView");
        return;
      }

      // Wait for the Meta Pixel script to load (max ~2s).
      if (attempts < 15) {
        setTimeout(tick, 200);
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}

