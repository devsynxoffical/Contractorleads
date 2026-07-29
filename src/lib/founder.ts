import { SEO } from "@/lib/seo";

/** Shared founder profile — keep out of "use client" files so RSC pages can use it. */
export const FOUNDER = {
  name: "Vaishali Kapoor",
  title: "Founder",
  bio: "I'm building Contractor Leads to help agencies and operators find better local contractor leads without spending hours on manual research.",
  imageSrc: "/marketing/founder-portrait.jpg",
  imageAlt: "Vaishali Kapoor, Founder of Contractor Leads",
  facebook: SEO.social.facebook,
  linkedin: SEO.social.linkedin,
} as const;
