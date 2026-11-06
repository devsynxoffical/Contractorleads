import { classifyHttpFailure, errorOutcome, requestJson, str, unparsed } from "../http";
import type { AdapterContext, AdapterOutcome, NormalizedInput, ProviderAdapter } from "../types";
import { needsNameAndCompany } from "./common";

/**
 * Icypeas: asynchronous email search.
 * Docs: https://api-doc.icypeas.com/reference/email-search
 *       https://api-doc.icypeas.com/reference/get-results
 *       https://api-doc.icypeas.com/statuses  https://api-doc.icypeas.com/certainties
 *
 * Per docs: Authorization is the raw key (no "Bearer"); POST /api/email-search with
 * { firstname, lastname, domainOrCompany, custom: { externalId } } returns
 * { success: true, item: { _id, status: "NONE" } } — an id, not the email. Read with
 * POST /api/bulk-single-searchs/read { id } (max 30 reads/minute). Still running:
 * NONE | SCHEDULED | IN_PROGRESS. Finished: FOUND / DEBITED (email in
 * results.emails[] with certainty), NOT_FOUND / DEBITED_NOT_FOUND, BAD_INPUT,
 * INSUFFICIENT_FUNDS, ABORTED. Input mistakes return HTTP 200 with success: false.
 * 1 credit only when an email is found.
 */
const BASE = "https://app.icypeas.com/api";
const RUNNING = new Set(["NONE", "SCHEDULED", "IN_PROGRESS"]);
/** Reads are limited to 30/minute per account; wait a little longer than the 3 s minimum. */
const READ_DELAY_MS = 6_000;

function headers(ctx: AdapterContext) {
  return { Authorization: ctx.apiKey, "Content-Type": "application/json" };
}

type IcypeasItem = {
  _id?: string;
  status?: string;
  results?: { emails?: Array<{ email?: string; certainty?: string }> };
};

function itemOutcome(item: IcypeasItem): AdapterOutcome {
  const status = str(item.status) ?? "UNKNOWN";
  if (RUNNING.has(status)) {
    return { kind: "pending", upstreamRequestId: item._id ?? "", retryAfterMs: READ_DELAY_MS };
  }
  if (status === "FOUND" || status === "DEBITED") {
    const best = (item.results?.emails ?? []).find((e) => str(e.email) && e.certainty !== "not_found" && e.certainty !== "undeliverable");
    if (!best?.email) return { kind: "not_found", providerStatus: status, vendorCost: { units: null, unit: "credit" } };
    const certainty = str(best.certainty);
    return {
      kind: "found",
      providerStatus: certainty ?? status,
      vendorCost: { units: 1, unit: "credit" },
      upstreamRequestId: item._id ?? null,
      fields: {
        email: {
          value: best.email,
          providerStatus: certainty,
          // Docs: ultra_sure / very_sure = 99% confidence; probable (95%) goes to our verifier.
          providerVerified: certainty === "ultra_sure" || certainty === "very_sure",
          catchAll: false,
          sourceUrl: null,
        },
        matchEvidence: `Icypeas email search (certainty ${certainty ?? "n/a"})`,
      },
    };
  }
  if (status === "NOT_FOUND" || status === "DEBITED_NOT_FOUND") {
    return { kind: "not_found", providerStatus: status, vendorCost: { units: 0, unit: "credit" } };
  }
  if (status === "BAD_INPUT") return errorOutcome("invalid_input", "Icypeas: BAD_INPUT");
  if (status === "INSUFFICIENT_FUNDS") return errorOutcome("no_credit", "Icypeas: INSUFFICIENT_FUNDS");
  if (status === "ABORTED") return { kind: "not_found", providerStatus: status, vendorCost: { units: 0, unit: "credit" }, note: "Search was aborted" };
  return errorOutcome("malformed", `Icypeas: unexpected status ${status}`);
}

export const icypeasAdapter: ProviderAdapter = {
  id: "icypeas",
  name: "Icypeas",
  version: "1.0",
  targets: ["work_email"],
  keyField: "icypeasApiKey",
  paid: true,
  async: true,
  concurrency: 5,
  timeoutMs: 20_000,
  docsUrl: "https://api-doc.icypeas.com/reference/email-search",

  eligible(input: NormalizedInput) {
    return needsNameAndCompany(input, true);
  },

  async run(input, _target, ctx): Promise<AdapterOutcome> {
    const res = await requestJson(`${BASE}/email-search`, {
      method: "POST",
      headers: headers(ctx),
      body: JSON.stringify({
        firstname: input.ownerFirstName ?? "",
        lastname: input.ownerLastName ?? (input.ownerFirstName ? "" : input.ownerName ?? ""),
        domainOrCompany: input.domain || input.businessName,
      }),
      timeoutMs: 20_000,
      fetchImpl: ctx.fetchImpl,
    });
    if (!res.ok) return classifyHttpFailure(res, "Icypeas");
    const json = res.json as { success?: boolean; item?: IcypeasItem; validationErrors?: unknown[] } | null;
    // HTTP 200 can still be a business error: inspect the body.
    if (unparsed(json)) return errorOutcome("malformed", "Icypeas: unexpected response");
    if (!json || json.success !== true) {
      return errorOutcome("invalid_input", `Icypeas: ${json?.validationErrors ? JSON.stringify(json.validationErrors).slice(0, 200) : "request not accepted"}`);
    }
    const id = str(json.item?._id);
    if (!id) return errorOutcome("malformed", "Icypeas: submission returned no id");
    return { kind: "pending", upstreamRequestId: id, retryAfterMs: READ_DELAY_MS };
  },

  async resume(upstreamRequestId, ctx): Promise<AdapterOutcome> {
    const res = await requestJson(`${BASE}/bulk-single-searchs/read`, {
      method: "POST",
      headers: headers(ctx),
      body: JSON.stringify({ id: upstreamRequestId }),
      timeoutMs: 20_000,
      fetchImpl: ctx.fetchImpl,
    });
    if (!res.ok) {
      const out = classifyHttpFailure(res, "Icypeas read");
      // A failed read never means "no match": keep waiting on transient errors.
      if (out.kind === "error" && (out.code === "timeout" || out.code === "upstream")) {
        return { kind: "pending", upstreamRequestId, retryAfterMs: READ_DELAY_MS * 2 };
      }
      return out;
    }
    const json = res.json as { success?: boolean; items?: IcypeasItem[] } | null;
    const item = json?.items?.[0];
    if (!json?.success || !item) return errorOutcome("malformed", "Icypeas read: no item");
    return itemOutcome({ ...item, _id: item._id ?? upstreamRequestId });
  },
};
