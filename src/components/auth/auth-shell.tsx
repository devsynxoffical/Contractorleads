import Link from "next/link";
import type { IconType } from "react-icons";
import { HiOutlineBolt, HiOutlineShieldCheck } from "react-icons/hi2";

type AuthShellProps = {
  children: React.ReactNode;
  headline: string;
  description: string;
  features?: { icon: IconType; label: string }[];
};

const defaultFeatures = [
  { icon: HiOutlineBolt, label: "AI-verified leads across all 50 US states" },
  { icon: HiOutlineShieldCheck, label: "Never fabricate data — verified or blank" },
];

export function AuthShell({
  children,
  headline,
  description,
  features = defaultFeatures,
}: AuthShellProps) {
  return (
    <div className="auth-page relative flex min-h-screen flex-col">
      <div className="relative z-10 flex flex-1 flex-col lg:flex-row">
        {/* Left marketing panel */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-lg lg:mx-0">
            <div className="mb-10 lg:hidden">
              <span className="text-lg font-semibold text-[#1c1b1f]">
                Contractor Leads
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#1c1b1f] sm:text-4xl lg:text-[2.75rem]">
              {headline}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6b6b76]">
              {description}
            </p>

            <ul className="mt-10 space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.label} className="flex items-center gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[#5c4d7a] shadow-sm ring-1 ring-white/80">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-[#1c1b1f]">
                      {feature.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right form card */}
        <div className="flex flex-1 items-center justify-center px-6 pb-12 lg:px-12 lg:py-12">
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 shadow-[0_20px_60px_-15px_rgba(90,40,120,0.18)] sm:p-10">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/40 bg-white/50 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-[#9a9aa6] sm:flex-row">
          <p>© 2026 Contractor Leads. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-[#1c1b1f]">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-[#1c1b1f]">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-[#1c1b1f]">
              Security
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
