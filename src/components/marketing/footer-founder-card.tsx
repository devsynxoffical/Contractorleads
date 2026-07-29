"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFacebookF, FaLinkedinIn } from "react-icons/fa6";
import { SEO } from "@/lib/seo";

export const FOUNDER = {
  name: "Vaishali Kapoor",
  title: "Founder",
  bio: "I'm building Contractor Leads to help agencies and operators find better local contractor leads without spending hours on manual research.",
  imageSrc: "/marketing/founder-portrait.jpg",
  imageAlt: "Vaishali Kapoor, Founder of Contractor Leads",
  facebook: SEO.social.facebook,
  linkedin: SEO.social.linkedin,
} as const;

/**
 * Compact founder card for dark marketing footers —
 * portrait, name, bio, and social icons (reference-style).
 */
export function FooterFounderCard({
  name = FOUNDER.name,
  title = FOUNDER.title,
  bio = FOUNDER.bio,
}: {
  name?: string;
  title?: string;
  bio?: string;
}) {
  const pathname = usePathname();
  const social = [
    {
      href: FOUNDER.facebook,
      label: "Facebook",
      Icon: FaFacebookF,
    },
    {
      href: FOUNDER.linkedin,
      label: "LinkedIn",
      Icon: FaLinkedinIn,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-center gap-3.5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#3D1078] shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:h-[4.5rem] sm:w-[4.5rem]">
            <Image
              src={FOUNDER.imageSrc}
              alt={FOUNDER.imageAlt}
              fill
              sizes="72px"
              unoptimized
              className="object-cover object-[center_22%]"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tracking-tight text-white sm:text-[16px]">
              {name}
            </p>
            <p className="mt-0.5 text-[13px] text-white/50">{title}</p>
          </div>
        </div>

        <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/55 sm:text-[14px]">
          {bio}
        </p>

        <div className="mt-5 flex items-center gap-3">
          {social.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
          {pathname !== "/about" ? (
            <Link
              href="/about"
              className="ml-1 text-[12px] font-medium text-white/40 transition hover:text-white/70"
            >
              About →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
