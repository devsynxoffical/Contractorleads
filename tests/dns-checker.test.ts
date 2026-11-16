import { beforeEach, describe, expect, it, vi } from "vitest";

const txt = new Map<string, string[][]>();
const cname = new Map<string, string[]>();
const notFound = () => Object.assign(new Error("not found"), { code: "ENOTFOUND" });

vi.mock("node:dns", () => ({
  promises: {
    resolveTxt: vi.fn(async (h: string) => {
      if (txt.has(h)) return txt.get(h);
      throw notFound();
    }),
    resolveCname: vi.fn(async (h: string) => {
      if (cname.has(h)) return cname.get(h);
      throw notFound();
    }),
  },
}));

const { checkDkim, getDnsFixInstructions } = await import("@/lib/dns-checker");
const KEY = "v=DKIM1; k=rsa; p=" + "A".repeat(392);

beforeEach(() => {
  txt.clear();
  cname.clear();
});

describe("checkDkim", () => {
  it("finds GoDaddy keys on secureserver1/2", async () => {
    txt.set("secureserver2._domainkey.frankmillerconnects.com", [[KEY]]);
    const r = await checkDkim("frankmillerconnects.com");
    expect(r.status).toBe("pass");
    expect(r.selector).toBe("secureserver2");
  });

  it("still finds Hostinger keys", async () => {
    txt.set("hostingermail-a._domainkey.example.com", [[KEY]]);
    const r = await checkDkim("example.com");
    expect(r.status).toBe("pass");
    expect(r.selector).toBe("hostingermail-a");
  });

  it("reports a CNAME whose target has no key yet as pending, not missing", async () => {
    cname.set("secureserver1._domainkey.frankmillerconnect.com", ["s1.dkim.frankmillerconnect_com.ed0.onsecureserver.net"]);
    const r = await checkDkim("frankmillerconnect.com");
    expect(r.status).toBe("warn");
    expect(r.selector).toBe("secureserver1");
    expect(r.reason).toMatch(/does not publish a key yet/);
  });

  it("warns when no selector has anything", async () => {
    const r = await checkDkim("nothing.example");
    expect(r.status).toBe("warn");
    expect(r.record).toBeNull();
  });
});

it("GoDaddy fix instructions use secureserver selectors", () => {
  expect(getDnsFixInstructions("x.com", "godaddy").dkimHost).toBe("secureserver1._domainkey");
});
