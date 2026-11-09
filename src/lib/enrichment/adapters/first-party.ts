import { extractWebsitePeople } from "@/lib/services/website-people";
import { discoverOwnerFromSearch, plausiblePersonName } from "@/lib/services/owner-discovery";
import { searchPublicWeb } from "@/lib/services/web-search";
import type { AdapterOutcome, ProviderAdapter } from "../types";

/**
 * Free first-party sources that always run before any paid provider:
 * the business's own website and public web search results. They cost no vendor
 * credits (Serper search usage is a platform cost shared with Lead Finder).
 */

const NOTHING: AdapterOutcome = { kind: "not_found", providerStatus: null, vendorCost: { units: 0, unit: "none" } };

export const websiteAdapter: ProviderAdapter = {
  id: "website",
  name: "Company website",
  version: "1.0",
  targets: ["owner", "work_email"],
  keyField: null,
  paid: false,
  async: false,
  concurrency: 8,
  timeoutMs: 12_000,
  docsUrl: "",

  eligible(input) {
    return input.website || input.domain ? { ok: true } : { ok: false, reason: "no website on record" };
  },

  async run(input, target): Promise<AdapterOutcome> {
    const site = input.website || `https://${input.domain}`;
    const people = await extractWebsitePeople(site, { budgetMs: 9_000 }).catch(() => null);
    if (!people) return NOTHING;
    if (target === "owner") {
      const owner = people.owner;
      if (!owner?.name || !plausiblePersonName(owner.name, input.businessName)) return NOTHING;
      return {
        kind: "found",
        providerStatus: null,
        vendorCost: { units: 0, unit: "none" },
        fields: {
          ownerName: owner.name,
          ...(owner.role ? { ownerTitle: owner.role } : {}),
          matchEvidence: `Named on the company website${people.pagesChecked[0] ? ` (${people.pagesChecked[0]})` : ""}`,
        },
      };
    }
    if (!people.email) return NOTHING;
    return {
      kind: "found",
      providerStatus: null,
      vendorCost: { units: 0, unit: "none" },
      fields: {
        email: {
          value: people.email,
          providerStatus: null,
          providerVerified: false,
          catchAll: false,
          sourceUrl: people.emailSourceUrl,
        },
        matchEvidence: "Published on the company website",
      },
    };
  },
};

const PHONE_RE = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;

export const webSearchAdapter: ProviderAdapter = {
  id: "web_search",
  name: "Public web search",
  version: "1.0",
  targets: ["owner", "phone"],
  keyField: null,
  paid: false,
  async: false,
  concurrency: 5,
  timeoutMs: 8_000,
  docsUrl: "",

  eligible(input) {
    return input.businessName ? { ok: true } : { ok: false, reason: "needs the business name" };
  },

  async run(input, target): Promise<AdapterOutcome> {
    const location = [input.city, input.state, input.country].filter(Boolean).join(", ");
    if (target === "owner") {
      const found = await discoverOwnerFromSearch(input.businessName, location).catch(() => null);
      if (!found?.ownerName || !plausiblePersonName(found.ownerName, input.businessName)) return NOTHING;
      return {
        kind: "found",
        providerStatus: null,
        vendorCost: { units: 0, unit: "none" },
        fields: {
          ownerName: found.ownerName,
          ...(found.ownerRole ? { ownerTitle: found.ownerRole } : {}),
          ...(found.ownerLinkedInUrl ? { linkedinUrl: found.ownerLinkedInUrl } : {}),
          matchEvidence: found.sourceUrl ? `Public search result: ${found.sourceUrl}` : "Public search result",
        },
      };
    }
    // Business phone from search snippets: an office/main line, never an owner mobile.
    const hits = await searchPublicWeb(`"${input.businessName}" ${location} phone`, 5).catch(() => []);
    for (const h of hits) {
      const m = `${h.title} ${h.snippet}`.match(PHONE_RE);
      if (m) {
        return {
          kind: "found",
          providerStatus: null,
          vendorCost: { units: 0, unit: "none" },
          fields: { phone: { value: m[0].trim(), type: "office" }, matchEvidence: `Search result: ${h.url}` },
        };
      }
    }
    return NOTHING;
  },
};
