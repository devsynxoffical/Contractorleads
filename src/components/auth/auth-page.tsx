"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HiOutlineBolt,
  HiOutlineMap,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthMode = "login" | "register";

const panelCopy: Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    features: { icon: typeof HiOutlineBolt; label: string }[];
  }
> = {
  login: {
    title: "Welcome Back",
    subtitle:
      "Sign in to access verified home-service leads and grow your agency across Tier 1 countries.",
    features: [
      { icon: HiOutlineShieldCheck, label: "Verified contacts only" },
      { icon: HiOutlineMap, label: "Global lead map & scoring" },
      { icon: HiOutlineBolt, label: "AI outreach in one click" },
    ],
  },
  register: {
    title: "Unleash Your Pipeline",
    subtitle:
      "Join the next generation of agency owners — start with 20 free trial credits, no card required.",
    features: [
      { icon: HiOutlineBolt, label: "20 free trial credits" },
      { icon: HiOutlineShieldCheck, label: "Business email verified" },
      { icon: HiOutlineMap, label: "Search any Tier 1 market" },
    ],
  },
};

export function AuthPage({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        newMode === "login" ? "/login" : "/register"
      );
    }
  }, []);

  const copy = panelCopy[mode];

  return (
    <div className="auth-page relative flex min-h-screen overflow-hidden bg-[#070d18]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--hud-grid) 1px, transparent 1px), linear-gradient(90deg, var(--hud-grid) 1px, transparent 1px), radial-gradient(ellipse 70% 50% at 65% 35%, var(--cover-glow), transparent 55%), var(--cover-veil), url(/hud-cover.png)",
          backgroundSize: "48px 48px, 48px 48px, auto, auto, cover",
          backgroundPosition: "center, center, center, center, center top",
        }}
        aria-hidden
      />

      {/* Left branding */}
      <div className="relative z-10 hidden min-h-screen w-1/2 flex-col border-r border-brand-500/15 lg:flex">
        <div className="relative z-10 flex items-center gap-3 px-10 pt-10">
          <div className="flex h-10 w-10 items-center justify-center border border-brand-500/35 bg-brand-500/10">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-[18px] font-semibold tracking-tight text-ink">
            Contractor Leads
          </span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 lg:px-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">
            LeadFlow
          </p>
          <h2
            className="mt-3 bg-clip-text text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] text-transparent lg:text-[48px]"
            style={{
              fontFamily:
                "var(--font-outfit), var(--font-jakarta), system-ui, sans-serif",
              backgroundImage: "var(--logo-gradient)",
            }}
          >
            {copy.title}
          </h2>
          <p
            className="mt-5 max-w-[380px] text-[16px] font-normal leading-[1.65] tracking-[0.01em] text-[#8b9aab] lg:text-[17px]"
            style={{
              fontFamily:
                "var(--font-outfit), var(--font-jakarta), system-ui, sans-serif",
            }}
          >
            {copy.subtitle}
          </p>

          <ul className="mt-10 space-y-3.5">
            {copy.features.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center border border-brand-500/30 bg-brand-500/10 text-brand-500">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-[#c5d0dc]">
                    {f.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            <span className="hud-pill">Verified leads</span>
            <span className="hud-pill hud-pill-muted">AI scored</span>
            <span className="hud-pill hud-pill-muted">Global map</span>
          </div>
        </div>

        <p className="relative z-10 px-10 pb-8 text-xs text-[#5c6b7c]">
          © 2026 Contractor Leads
        </p>
      </div>

      {/* Right form */}
      <div className="relative z-10 flex min-h-screen w-full flex-col lg:w-1/2">
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="hud-panel mx-auto w-full max-w-[420px] !p-6 sm:!p-8">
            <span className="hud-bracket hud-bracket-tl" aria-hidden />
            <span className="hud-bracket hud-bracket-tr" aria-hidden />
            <span className="hud-bracket hud-bracket-bl" aria-hidden />
            <span className="hud-bracket hud-bracket-br" aria-hidden />

            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="object-contain"
                priority
              />
              <span className="text-base font-semibold text-white">
                Contractor Leads
              </span>
            </div>

            {mode === "login" ? (
              <LoginForm onSwitchToRegister={() => switchMode("register")} />
            ) : (
              <RegisterForm onSwitchToLogin={() => switchMode("login")} />
            )}

            <p className="mt-10 text-center text-sm text-[#5c6b7c]">
              Need help?{" "}
              <Link
                href="#"
                className="font-medium text-brand-500 hover:underline"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
