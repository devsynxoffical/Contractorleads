"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { AuthBrandPanel, AuthMeshBackdrop } from "./auth-visual";
import { AuthSiteFooter, AuthSiteHeader } from "./auth-chrome";

type AuthMode = "login" | "register";

const panelCopy: Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    features: { label: string; detail: string }[];
  }
> = {
  login: {
    title: "Your contractor pipeline, ready when you are",
    subtitle:
      "Sign in to score live leads, enrich owners, and launch outreach from one workspace.",
    features: [
      {
        label: "Verified contacts only",
        detail: "Google, Yelp, and site data — never invented phones.",
      },
      {
        label: "AI scoring on every lead",
        detail: "Hot / Warm / Nurture with revenue bands and angles.",
      },
      {
        label: "Outreach in one click",
        detail: "Email, SMS, and call scripts saved to your library.",
      },
    ],
  },
  register: {
    title: "Start with 20 free credits — no card",
    subtitle:
      "Create your agency account, verify your business email, and ship your first qualified batch today.",
    features: [
      {
        label: "Business email verified",
        detail: "We keep free inboxes out so lead quality stays high.",
      },
      {
        label: "Tier‑1 market coverage",
        detail: "Search any trade across metros, ZIPs, and custom areas.",
      },
      {
        label: "Trial credits included",
        detail: "Explore Lead Finder, AI Assistant, and scoring risk-free.",
      },
    ],
  },
};

export function AuthPage({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (prev) root.setAttribute("data-theme", prev);
      else root.removeAttribute("data-theme");
    };
  }, []);

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        newMode === "login" ? "/login" : "/register",
      );
    }
  }, []);

  const copy = panelCopy[mode];

  return (
    <div className="auth-page relative flex min-h-screen flex-col bg-[#ffffff] text-slate-900">
      <AuthSiteHeader mode={mode} />

      <main className="relative flex flex-1 flex-col lg:flex-row">
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden>
          <AuthMeshBackdrop variant={mode} />
        </div>

        <div className="relative z-10 hidden w-[48%] min-w-0 xl:w-1/2 lg:block">
          <AuthBrandPanel
            variant={mode}
            title={copy.title}
            subtitle={copy.subtitle}
            features={copy.features}
          />
        </div>

        <div className="relative z-10 flex w-full flex-1 flex-col justify-center px-5 py-14 sm:px-10 lg:w-[52%] lg:px-14 xl:w-1/2 xl:px-20">
          <div className="mx-auto w-full max-w-[420px] rounded-[28px] border border-slate-200/90 bg-[#ffffff] p-6 shadow-[0_20px_60px_rgba(80,40,120,0.08)] sm:p-8">
            {mode === "login" ? (
              <LoginForm onSwitchToRegister={() => switchMode("register")} />
            ) : (
              <RegisterForm onSwitchToLogin={() => switchMode("login")} />
            )}

            <p className="mt-8 text-center text-[13px] text-slate-400">
              Need help?{" "}
              <Link
                href="mailto:hello@contractorleads.us"
                className="font-semibold text-fuchsia-600 transition hover:text-fuchsia-700"
              >
                Contact support
              </Link>
            </p>
          </div>

          <p className="mx-auto mt-8 max-w-[420px] text-center text-[11px] leading-relaxed text-slate-400">
            By continuing you agree to our Terms and Privacy Policy. Built for
            agencies that sell to home-service contractors.
          </p>
        </div>
      </main>

      <AuthSiteFooter />
    </div>
  );
}
