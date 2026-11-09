/**
 * Core contract for multi-provider enrichment.
 *
 * Every provider adapter turns its native response into an AdapterOutcome, so the
 * orchestrator never sees vendor-specific shapes. Unknown values stay unknown (null),
 * never zero or "verified".
 */
import type { PlatformKeyField } from "@/lib/platform-keys";

/** Fields a job can ask for. Each is its own track with its own stop rule. */
export type EnrichmentTarget = "owner" | "work_email" | "phone" | "mobile";

export const ENRICHMENT_TARGETS: EnrichmentTarget[] = ["owner", "work_email", "phone", "mobile"];

export const TARGET_LABELS: Record<EnrichmentTarget, string> = {
  owner: "Owner / decision-maker",
  work_email: "Owner work email",
  phone: "Business phone",
  mobile: "Owner mobile (opt-in, higher vendor cost)",
};

export type ProviderId =
  | "website"
  | "web_search"
  | "apollo"
  | "hunter"
  | "prospeo"
  | "ninjapear"
  | "findymail"
  | "leadmagic"
  | "icypeas";

/** Input after normalization; original values are kept separately on the row. */
export type NormalizedInput = {
  businessName: string;
  /** Registrable company domain without www, e.g. "acmeroofing.com" */
  domain: string | null;
  website: string | null;
  ownerName: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerTitle: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  linkedinUrl: string | null;
};

/** Email status after acceptance, kept distinct per the blueprint. */
export type EmailStatus = "valid" | "catch_all" | "unknown" | "role" | "invalid";

export type FoundEmail = {
  value: string;
  /** Native status string from the provider, unchanged (e.g. "valid", "VERIFIED", "ultra_sure") */
  providerStatus: string | null;
  /** True only when the provider's own documented status means a deliverable, verified address */
  providerVerified: boolean;
  /** True when the provider reports the domain accepts all addresses */
  catchAll: boolean;
  sourceUrl: string | null;
};

export type FoundPhone = {
  value: string;
  type: "office" | "mobile" | "unknown";
};

export type FoundFields = {
  email?: FoundEmail;
  ownerName?: string;
  ownerTitle?: string;
  linkedinUrl?: string;
  phone?: FoundPhone;
  facebook?: string;
  instagram?: string;
  website?: string;
  /** Evidence connecting the person to the company, shown in provider history */
  matchEvidence?: string;
};

export type VendorCost = {
  /** Units charged by the vendor; null = unknown (never assume zero) */
  units: number | null;
  unit: string;
};

export type AdapterErrorCode =
  | "auth" // key invalid, revoked or missing permission
  | "no_credit" // vendor balance exhausted / subscription paused
  | "rate_limited"
  | "invalid_input"
  | "timeout"
  | "upstream" // 5xx or vendor internal error
  | "malformed"; // response we could not parse

export type AdapterOutcome =
  | {
      kind: "found";
      fields: FoundFields;
      vendorCost: VendorCost;
      providerStatus: string | null;
      upstreamRequestId?: string | null;
    }
  | {
      kind: "not_found";
      vendorCost: VendorCost;
      providerStatus: string | null;
      /** Optional explanation, e.g. "domain mismatch, not charged" */
      note?: string;
    }
  | {
      kind: "pending";
      upstreamRequestId: string;
      retryAfterMs: number;
      vendorCost?: VendorCost;
    }
  | {
      kind: "error";
      code: AdapterErrorCode;
      message: string;
      retryAfterMs?: number;
      /** True when the request may have reached the vendor (timeout/5xx): never resubmit blindly */
      outcomeUnknown?: boolean;
    };

export type AdapterContext = {
  apiKey: string;
  /** Opt-in controls: only reveal paid extras when the job asked for them */
  revealMobile: boolean;
  fetchImpl?: typeof fetch;
};

export type Eligibility = { ok: true } | { ok: false; reason: string };

export type ProviderAdapter = {
  id: ProviderId;
  name: string;
  version: string;
  /** Targets this adapter can fill */
  targets: EnrichmentTarget[];
  /** Platform key that must be configured; null = free first-party source */
  keyField: PlatformKeyField | null;
  /** Paid provider (spends vendor credits) */
  paid: boolean;
  /** Async providers return "pending" and are resumed later */
  async: boolean;
  /** Max simultaneous calls from this server, per vendor docs/plan */
  concurrency: number;
  /** HTTP timeout for one call */
  timeoutMs: number;
  /** Docs URL for the admin screen */
  docsUrl: string;
  eligible(input: NormalizedInput, target: EnrichmentTarget): Eligibility;
  run(input: NormalizedInput, target: EnrichmentTarget, ctx: AdapterContext): Promise<AdapterOutcome>;
  /** Async providers only: fetch the result of an earlier submission */
  resume?(upstreamRequestId: string, ctx: AdapterContext): Promise<AdapterOutcome>;
};

/** Accepted value for one target, with provenance, stored on the row. */
export type AcceptedField = {
  value: string;
  provider: ProviderId | "input";
  /** For emails: valid | catch_all | unknown | role | invalid */
  status?: EmailStatus | "office" | "mobile" | "unknown";
  checkedAt: string;
  verifiedBy?: string | null;
  sourceUrl?: string | null;
  evidence?: string | null;
  /** true when this value already existed on the input (not newly found) */
  preExisting: boolean;
};

export type RowResult = Partial<Record<EnrichmentTarget, AcceptedField>> & {
  ownerTitle?: string | null;
  linkedinUrl?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  /** Best reviewable email when no acceptable one was found (catch-all / unknown) */
  emailForReview?: AcceptedField | null;
};

export type TrackState = {
  /** Position in the provider order for this track */
  next: number;
  done: boolean;
  /** Outcome summary once done */
  outcome?: "accepted" | "review" | "not_found" | "needs_input" | "budget" | "error";
  reason?: string;
};
