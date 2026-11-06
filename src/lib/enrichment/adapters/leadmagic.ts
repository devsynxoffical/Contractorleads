import { classifyHttpFailure, errorOutcome, requestJson, str, unparsed } from "../http";
import type { AdapterOutcome, ProviderAdapter } from "../types";
import { needsNameAndCompany } from "./common";

/**
 * LeadMagic: Find Work Email.
 * Docs: https://leadmagic.io/docs/api-reference/email-finder
 *
 * Per docs: POST https://api.leadmagic.io/v1/people/email-finder, X-API-Key header;
 * body first_name/last_name (or full_name) + domain (or company_name); response
 * { email, status: "valid" | null, credits_consumed, message, employment_verified?,
 * domain_mismatch?, requested_domain? }. 1 credit per valid email, free when status is
 * null; a domain mismatch is returned as a free not-found unless allow_domain_mismatch.
 * Timeout at least 30 s; 429 with Retry-After consumes no credits.
 */
export const leadmagicAdapter: ProviderAdapter = {
  id: "leadmagic",
  name: "LeadMagic",
  version: "1.0",
  targets: ["work_email"],
  keyField: "leadmagicApiKey",
  paid: true,
  async: false,
  concurrency: 5,
  timeoutMs: 45_000,
  docsUrl: "https://leadmagic.io/docs/api-reference/email-finder",

  eligible(input) {
    return needsNameAndCompany(input, true);
  },

  async run(input, _target, ctx): Promise<AdapterOutcome> {
    const body: Record<string, string> = {};
    if (input.ownerFirstName && input.ownerLastName) {
      body.first_name = input.ownerFirstName;
      body.last_name = input.ownerLastName;
    } else if (input.ownerName) {
      body.full_name = input.ownerName;
    }
    if (input.domain) body.domain = input.domain;
    else body.company_name = input.businessName;

    const res = await requestJson("https://api.leadmagic.io/v1/people/email-finder", {
      method: "POST",
      headers: { "X-API-Key": ctx.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeoutMs: 45_000,
      fetchImpl: ctx.fetchImpl,
    });
    if (!res.ok) return classifyHttpFailure(res, "LeadMagic");
    const json = res.json as {
      email?: string | null;
      status?: string | null;
      credits_consumed?: number;
      message?: string;
      employment_verified?: boolean;
      domain_mismatch?: boolean;
    } | null;
    if (unparsed(json) || !json || !("status" in json || "email" in json)) return errorOutcome("malformed", "LeadMagic: unexpected response");
    const units = typeof json.credits_consumed === "number" ? json.credits_consumed : null;
    const email = str(json.email);
    if (json.status !== "valid" || !email) {
      return {
        kind: "not_found",
        providerStatus: json.status ?? null,
        vendorCost: { units: units ?? 0, unit: "credit" },
        ...(json.domain_mismatch ? { note: "Email found on an unrelated domain; not returned and not charged" } : {}),
      };
    }
    const employment =
      typeof json.employment_verified === "boolean"
        ? json.employment_verified
          ? "employment verified"
          : "employment not verified"
        : "employment verification unavailable";
    return {
      kind: "found",
      providerStatus: "valid",
      vendorCost: { units, unit: "credit" },
      fields: {
        email: {
          value: email,
          providerStatus: "valid",
          // Docs: status "valid" = the finder pipeline verified the work email.
          providerVerified: true,
          catchAll: false,
          sourceUrl: null,
        },
        matchEvidence: `LeadMagic work-email finder (${employment})`,
      },
    };
  },
};
