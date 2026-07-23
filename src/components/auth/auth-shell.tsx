import Link from "next/link";
import Image from "next/image";
import type { IconType } from "react-icons";
import { HiOutlineBolt, HiOutlineShieldCheck } from "react-icons/hi2";

type AuthShellProps = {
  children: React.ReactNode;
  headline: string;
  description: string;
  features?: { icon: IconType; label: string }[];
};

const defaultFeatures = [
  { icon: HiOutlineBolt, label: "AI-verified leads across Tier 1 markets" },
  { icon: HiOutlineShieldCheck, label: "Never fabricate data — verified or blank" },
];

export function AuthShell({
  children,
  headline,
  description,
  features = defaultFeatures,
}: AuthShellProps) {
  return (
    <div className="auth-page relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.05) 1px, transparent 1px), radial-gradient(ellipse 70% 50% at 65% 35%, rgba(147,51,234,0.22), transparent 55%), linear-gradient(180deg, rgba(7,13,24,0.55) 0%, rgba(7,13,24,0.88) 100%), url(/hud-cover.png)",
          backgroundSize: "48px 48px, 48px 48px, auto, auto, cover",
          backgroundPosition: "center, center, center, center, center top",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-lg lg:mx-0">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border border-brand-500/35 bg-brand-500/10">
                <Image
                  src="/logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="text-lg font-semibold text-white">
                Contractor Leads
              </span>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-500">
              LeadFlow HUD
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              {headline}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
              {description}
            </p>

            <ul className="mt-10 space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.label} className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brand-500/30 bg-brand-500/10 text-brand-500">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-white/90">
                      {feature.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-12 lg:py-12">
          <div className="hud-panel w-full max-w-[420px] !p-8 sm:!p-10">
            <span className="hud-bracket hud-bracket-tl" aria-hidden />
            <span className="hud-bracket hud-bracket-tr" aria-hidden />
            <span className="hud-bracket hud-bracket-bl" aria-hidden />
            <span className="hud-bracket hud-bracket-br" aria-hidden />
            {children}
          </div>
        </div>
      </div>

      <footer className="relative z-10 border-t border-brand-500/10 bg-[#0b1220]/70 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-white/55 sm:flex-row">
          <p>© 2026 Contractor Leads. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-brand-500">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-brand-500">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-brand-500">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
