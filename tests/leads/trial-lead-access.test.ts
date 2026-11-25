import { describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { leadUnlock: { findMany: (...a: unknown[]) => findMany(...a) } } }));

import { hidesUnpaidContacts, redactLead, redactUnpaidLeads } from "@/lib/lead-access";

const lead = (id: string) => ({
  id,
  businessName: `Biz ${id}`,
  email: `${id}@example.com`,
  phone: "555-0100",
  decisionMakerName: "Pat Owner",
  decisionMakerEmail: `pat@${id}.com`,
  decisionMakerDirectPhone: "555-0199",
});

describe("trial lead access", () => {
  it("only trial accounts hide unpaid contacts", () => {
    expect(hidesUnpaidContacts("trialing")).toBe(true);
    expect(hidesUnpaidContacts(undefined)).toBe(true);
    expect(hidesUnpaidContacts("active")).toBe(false);
    expect(hidesUnpaidContacts("past_due")).toBe(false);
    expect(hidesUnpaidContacts("canceled")).toBe(false);
  });

  it("redacts decision-maker contacts as well as business contacts", () => {
    const r = redactLead(lead("a"), false);
    expect(r.unlocked).toBe(false);
    expect(r.email).toBeNull();
    expect(r.phone).toBeNull();
    expect(r.decisionMakerName).toBeNull();
    expect(r.decisionMakerEmail).toBeNull();
    expect(r.decisionMakerDirectPhone).toBeNull();
    expect(r.businessName).toBe("Biz a");
  });

  it("a trial user sees contacts only on leads they paid for", async () => {
    findMany.mockResolvedValueOnce([{ leadId: "paid" }]);
    const out = await redactUnpaidLeads({ id: "u1", subscriptionStatus: "trialing" }, [lead("paid"), lead("free")]);
    expect(out.find((l) => l.id === "paid")?.email).toBe("paid@example.com");
    expect(out.find((l) => l.id === "free")?.email).toBeNull();
    expect(out.find((l) => l.id === "free")?.decisionMakerEmail).toBeNull();
  });

  it("a paying user keeps every lead visible", async () => {
    findMany.mockClear();
    const out = await redactUnpaidLeads({ id: "u2", subscriptionStatus: "active" }, [lead("x")]);
    expect(out[0].email).toBe("x@example.com");
    expect(findMany).not.toHaveBeenCalled();
  });
});
