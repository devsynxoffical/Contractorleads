import { classifyHttpFailure, errorOutcome, requestJson, retryAfterMs, str, unparsed } from "../http";
import type { AdapterOutcome, ProviderAdapter } from "../types";
import { fullName, needsNameAndCompany } from "./common";

/**
 * Findymail: work email from a person's full name + company domain (or company name).
 * Docs: https://app.findymail.com/docs/  ("Find from name", POST /api/search/name)
 *
 * Per docs: Authorization: Bearer <key>; body { name, domain }; 200 { contact: { name,
 * domain, email } }; 402 "Not enough credits"; 423 "Subscription is paused"; 429 with
 * retry_after; 1 finder credit when an email is found, free when none is found;
 * concurrency is capped by plan (25 simultaneous on Individual).
 */
export const findymailAdapter: ProviderAdapter = {
  id: "findymail",
  name: "Findymail",
  version: "1.0",
  targets: ["work_email"],
  keyField: "findymailApiKey",
  paid: true,
  async: false,
  concurrency: 10,
  timeoutMs: 60_000,
  docsUrl: "https://app.findymail.com/docs/",

  eligible(input) {
    return needsNameAndCompany(input, true);
  },

  async run(input, _target, ctx): Promise<AdapterOutcome> {
    const res = await requestJson("https://app.findymail.com/api/search/name", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name: fullName(input), domain: input.domain || input.businessName }),
      timeoutMs: 60_000,
      fetchImpl: ctx.fetchImpl,
    });
    if (!res.ok) {
      if (!("network" in res)) {
        if (res.status === 404) return { kind: "not_found", providerStatus: "404", vendorCost: { units: 0, unit: "finder_credit" } };
        if (res.status === 423) return errorOutcome("no_credit", "Findymail: subscription is paused");
        if (res.status === 429) {
          return errorOutcome("rate_limited", "Findymail: plan usage capacity reached", {
            retryAfterMs: retryAfterMs(res.headers, res.json),
          });
        }
      }
      return classifyHttpFailure(res, "Findymail");
    }
    const json = res.json as { contact?: { name?: string; email?: string; domain?: string } | null; error?: string } | null;
    if (unparsed(json) || !json || !("contact" in json)) return errorOutcome("malformed", "Findymail: unexpected response");
    const email = str(json.contact?.email);
    if (!email) return { kind: "not_found", providerStatus: null, vendorCost: { units: 0, unit: "finder_credit" } };
    return {
      kind: "found",
      providerStatus: "found",
      vendorCost: { units: 1, unit: "finder_credit" },
      fields: {
        email: {
          value: email,
          providerStatus: "found",
          // The name-search docs do not state a verification status, so our verifier decides.
          providerVerified: false,
          catchAll: false,
          sourceUrl: null,
        },
        matchEvidence: `Findymail name search: ${json.contact?.name ?? fullName(input)} at ${json.contact?.domain ?? input.domain}`,
      },
    };
  },
};
