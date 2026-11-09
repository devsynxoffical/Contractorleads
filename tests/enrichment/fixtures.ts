import type { NormalizedInput } from "@/lib/enrichment/types";

/** A scripted fetch: each call takes the next response (or throws). Records every request. */
export type Scripted =
  | { status: number; body?: unknown; headers?: Record<string, string> }
  | { throw: "timeout" | "network" };

export function mockFetch(script: Scripted[]) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const impl = (async (url: string | URL, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    const step = script[Math.min(i++, script.length - 1)];
    if ("throw" in step) {
      const err = new Error(step.throw);
      err.name = step.throw === "timeout" ? "TimeoutError" : "TypeError";
      throw err;
    }
    const text = step.body === undefined ? "" : typeof step.body === "string" ? step.body : JSON.stringify(step.body);
    return new Response(text, { status: step.status, headers: step.headers });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

export function input(over: Partial<NormalizedInput> = {}): NormalizedInput {
  return {
    businessName: "Acme Roofing",
    domain: "acmeroofing.com",
    website: "https://acmeroofing.com",
    ownerName: "John Smith",
    ownerFirstName: "John",
    ownerLastName: "Smith",
    ownerTitle: null,
    email: null,
    phone: null,
    city: "Austin",
    state: "TX",
    country: "US",
    linkedinUrl: null,
    ...over,
  };
}

export const ctx = (fetchImpl: typeof fetch, revealMobile = false) => ({ apiKey: "test-key-123", revealMobile, fetchImpl });
