"use client";

import type { IconType } from "react-icons";
import { FaLinkedinIn, FaSlack } from "react-icons/fa6";
import {
  SiGoogle,
  SiGooglemaps,
  SiGoogleanalytics,
  SiGmail,
  SiYelp,
  SiMeta,
  SiAnthropic,
  SiHubspot,
  SiInstagram,
  SiStripe,
  SiZapier,
  SiResend,
  SiNextdotjs,
  SiReact,
  SiTypescript,
  SiPostgresql,
  SiPrisma,
  SiTailwindcss,
  SiThreedotjs,
  SiFramer,
  SiRailway,
} from "react-icons/si";
import { RiOpenaiFill } from "react-icons/ri";

export type BrandLogo = {
  name: string;
  icon: IconType;
  color: string;
  bg: string;
};

/** Unique stack logos for marquees / social proof — no repeats */
export const SOCIAL_BRANDS: BrandLogo[] = [
  { name: "OpenAI", icon: RiOpenaiFill, color: "#000000", bg: "#f4f4f5" },
  { name: "Google", icon: SiGoogle, color: "#4285F4", bg: "#e8f0fe" },
  { name: "Google Maps", icon: SiGooglemaps, color: "#34A853", bg: "#e6f4ea" },
  { name: "Meta", icon: SiMeta, color: "#0866FF", bg: "#e7f0ff" },
  { name: "LinkedIn", icon: FaLinkedinIn, color: "#0A66C2", bg: "#e8f1fb" },
  { name: "Yelp", icon: SiYelp, color: "#FF1A1A", bg: "#ffe8e8" },
  { name: "Slack", icon: FaSlack, color: "#4A154B", bg: "#f4eaf5" },
  { name: "Stripe", icon: SiStripe, color: "#635BFF", bg: "#eeedff" },
  { name: "HubSpot", icon: SiHubspot, color: "#FF7A59", bg: "#fff0eb" },
  { name: "Zapier", icon: SiZapier, color: "#FF4A00", bg: "#fff0e8" },
  { name: "Gmail", icon: SiGmail, color: "#EA4335", bg: "#fce8e6" },
  { name: "Anthropic", icon: SiAnthropic, color: "#D4A27F", bg: "#faf4ef" },
];

export const INTEGRATION_BRANDS: BrandLogo[] = [
  { name: "Google Places", icon: SiGooglemaps, color: "#4285F4", bg: "#e8f0fe" },
  { name: "OpenAI", icon: RiOpenaiFill, color: "#000000", bg: "#f4f4f5" },
  { name: "Meta Ads", icon: SiMeta, color: "#0866FF", bg: "#e7f0ff" },
  { name: "Yelp", icon: SiYelp, color: "#FF1A1A", bg: "#ffe8e8" },
  { name: "LinkedIn", icon: FaLinkedinIn, color: "#0A66C2", bg: "#e8f1fb" },
  { name: "Stripe", icon: SiStripe, color: "#635BFF", bg: "#eeedff" },
  { name: "Resend", icon: SiResend, color: "#000000", bg: "#f4f4f5" },
  { name: "Zapier", icon: SiZapier, color: "#FF4A00", bg: "#fff0e8" },
  { name: "Slack", icon: FaSlack, color: "#4A154B", bg: "#f4eaf5" },
  { name: "HubSpot", icon: SiHubspot, color: "#FF7A59", bg: "#fff0eb" },
  { name: "Analytics", icon: SiGoogleanalytics, color: "#E37400", bg: "#fef0e0" },
  { name: "Instagram", icon: SiInstagram, color: "#E4405F", bg: "#fce8ee" },
];

export const TECH_BRANDS: BrandLogo[] = [
  { name: "Next.js", icon: SiNextdotjs, color: "#000000", bg: "#f4f4f5" },
  { name: "React", icon: SiReact, color: "#61DAFB", bg: "#eaf8fd" },
  { name: "OpenAI", icon: RiOpenaiFill, color: "#000000", bg: "#f4f4f5" },
  { name: "Three.js", icon: SiThreedotjs, color: "#000000", bg: "#f4f4f5" },
  { name: "Framer", icon: SiFramer, color: "#0055FF", bg: "#e8efff" },
  { name: "Tailwind", icon: SiTailwindcss, color: "#06B6D4", bg: "#e6fafc" },
  { name: "Prisma", icon: SiPrisma, color: "#2D3748", bg: "#eef0f2" },
  { name: "Postgres", icon: SiPostgresql, color: "#4169E1", bg: "#e8eeff" },
  { name: "Google", icon: SiGoogle, color: "#4285F4", bg: "#e8f0fe" },
  { name: "Meta", icon: SiMeta, color: "#0866FF", bg: "#e7f0ff" },
  { name: "Railway", icon: SiRailway, color: "#0B0D0E", bg: "#f0f0f0" },
  { name: "TypeScript", icon: SiTypescript, color: "#3178C6", bg: "#e8f1fa" },
];

export function BrandLogoChip({
  brand,
  showName = true,
  size = "md",
}: {
  brand: BrandLogo;
  showName?: boolean;
  size?: "sm" | "md";
}) {
  const Icon = brand.icon;
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-slate-200/90 bg-white px-3 py-1.5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <span
        className={`inline-flex ${box} shrink-0 items-center justify-center rounded-xl ring-1 ring-black/[0.04]`}
        style={{ background: brand.bg, color: brand.color }}
      >
        <Icon className={icon} />
      </span>
      {showName && (
        <span className="pr-1 text-[13px] font-semibold tracking-tight text-slate-700">
          {brand.name}
        </span>
      )}
    </span>
  );
}

export function BrandLogoMark({
  brand,
  className = "h-11 w-11",
  iconClassName = "h-[22px] w-[22px]",
}: {
  brand: BrandLogo;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = brand.icon;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl ring-1 ring-black/[0.04] ${className}`}
      style={{ background: brand.bg, color: brand.color }}
    >
      <Icon className={iconClassName} />
    </span>
  );
}
