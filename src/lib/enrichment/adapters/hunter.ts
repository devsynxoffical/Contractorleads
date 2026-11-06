import { classifyHttpFailure, errorOutcome, requestJson, str, unparsed } from "../http";
import type { AdapterContext, AdapterOutcome, ProviderAdapter } from "../types";
import { OWNER_TITLE_RE, needsNameAndCompany } from "./common";

/**
 * Hunter.io (existing provider, rebuilt).
 * Docs: https://hunter.io/api-documentation/v2
 *
 * Fixes vs the legacy adapter: key in the X-API-KEY header (never in the URL, which ends up
 * in logs); verification.status (valid | accept_all | unknown), accept_all, provenance and
 * public source URLs mapped; the domain-search fallback is used only to find the OWNER
 * (a person with an owner-type title), never to pass off a generic address as the owner's.
 * Credits (per docs): Email Finder charges only when an email is found; the X-Credits-Used
 * response header reports what was charged.
 */
const BASE = "https://api.hunter.io/v2";

function creditsUsed(h: Headers): number | null {
  const v = Number(h.get("x-credits-used"));
  return Number.isFinite(v) && h.get("x-credits-used") !== null ? v : null;
}

async function get(path: string, params: Record<string, string>, ctx: AdapterContext) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return requestJson(url.toString(), {
    method: "GET",
    headers: { "X-API-KEY": ctx.apiKey },
    timeoutMs: 25_000,
    fetchImpl: ctx.fetchImpl,
  });
}

type HunterFinder = {
  email?: string | null;
  score?: number | null;
  accept_all?: boolean;
  position?: string | null;
  linkedin_url?: string | null;
  provenance?: string;
  sources?: Array<{ uri?: string }>;
  verification?: { status?: string | null; date?: string | null };
};

export const hunterAdapter: ProviderAdapter = {
  id: "hunter",
  name: "Hunter.io",
  version: "2.0",
  targets: ["owner", "work_email"],
  keyField: "hunterApiKey",
  paid: true,
  async: false,
  concurrency: 5,
  timeoutMs: 25_000,
  docsUrl: "https://hunter.io/api-documentation/v2",

  eligible(input, target) {
    if (target === "owner") return input.domain ? { ok: true } : { ok: false, reason: "needs the company domain" };
    return needsNameAndCompany(input, true);
  },

  async run(input, target, ctx): Promise<AdapterOutcome> {
    if (target === "work_email") {
      const res = await get(
        "/email-finder",
        {
          domain: input.domain ?? "",
          company: input.domain ? "" : input.businessName,
          first_name: input.ownerFirstName ?? "",
          last_name: input.ownerLastName ?? "",
          full_name: input.ownerFirstName ? "" : input.ownerName ?? "",
          max_duration: "15",
        },
        ctx,
      );
      if (!res.ok) {
        if ("status" in res && res.status === 404) {
          return { kind: "not_found", providerStatus: null, vendorCost: { units: 0, unit: "credit" } };
        }
        return classifyHttpFailure(res, "Hunter");
      }
      const data = (res.json as { data?: HunterFinder } | null)?.data;
      if (!data || typeof data !== "object") return errorOutcome("malformed", "Hunter: missing data");
      const email = str(data.email);
      const credits = creditsUsed(res.headers);
      if (!email) return { kind: "not_found", providerStatus: null, vendorCost: { units: credits ?? 0, unit: "credit" } };
      const vStatus = str(data.verification?.status);
      return {
        kind: "found",
        providerStatus: vStatus,
        vendorCost: { units: credits, unit: "credit" },
        fields: {
          email: {
            value: email,
            providerStatus: vStatus,
            providerVerified: vStatus === "valid",
            catchAll: data.accept_all === true || vStatus === "accept_all",
            sourceUrl: str(data.sources?.[0]?.uri),
          },
          ...(str(data.position) ? { ownerTitle: data.position as string } : {}),
          ...(str(data.linkedin_url) ? { linkedinUrl: data.linkedin_url as string } : {}),
          matchEvidence: `Hunter Email Finder (${data.provenance ?? "unknown provenance"}, score ${data.score ?? "n/a"})`,
        },
      };
    }

    // Owner: domain search, keeping only people whose position is an owner-type title.
    const res = await get("/domain-search", { domain: input.domain ?? "", limit: "10", type: "personal" }, ctx);
    if (!res.ok) return classifyHttpFailure(res, "Hunter");
    if (unparsed(res.json)) return errorOutcome("malformed", "Hunter: unexpected response");
    const emails =
      (res.json as {
        data?: {
          emails?: Array<{
            value?: string;
            first_name?: string;
            last_name?: string;
            position?: string;
            linkedin?: string;
            verification?: { status?: string };
            sources?: Array<{ uri?: string }>;
          }>;
        };
      } | null)?.data?.emails ?? [];
    const owner = emails.find((e) => OWNER_TITLE_RE.test(e.position || "") && e.first_name && e.last_name);
    const credits = creditsUsed(res.headers);
    if (!owner) return { kind: "not_found", providerStatus: null, vendorCost: { units: credits, unit: "credit" } };
    const vStatus = str(owner.verification?.status);
    return {
      kind: "found",
      providerStatus: vStatus,
      vendorCost: { units: credits, unit: "credit" },
      fields: {
        ownerName: `${owner.first_name} ${owner.last_name}`,
        ...(str(owner.position) ? { ownerTitle: owner.position as string } : {}),
        ...(str(owner.linkedin) ? { linkedinUrl: owner.linkedin as string } : {}),
        ...(str(owner.value)
          ? {
              email: {
                value: owner.value as string,
                providerStatus: vStatus,
                providerVerified: vStatus === "valid",
                catchAll: vStatus === "accept_all",
                sourceUrl: str(owner.sources?.[0]?.uri),
              },
            }
          : {}),
        matchEvidence: `Hunter domain search: "${owner.position}" at ${input.domain}`,
      },
    };
  },
};
