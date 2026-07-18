"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const START_EVENT = "leadflow:nav-start";
const DONE_EVENT = "leadflow:nav-done";

/** Call before slow programmatic navigations / async actions for instant feedback. */
export function startNavigationProgress() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(START_EVENT));
}

export function stopNavigationProgress() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DONE_EVENT));
}

function sameDestination(href: string, pathname: string) {
  try {
    const url = new URL(href, window.location.origin);
    return url.pathname === pathname;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function begin() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setActive(true);
    setVisible(true);
  }

  function end() {
    setActive(false);
    hideTimer.current = setTimeout(() => setVisible(false), 280);
  }

  useEffect(() => {
    end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const onStart = () => begin();
    const onDone = () => end();

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
        return;
      }
      if (sameDestination(href, pathname)) return;
      begin();
    };

    window.addEventListener(START_EVENT, onStart);
    window.addEventListener(DONE_EVENT, onDone);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener(START_EVENT, onStart);
      window.removeEventListener(DONE_EVENT, onDone);
      document.removeEventListener("click", onClick, true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] overflow-hidden"
      role="progressbar"
      aria-valuetext={active ? "Loading" : undefined}
      aria-hidden={!active}
    >
      <div
        className={cn(
          "h-full origin-left bg-gradient-to-r from-[#e6007e] via-[#8e24aa] to-[#7b1fa2]",
          active
            ? "animate-nav-progress"
            : "w-full opacity-0 transition-opacity duration-200"
        )}
      />
    </div>
  );
}
