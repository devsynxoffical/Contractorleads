import { beforeEach, describe, expect, it, vi } from "vitest";

const connect = vi.fn();
const logout = vi.fn().mockResolvedValue(undefined);
const close = vi.fn();
vi.mock("imapflow", () => ({
  ImapFlow: vi.fn().mockImplementation(() => ({
    connect,
    logout,
    close,
    usable: false, // never logged in: every test here fails at connect
    on: vi.fn(),
    getMailboxLock: vi.fn(),
  })),
}));
const relayFetch = vi.fn();
vi.mock("@/lib/relay-fetch", () => ({ relayFetch: (...a: unknown[]) => relayFetch(...a) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/lead-email", () => ({ ingestInboundEmail: vi.fn() }));
vi.mock("@/lib/user-smtp", () => ({ HOSTINGER_RELAY_SECRET: "x", relayEndpoints: () => ["https://relay.test/mailer.php"] }));

import { syncMailboxImap } from "@/lib/inbox-sync";

describe("inbox sync login guards", () => {
  beforeEach(() => {
    connect.mockReset();
    relayFetch.mockReset();
    logout.mockClear();
    close.mockClear();
  });

  it("does not retry a refused login through the relay, and pauses the mailbox", async () => {
    connect.mockRejectedValue(Object.assign(new Error("Command failed"), { authenticationFailed: true }));
    const first = await syncMailboxImap({ userId: "u", email: "a@frankmillerconnect.com", pass: "p", provider: "godaddy" });
    expect(first.error).toMatch(/Direct IMAP/);
    expect(relayFetch).not.toHaveBeenCalled();

    const second = await syncMailboxImap({ userId: "u", email: "a@frankmillerconnect.com", pass: "p", provider: "godaddy" });
    expect(second.skipped).toMatch(/paused/);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("closes a refused login without sending LOGOUT (avoids imapflow's unhandled 'Connection not available')", async () => {
    connect.mockRejectedValue(Object.assign(new Error("Command failed"), { authenticationFailed: true }));
    await syncMailboxImap({ userId: "u", email: "d@frankmillerhub.com", pass: "p", provider: "godaddy" });
    await new Promise((r) => setTimeout(r, 0));
    expect(logout).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("contacts a GoDaddy mailbox at most once per interval in background runs", async () => {
    connect.mockRejectedValue(new Error("connect ETIMEDOUT"));
    relayFetch.mockResolvedValue({ json: async () => ({ ok: true, total: 0, messages: [] }) });
    const guard = { minGoDaddyIntervalMs: 15 * 60 * 1000 };
    await syncMailboxImap({ userId: "u", email: "b@frankmillerconnect.com", pass: "p", provider: "godaddy" }, guard);
    const again = await syncMailboxImap({ userId: "u", email: "b@frankmillerconnect.com", pass: "p", provider: "godaddy" }, guard);
    expect(again.skipped).toMatch(/recently/);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it("still falls back to the relay when the IMAP port is unreachable", async () => {
    connect.mockRejectedValue(new Error("connect ETIMEDOUT"));
    relayFetch.mockResolvedValue({ json: async () => ({ ok: true, total: 0, messages: [] }) });
    const r = await syncMailboxImap({ userId: "u", email: "c@hostinger-domain.com", pass: "p", provider: "hostinger" });
    expect(relayFetch).toHaveBeenCalledTimes(1);
    expect(r.error).toBeUndefined();
  });
});
