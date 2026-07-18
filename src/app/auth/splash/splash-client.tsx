"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const HUD_GRADIENT = "linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)";

/**
 * Brief branded splash after login / signup completion, then dashboard.
 */
export default function AuthSplashClient() {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 2500);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px), radial-gradient(ellipse 70% 50% at 50% 40%, rgba(0,180,220,0.25), transparent 55%), linear-gradient(180deg, rgba(7,13,24,0.6) 0%, rgba(7,13,24,0.92) 100%), url(/hud-cover.png)",
          backgroundSize: "48px 48px, 48px 48px, auto, auto, cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />
      <div className="auth-splash-in relative z-10 flex flex-col items-center">
        <div
          className="flex h-20 w-20 items-center justify-center overflow-hidden border border-[#00e5ff]/40 shadow-[0_0_32px_rgba(0,229,255,0.35)] sm:h-24 sm:w-24"
          style={{ background: HUD_GRADIENT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Contractor Leads"
            className="h-14 w-14 object-contain sm:h-16 sm:w-16"
          />
        </div>
        <h1
          className="mt-6 bg-clip-text text-center text-2xl font-bold tracking-tight text-transparent sm:text-3xl"
          style={{ backgroundImage: HUD_GRADIENT }}
        >
          Contractor Leads
        </h1>
        <p className="mt-2 text-sm text-[#8b9aab]">Loading your workspace…</p>
        <div
          className="mt-8 h-1 w-32 overflow-hidden bg-[#122033]"
          aria-hidden
        >
          <div
            className="auth-splash-bar h-full w-full origin-left"
            style={{ background: HUD_GRADIENT }}
          />
        </div>
      </div>
    </div>
  );
}
