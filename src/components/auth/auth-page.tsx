"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthMode = "login" | "register";

const panelCopy: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: "Welcome Back",
    subtitle:
      "Sign in to access verified home-service leads and grow your agency across Tier 1 countries.",
  },
  register: {
    title: "Unleash Your Pipeline",
    subtitle:
      "Join the next generation of agency owners — start with 20 free trial credits, no card required.",
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
    <div className="flex min-h-screen">
      {/* Left branding */}
      <div
        className="relative hidden min-h-screen w-1/2 flex-col overflow-hidden lg:flex"
        style={{
          background:
            "linear-gradient(145deg, #5b21b6 0%, #7c3aed 35%, #c026d3 70%, #db2777 100%)",
        }}
      >
        <div className="relative z-10 flex items-center gap-3 px-10 pt-10">
          <Image
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span className="text-[18px] font-semibold tracking-tight text-white">
            Contractor Leads
          </span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 lg:px-20">
          <h2
            className="text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] text-white lg:text-[48px]"
            style={{ fontFamily: "var(--font-outfit), var(--font-jakarta), system-ui, sans-serif" }}
          >
            {copy.title}
          </h2>
          <p
            className="mt-5 max-w-[380px] text-[16px] font-normal leading-[1.65] tracking-[0.01em] text-white/80 lg:text-[17px]"
            style={{ fontFamily: "var(--font-outfit), var(--font-jakarta), system-ui, sans-serif" }}
          >
            {copy.subtitle}
          </p>
        </div>

        <p className="relative z-10 px-10 pb-8 text-xs text-white/45">
          © 2026 Contractor Leads
        </p>
      </div>

      {/* Right form */}
      <div
        className="relative flex min-h-screen w-full flex-col lg:w-1/2"
        style={{
          backgroundColor: "#ffffff",
          backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="object-contain"
                priority
              />
              <span className="text-base font-semibold text-[#111827]">
                Contractor Leads
              </span>
            </div>

            {mode === "login" ? (
              <LoginForm onSwitchToRegister={() => switchMode("register")} />
            ) : (
              <RegisterForm onSwitchToLogin={() => switchMode("login")} />
            )}

            <p className="mt-10 text-center text-sm text-[#9ca3af]">
              Need help?{" "}
              <Link
                href="#"
                className="font-medium text-[#7c3aed] hover:underline"
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
