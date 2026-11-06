import { describe, expect, it } from "vitest";
import { apolloAdapter } from "@/lib/enrichment/adapters/apollo";
import { findymailAdapter } from "@/lib/enrichment/adapters/findymail";
import { hunterAdapter } from "@/lib/enrichment/adapters/hunter";
import { icypeasAdapter } from "@/lib/enrichment/adapters/icypeas";
import { leadmagicAdapter } from "@/lib/enrichment/adapters/leadmagic";
import { prospeoAdapter } from "@/lib/enrichment/adapters/prospeo";
import type { AdapterOutcome, ProviderAdapter } from "@/lib/enrichment/types";
import { ctx, input, mockFetch, type Scripted } from "./fixtures";

async function run(adapter: ProviderAdapter, script: Scripted[], target: "work_email" | "owner" | "mobile" = "work_email", revealMobile = false) {
  const f = mockFetch(script);
  const out = await adapter.run(input(), target, ctx(f.impl, revealMobile));
  return { out, calls: f.calls };
}

function expectError(out: AdapterOutcome, code: string, unknown?: boolean) {
  expect(out.kind).toBe("error");
  if (out.kind !== "error") return;
  expect(out.code).toBe(code);
  if (unknown !== undefined) expect(Boolean(out.outcomeUnknown)).toBe(unknown);
  expect(out.message).not.toContain("test-key-123");
}

/** Shared failure fixtures every synchronous adapter must classify the same way. */
const COMMON: Array<[string, Scripted, string, boolean?]> = [
  ["auth", { status: 401, body: { error: "Unauthorized" } }, "auth"],
  ["timeout", { throw: "timeout" }, "timeout", true],
  ["network", { throw: "network" }, "upstream", true],
  ["5xx", { status: 503, body: "Service Unavailable" }, "upstream", true],
  ["429", { status: 429, body: {}, headers: { "Retry-After": "7" } }, "rate_limited"],
];

describe.each([
  ["findymail", findymailAdapter],
  ["leadmagic", leadmagicAdapter],
  ["hunter", hunterAdapter],
  ["apollo", apolloAdapter],
])("%s common failures", (_name, adapter) => {
  it.each(COMMON)("%s", async (_label, step, code, unknown) => {
    const { out } = await run(adapter, [step]);
    expectError(out, code, unknown);
    if (code === "rate_limited" && out.kind === "error") expect(out.retryAfterMs).toBe(7000);
  });
});

describe("Findymail", () => {
  it("found: Bearer auth, name + domain, unverified email goes to our verifier", async () => {
    const { out, calls } = await run(findymailAdapter, [
      { status: 200, body: { contact: { name: "John Smith", domain: "acmeroofing.com", email: "john@acmeroofing.com" } } },
    ]);
    expect(calls[0].url).toBe("https://app.findymail.com/api/search/name");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer test-key-123");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ name: "John Smith", domain: "acmeroofing.com" });
    expect(out.kind).toBe("found");
    if (out.kind === "found") {
      expect(out.fields.email?.value).toBe("john@acmeroofing.com");
      expect(out.fields.email?.providerVerified).toBe(false);
      expect(out.vendorCost.units).toBe(1);
    }
  });
  it("no match is free", async () => {
    const { out } = await run(findymailAdapter, [{ status: 200, body: { contact: null } }]);
    expect(out).toMatchObject({ kind: "not_found", vendorCost: { units: 0 } });
  });
  it("402 out of credits and 423 paused are no_credit", async () => {
    expectError((await run(findymailAdapter, [{ status: 402, body: { error: "Not enough credits" } }])).out, "no_credit");
    expectError((await run(findymailAdapter, [{ status: 423, body: { error: "Subscription is paused" } }])).out, "no_credit");
  });
  it("429 retry_after in the body", async () => {
    const { out } = await run(findymailAdapter, [{ status: 429, body: { retry_after: 12 } }]);
    expectError(out, "rate_limited");
    if (out.kind === "error") expect(out.retryAfterMs).toBe(12_000);
  });
  it("422 invalid input", async () => {
    expectError((await run(findymailAdapter, [{ status: 422, body: { message: "The name field is required." } }])).out, "invalid_input");
  });
  it("malformed body", async () => {
    expectError((await run(findymailAdapter, [{ status: 200, body: "<html>" }])).out, "malformed");
  });
  it("needs a person name", () => {
    expect(findymailAdapter.eligible(input({ ownerName: null, ownerFirstName: null, ownerLastName: null }), "work_email").ok).toBe(false);
  });
});

describe("LeadMagic", () => {
  it("found: X-API-Key, valid status is provider-verified", async () => {
    const { out, calls } = await run(leadmagicAdapter, [
      { status: 200, body: { email: "john@acmeroofing.com", status: "valid", credits_consumed: 1, employment_verified: true } },
    ]);
    expect((calls[0].init.headers as Record<string, string>)["X-API-Key"]).toBe("test-key-123");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ first_name: "John", last_name: "Smith", domain: "acmeroofing.com" });
    expect(out).toMatchObject({ kind: "found", vendorCost: { units: 1 } });
    if (out.kind === "found") {
      expect(out.fields.email?.providerVerified).toBe(true);
      expect(out.fields.matchEvidence).toContain("employment verified");
    }
  });
  it("status null is a free not_found", async () => {
    const { out } = await run(leadmagicAdapter, [{ status: 200, body: { email: null, status: null, credits_consumed: 0 } }]);
    expect(out).toMatchObject({ kind: "not_found", vendorCost: { units: 0 } });
  });
  it("domain mismatch is not returned", async () => {
    const { out } = await run(leadmagicAdapter, [
      { status: 200, body: { email: null, status: null, credits_consumed: 0, domain_mismatch: true } },
    ]);
    expect(out.kind).toBe("not_found");
    if (out.kind === "not_found") expect(out.note).toContain("unrelated domain");
  });
  it("402 no credit, 400 invalid input", async () => {
    expectError((await run(leadmagicAdapter, [{ status: 402, body: { message: "Insufficient credits" } }])).out, "no_credit");
    expectError((await run(leadmagicAdapter, [{ status: 400, body: { message: "bad" } }])).out, "invalid_input");
  });
});

describe("Icypeas (async)", () => {
  it("submit returns pending with the item id, raw Authorization key", async () => {
    const { out, calls } = await run(icypeasAdapter, [{ status: 200, body: { success: true, item: { _id: "abc123", status: "NONE" } } }]);
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("test-key-123");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ firstname: "John", lastname: "Smith", domainOrCompany: "acmeroofing.com" });
    expect(out).toMatchObject({ kind: "pending", upstreamRequestId: "abc123" });
  });
  it("HTTP 200 with success:false is invalid input", async () => {
    const { out } = await run(icypeasAdapter, [{ status: 200, body: { success: false, validationErrors: [{ field: "firstname" }] } }]);
    expectError(out, "invalid_input");
  });
  it("submit without an id is malformed", async () => {
    expectError((await run(icypeasAdapter, [{ status: 200, body: { success: true, item: {} } }])).out, "malformed");
  });
  const resume = async (script: Scripted[]) => {
    const f = mockFetch(script);
    return { out: await icypeasAdapter.resume!("abc123", ctx(f.impl)), calls: f.calls };
  };
  it("still running stays pending", async () => {
    for (const status of ["NONE", "SCHEDULED", "IN_PROGRESS"]) {
      const { out, calls } = await resume([{ status: 200, body: { success: true, items: [{ _id: "abc123", status }] } }]);
      expect(out.kind).toBe("pending");
      expect(calls[0].url).toBe("https://app.icypeas.com/api/bulk-single-searchs/read");
      expect(JSON.parse(String(calls[0].init.body))).toEqual({ id: "abc123" });
    }
  });
  it("FOUND with ultra_sure is provider-verified; probable is not", async () => {
    const a = await resume([{ status: 200, body: { success: true, items: [{ status: "FOUND", results: { emails: [{ email: "john@acmeroofing.com", certainty: "ultra_sure" }] } }] } }]);
    expect(a.out.kind === "found" && a.out.fields.email?.providerVerified).toBe(true);
    const b = await resume([{ status: 200, body: { success: true, items: [{ status: "DEBITED", results: { emails: [{ email: "john@acmeroofing.com", certainty: "probable" }] } }] } }]);
    expect(b.out.kind === "found" && b.out.fields.email?.providerVerified).toBe(false);
  });
  it("NOT_FOUND, BAD_INPUT, INSUFFICIENT_FUNDS", async () => {
    expect((await resume([{ status: 200, body: { success: true, items: [{ status: "NOT_FOUND" }] } }])).out.kind).toBe("not_found");
    expectError((await resume([{ status: 200, body: { success: true, items: [{ status: "BAD_INPUT" }] } }])).out, "invalid_input");
    expectError((await resume([{ status: 200, body: { success: true, items: [{ status: "INSUFFICIENT_FUNDS" }] } }])).out, "no_credit");
  });
  it("a failed read keeps waiting instead of reporting no match", async () => {
    expect((await resume([{ throw: "timeout" }])).out.kind).toBe("pending");
    expect((await resume([{ status: 502, body: "bad gateway" }])).out.kind).toBe("pending");
  });
  it("401 on read is auth", async () => {
    expectError((await resume([{ status: 401, body: { message: "bad key" } }])).out, "auth");
  });
});

describe("Hunter", () => {
  it("key in header, never in the URL; maps accept_all as catch-all", async () => {
    const { out, calls } = await run(hunterAdapter, [
      {
        status: 200,
        headers: { "X-Credits-Used": "1" },
        body: { data: { email: "john@acmeroofing.com", score: 91, accept_all: true, provenance: "pattern", sources: [{ uri: "https://acmeroofing.com/team" }], verification: { status: "accept_all" } } },
      },
    ]);
    expect(calls[0].url).not.toContain("test-key-123");
    expect((calls[0].init.headers as Record<string, string>)["X-API-KEY"]).toBe("test-key-123");
    expect(out.kind).toBe("found");
    if (out.kind === "found") {
      expect(out.fields.email).toMatchObject({ catchAll: true, providerVerified: false, sourceUrl: "https://acmeroofing.com/team" });
      expect(out.vendorCost.units).toBe(1);
    }
  });
  it("no email found is a not_found", async () => {
    const { out } = await run(hunterAdapter, [{ status: 200, body: { data: { email: null } } }]);
    expect(out.kind).toBe("not_found");
  });
  it("owner via domain search only accepts an owner-type title", async () => {
    const f = mockFetch([
      { status: 200, body: { data: { emails: [{ value: "info@acmeroofing.com", position: "Office manager", first_name: "Amy", last_name: "Lee" }, { value: "john@acmeroofing.com", position: "Owner", first_name: "John", last_name: "Smith", verification: { status: "valid" } }] } } },
    ]);
    const out = await hunterAdapter.run(input({ ownerName: null, ownerFirstName: null, ownerLastName: null }), "owner", ctx(f.impl));
    expect(out.kind === "found" && out.fields.ownerName).toBe("John Smith");
  });
  it("malformed", async () => {
    expectError((await run(hunterAdapter, [{ status: 200, body: { nope: true } }])).out, "malformed");
  });
});

describe("Apollo", () => {
  it("work email: x-api-key header, verified email_status", async () => {
    const { out, calls } = await run(apolloAdapter, [
      { status: 200, body: { person: { id: "p1", name: "John Smith", title: "Owner", email: "john@acmeroofing.com", email_status: "verified" } } },
    ]);
    expect(calls[0].url).toBe("https://api.apollo.io/api/v1/people/match");
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.reveal_personal_emails).toBeUndefined();
    expect(out.kind === "found" && out.fields.email?.providerVerified).toBe(true);
  });
  it("locked placeholder email is not a result", async () => {
    const { out } = await run(apolloAdapter, [{ status: 200, body: { person: { id: "p1", name: "John Smith", email: "email_not_unlocked@domain.com" } } }]);
    expect(out.kind).toBe("not_found");
  });
  it("owner: free search then match by id", async () => {
    const f = mockFetch([
      { status: 200, body: { people: [{ id: "p9", first_name: "John", last_name_obfuscated: "Sm***h" }] } },
      { status: 200, body: { person: { id: "p9", name: "John Smith", title: "Owner" } } },
    ]);
    const out = await apolloAdapter.run(input({ ownerName: null, ownerFirstName: null, ownerLastName: null }), "owner", ctx(f.impl));
    expect(f.calls.map((c) => c.url)).toEqual([
      "https://api.apollo.io/api/v1/mixed_people/api_search",
      "https://api.apollo.io/api/v1/people/match",
    ]);
    expect(JSON.parse(String(f.calls[1].init.body))).toEqual({ id: "p9" });
    expect(out.kind === "found" && out.fields.ownerName).toBe("John Smith");
  });
  it("no person is not_found", async () => {
    expect((await run(apolloAdapter, [{ status: 200, body: { person: null } }])).out.kind).toBe("not_found");
  });
});

describe("Prospeo", () => {
  it("email lookup never asks for a mobile", async () => {
    const { out, calls } = await run(prospeoAdapter, [
      { status: 200, body: { error: false, free_enrichment: false, person: { person_id: "x1", full_name: "John Smith", email: { status: "VERIFIED", revealed: true, email: "john@acmeroofing.com" } } } },
    ]);
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.enrich_mobile).toBe(false);
    expect(body.only_verified_email).toBe(true);
    expect(out).toMatchObject({ kind: "found", vendorCost: { units: 1 } });
  });
  it("mobile only when the job opted in", async () => {
    const off = await run(prospeoAdapter, [{ status: 200, body: {} }], "mobile", false);
    expectError(off.out, "invalid_input");
    expect(off.calls.length).toBe(0);
    const on = await run(prospeoAdapter, [
      { status: 200, body: { error: false, person: { mobile: { status: "VERIFIED", revealed: true, mobile_international: "+15125550100" } } } },
    ], "mobile", true);
    expect(JSON.parse(String(on.calls[0].init.body)).enrich_mobile).toBe(true);
    expect(on.out).toMatchObject({ kind: "found", vendorCost: { units: 10 } });
  });
  it("masked values are rejected", async () => {
    const { out } = await run(prospeoAdapter, [
      { status: 200, body: { error: false, person: { email: { status: "VERIFIED", revealed: true, email: "j***@acmeroofing.com" } } } },
    ]);
    expect(out.kind).toBe("not_found");
  });
  it("error codes are surfaced, not treated as no match", async () => {
    expect((await run(prospeoAdapter, [{ status: 400, body: { error: true, error_code: "NO_MATCH" } }])).out.kind).toBe("not_found");
    expectError((await run(prospeoAdapter, [{ status: 400, body: { error: true, error_code: "INSUFFICIENT_CREDITS" } }])).out, "no_credit");
    expectError((await run(prospeoAdapter, [{ status: 401, body: { error: true, error_code: "INVALID_API_KEY" } }])).out, "auth");
    expectError((await run(prospeoAdapter, [{ status: 400, body: { error: true, error_code: "INVALID_DATAPOINTS" } }])).out, "invalid_input");
    expectError((await run(prospeoAdapter, [{ throw: "timeout" }])).out, "timeout", true);
  });
});

describe("non-JSON bodies are malformed, never 'no match'", () => {
  it.each([
    ["findymail", findymailAdapter],
    ["leadmagic", leadmagicAdapter],
    ["apollo", apolloAdapter],
    ["prospeo", prospeoAdapter],
    ["icypeas", icypeasAdapter],
  ])("%s", async (_n, adapter) => {
    expectError((await run(adapter, [{ status: 200, body: "<html>oops</html>" }])).out, "malformed");
  });
});
