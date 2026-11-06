import { classifyHttpFailure, errorOutcome, requestJson, str, unparsed } from "../http";
import type { AdapterOutcome, ProviderAdapter } from "../types";

/**
 * NinjaPear / nubela.co (the fourth existing provider): company details from a website,
 * including executives and social profiles. Same request as the legacy adapter
 * (src/lib/services/ninjapear.ts); errors are now classified instead of swallowed.
 * Docs: https://nubela.co/docs
 */
export const ninjapearAdapter: ProviderAdapter = {
  id: "ninjapear",
  name: "NinjaPear",
  version: "2.0",
  targets: ["owner"],
  keyField: "ninjapearApiKey",
  paid: true,
  async: false,
  concurrency: 3,
  timeoutMs: 20_000,
  docsUrl: "https://nubela.co/docs",

  eligible(input) {
    return input.website || input.domain ? { ok: true } : { ok: false, reason: "needs the company website" };
  },

  async run(input, _target, ctx): Promise<AdapterOutcome> {
    const website = input.website?.startsWith("http") ? input.website : `https://${input.website || input.domain}`;
    const url = new URL("https://nubela.co/api/v1/company/details");
    url.searchParams.set("website", website);
    const res = await requestJson(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${ctx.apiKey}` },
      timeoutMs: 20_000,
      fetchImpl: ctx.fetchImpl,
    });
    if (!res.ok) {
      if ("status" in res && res.status === 404) {
        return { kind: "not_found", providerStatus: "404", vendorCost: { units: null, unit: "credit" } };
      }
      return classifyHttpFailure(res, "NinjaPear");
    }
    if (unparsed(res.json)) return errorOutcome("malformed", "NinjaPear: unexpected response");
    const data = res.json as {
      facebook_url?: string | null;
      instagram_url?: string | null;
      executives?: Array<{ name?: string; title?: string; role?: string }>;
    } | null;
    const exec = data?.executives?.find((e) =>
      /ceo|founder|owner|president|principal/i.test(`${e.title ?? ""} ${e.role ?? ""}`),
    );
    const name = str(exec?.name);
    if (!name) {
      return { kind: "not_found", providerStatus: null, vendorCost: { units: null, unit: "credit" } };
    }
    return {
      kind: "found",
      providerStatus: null,
      vendorCost: { units: null, unit: "credit" },
      fields: {
        ownerName: name,
        ...(str(exec?.title) || str(exec?.role) ? { ownerTitle: (exec?.title || exec?.role) as string } : {}),
        ...(str(data?.facebook_url) ? { facebook: data?.facebook_url as string } : {}),
        ...(str(data?.instagram_url) ? { instagram: data?.instagram_url as string } : {}),
        matchEvidence: `NinjaPear company details for ${input.domain || input.website}`,
      },
    };
  },
};
