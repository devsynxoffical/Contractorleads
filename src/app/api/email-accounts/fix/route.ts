import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isGlobalSuperAdmin } from "@/lib/roles";
import { decryptSecret, encryptSecret } from "@/lib/crypto-secret";
import { systemRowToPayload } from "@/lib/system-smtp";
import { relayPortCheck, saveAccountToHostingerRelay, testAccountViaHostingerRelay } from "@/lib/mail-gateway";
import {
  clearMailboxFailure,
  diagnoseMailboxError,
  publicMailError,
  recordMailboxSendResult,
} from "@/lib/mailbox-send-status";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Diagnose and repair a mailbox from the Email Accounts page.
 *
 * POST /api/email-accounts/fix
 *   { mailboxId, action: "diagnose" }                   -> current problem + fix steps
 *   { mailboxId, action: "retest" }                     -> test the saved login through the relay
 *   { mailboxId, action: "update", password?, host?, port?, username?, saveWithoutTest? }
 *        -> test the new details, save them only if the test passes
 *           (saveWithoutTest saves anyway, for when the relay itself is down)
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const mailboxId = String(body.mailboxId || "");
  const action = String(body.action || "diagnose");
  if (!mailboxId) return NextResponse.json({ error: "mailboxId is required" }, { status: 400 });

  const isSuper = isGlobalSuperAdmin(user);
  const [system, own] = await Promise.all([
    prisma.systemSmtpAccount.findFirst({
      where: { id: mailboxId, ...(isSuper ? {} : { assignedUserId: user.id }) },
    }),
    prisma.smtpAccount.findFirst({ where: { id: mailboxId, userId: user.id } }),
  ]);
  if (!system && !own) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });

  const email = (system?.fromEmail || own!.fromEmail).toLowerCase();
  const settings = await prisma.warmupSettings.findUnique({ where: { mailboxEmail: email } });

  // Current saved login (password never leaves the server).
  const current = system
    ? systemRowToPayload(system)
    : {
        host: own!.host,
        port: own!.port,
        username: own!.username || own!.fromEmail,
        password: (() => {
          try {
            return own!.passwordEnc ? decryptSecret(own!.passwordEnc) : "";
          } catch {
            return "";
          }
        })(),
      };

  const describe = (rawError: string | null) => ({
    mailbox: {
      id: mailboxId,
      email,
      type: system ? "system" : "user",
      host: current.host,
      port: current.port,
      username: current.username,
      hasPassword: Boolean(current.password),
      deliveryMode: own?.deliveryMode ?? "smtp",
    },
    lastError: settings?.lastSendErrorAt ? publicMailError(settings.lastSendErrorRaw || settings.lastSendError) : null,
    lastErrorAt: settings?.lastSendErrorAt?.toISOString() ?? null,
    diagnosis: rawError ? diagnoseMailboxError(rawError, { admin: isSuper }) : null,
    // Gateway URLs and raw server replies are for platform admins only.
    technicalDetail: isSuper ? rawError : null,
    viewerIsAdmin: isSuper,
  });
  /** What a user may see of a raw relay / SMTP error. */
  const shown = (raw: string | null | undefined) => (isSuper ? raw || "" : publicMailError(raw));

  if (action === "port_check") {
    if (!isSuper) return NextResponse.json({ error: "Only platform admins can run this check" }, { status: 403 });
    const check = await relayPortCheck(current.host);
    return NextResponse.json({ ok: check.ok, host: current.host, results: check.results ?? [], error: check.ok ? undefined : check.error });
  }

  if (action === "diagnose") {
    return NextResponse.json({ ok: true, ...describe(settings?.lastSendErrorRaw || settings?.lastSendError || null) });
  }

  if (own && (own.deliveryMode === "platform" || own.deliveryMode === "resend")) {
    return NextResponse.json(
      {
        ok: false,
        error: "This sender delivers through Resend, not SMTP. Fix it under Setup → Email (verify the domain in Resend or switch it to SMTP).",
      },
      { status: 400 },
    );
  }

  if (action === "retest") {
    const test = await testAccountViaHostingerRelay({
      fromEmail: email,
      password: current.password,
      host: current.host,
      port: current.port,
    });
    if (test.ok) {
      // Remember the port that actually worked (the gateway may have used a fallback).
      if (test.port && test.port !== current.port) {
        if (system) await prisma.systemSmtpAccount.update({ where: { id: system.id }, data: { port: test.port } });
        else await prisma.smtpAccount.update({ where: { id: own!.id }, data: { port: test.port } });
      }
      await clearMailboxFailure(email);
      return NextResponse.json({ ok: true, message: "Login works. The mailbox can send again.", ...describe(null) });
    }
    await recordMailboxSendResult(email, false, test.error);
    return NextResponse.json({ ok: false, error: shown(test.error), ...describe(test.error || "") }, { status: 200 });
  }

  if (action === "update") {
    const password = typeof body.password === "string" && body.password.length > 0 ? body.password : current.password;
    const host = (typeof body.host === "string" && body.host.trim()) || current.host;
    const portNum = Number(body.port);
    const requestedPort = Number.isFinite(portNum) && portNum > 0 ? Math.round(portNum) : current.port;
    const username = (typeof body.username === "string" && body.username.trim()) || current.username || email;
    if (!password) return NextResponse.json({ error: "Enter the mailbox password" }, { status: 400 });
    if (![465, 587, 3535, 80].includes(requestedPort)) {
      return NextResponse.json({ error: "Port must be 465 (SSL), 587, 3535 or 80 (STARTTLS)" }, { status: 400 });
    }

    const saveWithoutTest = body.saveWithoutTest === true;
    let testError: string | null = null;
    let port = requestedPort;
    if (!saveWithoutTest) {
      const test = await testAccountViaHostingerRelay({ fromEmail: email, password, host, port: requestedPort });
      if (!test.ok) testError = test.error || "Test failed";
      else if (test.port) port = test.port;
    }
    if (testError) {
      // Nothing is saved when the new details do not work.
      return NextResponse.json({ ok: false, saved: false, error: shown(testError), ...describe(testError) });
    }

    const passwordEnc = encryptSecret(password);
    if (system) {
      await prisma.systemSmtpAccount.update({
        where: { id: system.id },
        data: { passwordEnc, host, port, secure: port !== 587, username, passwordUpdatedByUserAt: new Date(), lastTestedAt: saveWithoutTest ? undefined : new Date() },
      });
    } else {
      await prisma.smtpAccount.update({
        where: { id: own!.id },
        data: { passwordEnc, host, port, secure: port !== 587, username, lastTestedAt: saveWithoutTest ? undefined : new Date() },
      });
    }
    // Keep the relay's stored copy in sync (used when the app sends without a password).
    await saveAccountToHostingerRelay({ fromEmail: email, password, host, port, provider: system?.provider }).catch(() => null);
    if (!saveWithoutTest) await clearMailboxFailure(email);

    return NextResponse.json({
      ok: true,
      saved: true,
      message: saveWithoutTest
        ? "Saved without testing. It will be checked on the next send."
        : "Tested and saved. The mailbox can send again.",
      ...describe(null),
    });
  }

  return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
}
