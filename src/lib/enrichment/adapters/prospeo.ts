import { errorOutcome, requestJson, retryAfterMs, str, unparsed } from "../http";
import type { AdapterOutcome, ProviderAdapter } from "../types";
import { isMasked, needsNameAndCompany } from "./common";

/**
 * Prospeo (existing provider, rebuilt).
 * Docs: https://prospeo.io/api-docs/enrich-person
 *
 * Fixes vs the legacy adapter: enrich_mobile is false unless the job asked for the owner
 * mobile (a mobile reveal costs 10 credits instead of 1); only_verified_email is true for
 * email lookups; HTTP 400 error_code values (INSUFFICIENT_CREDITS, INVALID_API_KEY, ...) are
 * surfaced instead of being treated as "no match"; masked (unrevealed) values are rejected.
 * Credits (per docs): 1 per email found, 10 when a mobile is revealed, 0 for NO_MATCH, and
 * free_enrichment = true when the same record was enriched in the last 90 days.
 */
const URL_ENRICH = "https://api.prospeo.io/enrich-person";

type ProspeoPerson = {
  person_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  current_job_title?: string;
  linkedin_url?: string;
  email?: { status?: string; revealed?: boolean; email?: string } | null;
  mobile?: { status?: string; revealed?: boolean; mobile?: string; mobile_international?: string } | null;
};

export const prospeoAdapter: ProviderAdapter = {
  id: "prospeo",
  name: "Prospeo",
  version: "2.0",
  targets: ["work_email", "mobile"],
  keyField: "prospeoApiKey",
  paid: true,
  async: false,
  concurrency: 5,
  timeoutMs: 30_000,
  docsUrl: "https://prospeo.io/api-docs/enrich-person",

  eligible(input) {
    // Prospeo matches on person + company; the company website is the strongest identifier.
    return needsNameAndCompany(input, true);
  },

  async run(input, target, ctx): Promise<AdapterOutcome> {
    const wantMobile = target === "mobile" && ctx.revealMobile;
    if (target === "mobile" && !ctx.revealMobile) {
      return errorOutcome("invalid_input", "Mobile lookup was not requested for this job");
    }
    const data: Record<string, string> = {};
    if (input.ownerFirstName) data.first_name = input.ownerFirstName;
    if (input.ownerLastName) data.last_name = input.ownerLastName;
    if (!input.ownerFirstName && input.ownerName) data.full_name = input.ownerName;
    if (input.domain) data.company_website = input.domain;
    else data.company_name = input.businessName;
    if (input.linkedinUrl && input.linkedinUrl.includes("/in/")) data.linkedin_url = input.linkedinUrl;

    const res = await requestJson(URL_ENRICH, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-KEY": ctx.apiKey },
      body: JSON.stringify(
        wantMobile
          ? { only_verified_mobile: true, enrich_mobile: true, data }
          : { only_verified_email: true, enrich_mobile: false, data },
      ),
      timeoutMs: 30_000,
      fetchImpl: ctx.fetchImpl,
    });

    if (!res.ok) {
      if ("network" in res) {
        return errorOutcome(res.timeout ? "timeout" : "upstream", `Prospeo: ${res.message}`, { outcomeUnknown: true });
      }
      const code = str((res.json as { error_code?: unknown } | null)?.error_code);
      if (code === "NO_MATCH") return { kind: "not_found", providerStatus: code, vendorCost: { units: 0, unit: "credit" } };
      if (code === "INVALID_DATAPOINTS") return errorOutcome("invalid_input", "Prospeo: INVALID_DATAPOINTS");
      if (code === "INSUFFICIENT_CREDITS") return errorOutcome("no_credit", "Prospeo: INSUFFICIENT_CREDITS");
      if (code === "INVALID_API_KEY") return errorOutcome("auth", "Prospeo: INVALID_API_KEY");
      if (res.status === 429 || code === "RATE_LIMITED") {
        return errorOutcome("rate_limited", "Prospeo: rate limited", { retryAfterMs: retryAfterMs(res.headers) });
      }
      if (res.status === 401 || res.status === 403) return errorOutcome("auth", `Prospeo HTTP ${res.status}`);
      return errorOutcome("upstream", `Prospeo HTTP ${res.status}${code ? `: ${code}` : ""}`, {
        outcomeUnknown: res.status >= 500,
      });
    }

    const json = res.json as { error?: boolean; free_enrichment?: boolean; person?: ProspeoPerson | null } | null;
    if (unparsed(json) || !json || json.error) return errorOutcome("malformed", "Prospeo: unexpected response");
    const p = json.person;
    if (!p) return { kind: "not_found", providerStatus: null, vendorCost: { units: 0, unit: "credit" } };

    const name = str(p.full_name) || [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || null;
    const emailVal = p.email?.revealed !== false ? str(p.email?.email) : null;
    const email = emailVal && !isMasked(emailVal) ? emailVal : null;
    const mobileVal = p.mobile?.revealed ? str(p.mobile?.mobile_international) || str(p.mobile?.mobile) : null;
    const mobile = mobileVal && !isMasked(mobileVal) ? mobileVal : null;
    const free = json.free_enrichment === true;

    if (target === "mobile" && !mobile) {
      return { kind: "not_found", providerStatus: p.mobile?.status ?? null, vendorCost: { units: free ? 0 : null, unit: "credit" } };
    }
    if (target === "work_email" && !email) {
      return { kind: "not_found", providerStatus: p.email?.status ?? null, vendorCost: { units: 0, unit: "credit" } };
    }
    return {
      kind: "found",
      providerStatus: (target === "mobile" ? p.mobile?.status : p.email?.status) ?? null,
      vendorCost: { units: free ? 0 : target === "mobile" ? 10 : 1, unit: "credit" },
      upstreamRequestId: str(p.person_id),
      fields: {
        ...(name ? { ownerName: name } : {}),
        ...(str(p.current_job_title) ? { ownerTitle: p.current_job_title as string } : {}),
        ...(str(p.linkedin_url) ? { linkedinUrl: p.linkedin_url as string } : {}),
        ...(email
          ? {
              email: {
                value: email,
                providerStatus: p.email?.status ?? null,
                providerVerified: p.email?.status === "VERIFIED",
                catchAll: false,
                sourceUrl: null,
              },
            }
          : {}),
        ...(mobile ? { phone: { value: mobile, type: "mobile" as const } } : {}),
        matchEvidence: "Prospeo person match on name + company",
      },
    };
  },
};
