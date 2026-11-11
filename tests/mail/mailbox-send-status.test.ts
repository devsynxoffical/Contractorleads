import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    warmupSettings: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    mailboxDailyStat: { upsert: vi.fn() },
    systemSmtpAccount: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  diagnoseMailboxError,
  isRecentlyRestricted,
  isMailboxCoolingDown,
  isTemporaryLoginRefusal,
  recordMailboxSendResult,
} from "@/lib/mailbox-send-status";

const relayErr = (inner: string) =>
  `https://relay.example/mailer.php error: Authenticated SMTP delivery failed on smtpout.secureserver.net (${inner}). Refused unauthenticated mail() fallback`;

describe("isTemporaryLoginRefusal", () => {
  it("treats an empty AUTH reply as temporary", () => {
    expect(isTemporaryLoginRefusal(relayErr("Auth failed on smtpout.secureserver.net:465: "))).toBe(true);
  });
  it("treats a 4xx AUTH reply as temporary", () => {
    expect(isTemporaryLoginRefusal(relayErr("Auth failed on smtpout.secureserver.net:465: 421 Too many connections, try later"))).toBe(true);
    expect(isTemporaryLoginRefusal(relayErr("Auth failed on smtpout.secureserver.net:465: 454 4.7.0 Temporary authentication failure"))).toBe(true);
  });
  it("keeps a 535 as a real login rejection", () => {
    expect(isTemporaryLoginRefusal(relayErr("Auth failed on smtpout.secureserver.net:465: 535 Authentication Failed"))).toBe(false);
  });
});

describe("diagnoseMailboxError", () => {
  it("does not call a GoDaddy throttle a wrong password", () => {
    const d = diagnoseMailboxError(relayErr("Auth failed on smtpout.secureserver.net:465: 421 4.7.0 too many connections"));
    expect(d.problem).toBe("provider_throttled");
    expect(d.title).toMatch(/GoDaddy/);
    expect(d.canUpdatePassword).toBe(false);
  });
  it("still reports a real 535 as a wrong password", () => {
    expect(diagnoseMailboxError(relayErr("Auth failed on smtpout.secureserver.net:465: 535 Authentication Failed")).problem).toBe("wrong_password");
  });
});

describe("recordMailboxSendResult", () => {
  const find = prisma.warmupSettings.findUnique as unknown as ReturnType<typeof vi.fn>;
  const update = prisma.warmupSettings.update as unknown as ReturnType<typeof vi.fn>;

  it("does not mark the mailbox broken on a temporary refusal, and pauses it", async () => {
    update.mockClear();
    await recordMailboxSendResult("a@frankmillerconnect.com", false, relayErr("Auth failed on smtpout.secureserver.net:465: "));
    expect(update).not.toHaveBeenCalled();
    expect(isMailboxCoolingDown("a@frankmillerconnect.com")).toBe(true);
  });

  it("treats a 535 right after a success as temporary, then marks it after repeated failures", async () => {
    update.mockClear();
    const okAt = new Date(Date.now() - 10 * 60 * 1000);
    find.mockResolvedValue({ lastSendOkAt: okAt, lastSendErrorAt: null });
    const err = relayErr("Auth failed on smtpout.secureserver.net:465: 535 Authentication Failed");
    for (let i = 0; i < 3; i++) await recordMailboxSendResult("b@frankmillerconnect.com", false, err);
    expect(update).not.toHaveBeenCalled();
    await recordMailboxSendResult("b@frankmillerconnect.com", false, err);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("marks a 535 at once when the password has not worked recently", async () => {
    update.mockClear();
    find.mockResolvedValue({ lastSendOkAt: null, lastSendErrorAt: null });
    await recordMailboxSendResult("c@frankmillerconnect.com", false, relayErr("Auth failed on smtpout.secureserver.net:465: 535 Authentication Failed"));
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("clears the pause after a successful send", async () => {
    find.mockResolvedValue({ lastSendOkAt: new Date(), lastSendErrorAt: null });
    await recordMailboxSendResult("a@frankmillerconnect.com", true);
    expect(isMailboxCoolingDown("a@frankmillerconnect.com")).toBe(false);
  });
});

// Real errors from the production log (11 Nov 2026).
const GODADDY_RESTRICTED =
  'https://roofingclients.us/mailer.php returned status 500 ({"ok":false,"error":"Authenticated SMTP delivery failed on smtpout.secureserver.net (Delivery failed: 535 R1mLxThQNlPmeR1mPxQJ5r User frank.miller@connectwithbdefrank.com has been restricted.). Refuse)';
const HOSTINGER_BAD_PASSWORD =
  'https://roofingclients.us/mailer.php returned status 500 ({"ok":false,"error":"Authenticated SMTP delivery failed on smtp.hostinger.com (Auth failed on smtp.hostinger.com:465: 535 5.7.8 Authentication failed.). Refused unauthenticated mail() fallback to prot)';

describe("provider restrictions", () => {
  it("reports GoDaddy 'has been restricted' as a sending restriction, not a password problem", () => {
    const d = diagnoseMailboxError(GODADDY_RESTRICTED);
    expect(d.problem).toBe("account_restricted");
    expect(d.title).toMatch(/GoDaddy has restricted sending/);
    expect(d.canUpdatePassword).toBe(false);
  });

  it("still reports a Hostinger 535 5.7.8 as a wrong password", () => {
    expect(diagnoseMailboxError(HOSTINGER_BAD_PASSWORD).problem).toBe("wrong_password");
  });

  it("marks a restricted mailbox at once so campaigns skip it, and pauses warmup", async () => {
    const find = prisma.warmupSettings.findUnique as unknown as ReturnType<typeof vi.fn>;
    const update = prisma.warmupSettings.update as unknown as ReturnType<typeof vi.fn>;
    update.mockClear();
    find.mockResolvedValue({ lastSendOkAt: new Date(), lastSendErrorAt: null, consecutiveSendFailures: 0 });
    await recordMailboxSendResult("r@connectwithbdefrank.com", false, GODADDY_RESTRICTED);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].data.consecutiveSendFailures).toBe(2);
    expect(isMailboxCoolingDown("r@connectwithbdefrank.com")).toBe(true);
  });

  it("treats a recent restriction as active until a real send succeeds or 24 hours pass", () => {
    const at = new Date(Date.now() - 60 * 60 * 1000);
    expect(isRecentlyRestricted({ lastSendErrorAt: at, lastSendErrorRaw: GODADDY_RESTRICTED, lastSendOkAt: null })).toBe(true);
    expect(isRecentlyRestricted({ lastSendErrorAt: at, lastSendErrorRaw: GODADDY_RESTRICTED, lastSendOkAt: new Date() })).toBe(false);
    expect(isRecentlyRestricted({ lastSendErrorAt: new Date(Date.now() - 25 * 3600 * 1000), lastSendErrorRaw: GODADDY_RESTRICTED })).toBe(false);
    expect(isRecentlyRestricted({ lastSendErrorAt: at, lastSendErrorRaw: HOSTINGER_BAD_PASSWORD })).toBe(false);
  });
});
