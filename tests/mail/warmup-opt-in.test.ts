import { describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { warmupSettings: { upsert: (...a: unknown[]) => upsert(...a) } } }));
vi.mock("@/lib/mail-gateway", () => ({ sendEmailViaHostingerRelay: vi.fn() }));

import { runMailboxWarmupCycle } from "@/lib/warmup-engine";

describe("warmup is opt-in", () => {
  it("does not warm a mailbox nobody started warmup for", async () => {
    upsert.mockResolvedValue({ enabled: true, warmupOptInAt: null, weekdaysOnly: false });
    const r = await runMailboxWarmupCycle("a@example.com");
    expect(r.dispatched).toBe(false);
    expect(r.error).toMatch(/off/);
  });

  it("creates new settings rows with warmup off", async () => {
    upsert.mockResolvedValue({ enabled: false, warmupOptInAt: null, weekdaysOnly: false });
    await runMailboxWarmupCycle("b@example.com");
    expect(upsert.mock.calls.at(-1)?.[0].create.enabled).toBe(false);
  });
});
