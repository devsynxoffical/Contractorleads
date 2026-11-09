import type { Eligibility, NormalizedInput } from "../types";

/** Titles that identify an owner / decision-maker at a small contracting business. */
export const OWNER_TITLES = [
  "owner",
  "founder",
  "co-founder",
  "ceo",
  "president",
  "principal",
  "managing partner",
  "general manager",
];

export const OWNER_TITLE_RE = /owner|founder|ceo|chief executive|president|principal|partner|general manager|proprietor/i;

/** A value with "*" in it is a masked/unrevealed placeholder, never a real contact. */
export function isMasked(v: string | null | undefined): boolean {
  return Boolean(v && v.includes("*"));
}

export function hasPersonName(input: NormalizedInput): boolean {
  return Boolean((input.ownerFirstName && input.ownerLastName) || (input.ownerName && input.ownerName.includes(" ")));
}

/** Name-based email finders need a person name plus a company identifier. */
export function needsNameAndCompany(input: NormalizedInput, allowCompanyName: boolean): Eligibility {
  if (!hasPersonName(input)) return { ok: false, reason: "needs the owner's first and last name" };
  if (input.domain) return { ok: true };
  if (allowCompanyName && input.businessName) return { ok: true };
  return { ok: false, reason: allowCompanyName ? "needs a company domain or name" : "needs the company domain" };
}

export function fullName(input: NormalizedInput): string {
  return (input.ownerName || [input.ownerFirstName, input.ownerLastName].filter(Boolean).join(" ")).trim();
}
