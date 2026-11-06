import { classifyHttpFailure, errorOutcome, requestJson, str, unparsed } from "../http";
import type { AdapterContext, AdapterOutcome, EnrichmentTarget, NormalizedInput, ProviderAdapter } from "../types";
import { OWNER_TITLES, isMasked, needsNameAndCompany } from "./common";

/**
 * Apollo.io (existing provider, rebuilt on the current API).
 * Docs: https://docs.apollo.io/reference/people-enrichment
 *       https://docs.apollo.io/reference/people-api-search
 *
 * Fixes vs the legacy adapter: current /api/v1 paths, key only in the x-api-key header,
 * no forced personal-email reveal (work emails only), email_status mapped.
 * Credits (per docs): people/match charges 1 credit when it returns email or new
 * demographic data, 0 when nothing credit-consuming is returned; api_search is free.
 */
const BASE = "https://api.apollo.io/api/v1";

type ApolloPerson = {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  title?: string;
  email?: string;
  email_status?: string;
  linkedin_url?: string;
};

function headers(ctx: AdapterContext) {
  return { "Content-Type": "application/json", "Cache-Control": "no-cache", "x-api-key": ctx.apiKey };
}

function personOutcome(person: ApolloPerson | null | undefined, target: EnrichmentTarget): AdapterOutcome {
  if (!person) return { kind: "not_found", providerStatus: null, vendorCost: { units: 0, unit: "credit" } };
  const email = str(person.email);
  const name = str(person.name) || [person.first_name, person.last_name].filter(Boolean).join(" ").trim() || null;
  const usableEmail = email && !isMasked(email) && !/email_not_unlocked|domain\.com$/i.test(email) ? email : null;
  if (target === "work_email" && !usableEmail) {
    return { kind: "not_found", providerStatus: str(person.email_status), vendorCost: { units: null, unit: "credit" } };
  }
  if (target === "owner" && !name) {
    return { kind: "not_found", providerStatus: null, vendorCost: { units: null, unit: "credit" } };
  }
  return {
    kind: "found",
    providerStatus: str(person.email_status),
    // Email returned = 1 credit per docs; demographics-only charge depends on match confidence.
    vendorCost: { units: usableEmail ? 1 : null, unit: "credit" },
    upstreamRequestId: str(person.id),
    fields: {
      ...(name ? { ownerName: name } : {}),
      ...(str(person.title) ? { ownerTitle: person.title } : {}),
      ...(str(person.linkedin_url) ? { linkedinUrl: person.linkedin_url } : {}),
      ...(usableEmail
        ? {
            email: {
              value: usableEmail,
              providerStatus: str(person.email_status),
              providerVerified: person.email_status === "verified",
              catchAll: false,
              sourceUrl: null,
            },
          }
        : {}),
      matchEvidence: "Apollo person match on name + company",
    },
  };
}

async function match(body: Record<string, unknown>, ctx: AdapterContext): Promise<AdapterOutcome | { person: ApolloPerson | null }> {
  const res = await requestJson(`${BASE}/people/match`, {
    method: "POST",
    headers: headers(ctx),
    body: JSON.stringify(body),
    timeoutMs: 15_000,
    fetchImpl: ctx.fetchImpl,
  });
  if (!res.ok) return classifyHttpFailure(res, "Apollo");
  const json = res.json as { person?: ApolloPerson | null } | null;
  if (unparsed(json) || !json) return errorOutcome("malformed", "Apollo: unexpected response");
  return { person: json.person ?? null };
}

export const apolloAdapter: ProviderAdapter = {
  id: "apollo",
  name: "Apollo.io",
  version: "2.0",
  targets: ["owner", "work_email"],
  keyField: "apolloApiKey",
  paid: true,
  async: false,
  concurrency: 5,
  timeoutMs: 15_000,
  docsUrl: "https://docs.apollo.io/reference/people-enrichment",

  eligible(input: NormalizedInput, target: EnrichmentTarget) {
    if (target === "owner") return input.domain ? { ok: true } : { ok: false, reason: "needs the company domain" };
    return needsNameAndCompany(input, true);
  },

  async run(input, target, ctx) {
    if (target === "work_email") {
      const r = await match(
        {
          first_name: input.ownerFirstName || undefined,
          last_name: input.ownerLastName || undefined,
          name: input.ownerFirstName ? undefined : input.ownerName || undefined,
          domain: input.domain || undefined,
          organization_name: input.domain ? undefined : input.businessName,
        },
        ctx,
      );
      return "person" in r ? personOutcome(r.person, "work_email") : r;
    }

    // Owner: free people search by company domain + owner titles, then match the top result by ID.
    const search = await requestJson(`${BASE}/mixed_people/api_search`, {
      method: "POST",
      headers: headers(ctx),
      body: JSON.stringify({
        q_organization_domains_list: [input.domain],
        person_titles: OWNER_TITLES,
        page: 1,
        per_page: 3,
      }),
      timeoutMs: 15_000,
      fetchImpl: ctx.fetchImpl,
    });
    if (!search.ok) return classifyHttpFailure(search, "Apollo search");
    if (unparsed(search.json)) return errorOutcome("malformed", "Apollo search: unexpected response");
    const people = (search.json as { people?: Array<{ id?: string }> } | null)?.people ?? [];
    const top = people.find((p) => str(p.id));
    if (!top?.id) return { kind: "not_found", providerStatus: null, vendorCost: { units: 0, unit: "credit" } };
    const r = await match({ id: top.id }, ctx);
    return "person" in r ? personOutcome(r.person, "owner") : r;
  },
};
