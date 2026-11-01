"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineWrenchScrewdriver,
  HiOutlineXMark,
} from "react-icons/hi2";

type Diagnosis = {
  problem: string;
  title: string;
  explanation: string;
  steps: string[];
  canUpdatePassword: boolean;
  canEditServer: boolean;
};

type FixInfo = {
  mailbox: {
    id: string;
    email: string;
    type: "system" | "user";
    host: string;
    port: number;
    username: string;
    hasPassword: boolean;
    deliveryMode: string;
  };
  lastError: string | null;
  lastErrorAt: string | null;
  diagnosis: Diagnosis | null;
  /** Only present for platform admins */
  technicalDetail?: string | null;
  viewerIsAdmin?: boolean;
};

const PRESETS = [
  { label: "Hostinger", host: "smtp.hostinger.com", port: 465 },
  { label: "GoDaddy", host: "smtpout.secureserver.net", port: 465 },
];

/**
 * Explains why a mailbox cannot send and lets the user fix it: re-test the saved login,
 * or enter a new password / server, test it through the relay and save it.
 */
export function FixMailboxModal({
  mailboxId,
  mailboxEmail,
  onClose,
  onFixed,
}: {
  mailboxId: string;
  mailboxEmail: string;
  onClose: () => void;
  onFixed: () => Promise<void> | void;
}) {
  const [info, setInfo] = useState<FixInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState(465);
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState<"" | "retest" | "save" | "force">("");
  const [result, setResult] = useState<{ ok: boolean; text: string; detail?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/email-accounts/fix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mailboxId, action: "diagnose" }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.error || "Could not load this mailbox.");
          return;
        }
        setInfo(data);
        setHost(data.mailbox.host || "");
        setPort(data.mailbox.port || 465);
        setUsername(data.mailbox.username || data.mailbox.email);
      })
      .catch(() => !cancelled && setLoadError("Could not load this mailbox."));
    return () => {
      cancelled = true;
    };
  }, [mailboxId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function call(action: "retest" | "update", extra: Record<string, unknown> = {}, kind: "retest" | "save" | "force") {
    setBusy(kind);
    setResult(null);
    try {
      const res = await fetch("/api/email-accounts/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mailboxId, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.mailbox) setInfo((prev) => ({ ...(prev as FixInfo), ...data }));
      if (res.ok && data.ok) {
        setResult({ ok: true, text: data.message || "Done." });
        setPassword("");
        await onFixed();
      } else {
        const d: Diagnosis | undefined = data.diagnosis;
        setResult({
          ok: false,
          text: d ? `${d.title}. ${d.explanation}` : data.error || "That did not work.",
          detail: data.error,
        });
      }
    } catch {
      setResult({ ok: false, text: "Could not reach the server. Check your connection and try again." });
    } finally {
      setBusy("");
    }
  }

  if (typeof document === "undefined") return null;

  const d = info?.diagnosis ?? null;
  // The login form is always available; for relay-wide problems it starts collapsed.
  const relayProblem = d?.problem === "relay_unreachable" || d?.problem === "relay_token";
  const isResend = info?.mailbox.deliveryMode === "platform" || info?.mailbox.deliveryMode === "resend";

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Fix ${mailboxEmail}`}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-[var(--surface)] text-ink shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10">
              <HiOutlineWrenchScrewdriver className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold">Fix mailbox</h2>
              <p className="truncate font-mono text-xs text-ink-muted" title={mailboxEmail}>
                {mailboxEmail}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink-faint hover:bg-brand-50 hover:text-ink" aria-label="Close">
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5 text-sm">
          {loadError ? (
            <p className="text-rose-600">{loadError}</p>
          ) : !info ? (
            <p className="text-ink-muted">Loading…</p>
          ) : (
            <>
              {/* What is wrong */}
              {d ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
                  <p className="font-bold">{d.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed">{d.explanation}</p>
                  {info.lastErrorAt && (
                    <p className="mt-1 text-[11px] opacity-75">Last failure: {new Date(info.lastErrorAt).toLocaleString()}</p>
                  )}
                  <ol className="mt-2.5 list-decimal space-y-1 pl-5 text-[13px]">
                    {d.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  {info.technicalDetail && (
                    <details className="mt-2 text-[11px] opacity-80">
                      <summary className="cursor-pointer">Technical detail (admins only)</summary>
                      <p className="mt-1 break-all font-mono">{info.technicalDetail}</p>
                    </details>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-[var(--surface-muted)] p-3.5 text-[13px] text-ink-muted">
                  No recent sending error for this mailbox. You can still re-test the login or change the password and server here.
                </div>
              )}

              {isResend ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  This sender delivers through Resend, not SMTP. Fix it under Setup → Email: verify the domain in Resend, or switch the sender to SMTP.
                </p>
              ) : (
                <>
                  {/* Option 1: re-test */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
                    <div className="min-w-0">
                      <p className="font-semibold">Re-test the saved login</p>
                      <p className="text-[12px] text-ink-muted">
                        Use this after fixing the password at your email host, or to check again later.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => call("retest", {}, "retest")}
                      disabled={busy !== ""}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-semibold hover:bg-brand-50 disabled:opacity-50"
                    >
                      <HiOutlineArrowPath className={`h-4 w-4 ${busy === "retest" ? "animate-spin" : ""}`} />
                      {busy === "retest" ? "Testing…" : "Re-test"}
                    </button>
                  </div>

                  {/* Option 2: update login */}
                  <details className="group" open={!relayProblem && d?.problem !== "recipient_rejected"}>
                    <summary className="cursor-pointer list-none text-[13px] font-semibold text-brand-600 group-open:hidden">
                      {relayProblem ? "Change password or server anyway" : "Change password or server"}
                    </summary>
                    <form
                      className="space-y-3 rounded-xl border border-border p-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void call("update", { password, host, port, username }, "save");
                      }}
                    >
                      <p className="font-semibold">Update login</p>
                      <label className="block">
                        <span className="text-[12px] font-semibold text-ink-muted">Password</span>
                        <div className="relative mt-1">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={info.mailbox.hasPassword ? "Leave empty to keep the saved password" : "Mailbox password"}
                            autoComplete="new-password"
                            className="saas-input h-10 w-full pr-10 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint hover:text-ink"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <HiOutlineEyeSlash className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                          </button>
                        </div>
                      </label>

                      <details className="group" open={d?.canEditServer && d.problem === "server_unreachable"}>
                        <summary className="cursor-pointer text-[12px] font-semibold text-brand-600">Server settings</summary>
                        <div className="mt-2 space-y-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {PRESETS.map((p) => (
                              <button
                                key={p.label}
                                type="button"
                                onClick={() => {
                                  setHost(p.host);
                                  setPort(p.port);
                                }}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                  host === p.host ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-ink-muted"
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-[1fr_96px] gap-2">
                            <label className="block min-w-0">
                              <span className="text-[12px] font-semibold text-ink-muted">SMTP server</span>
                              <input value={host} onChange={(e) => setHost(e.target.value)} className="saas-input mt-1 h-10 w-full text-sm" />
                            </label>
                            <label className="block">
                              <span className="text-[12px] font-semibold text-ink-muted">Port</span>
                              <select value={port} onChange={(e) => setPort(Number(e.target.value))} className="saas-input mt-1 h-10 w-full text-sm">
                                <option value={465}>465 (SSL)</option>
                                <option value={587}>587 (STARTTLS)</option>
                                <option value={3535}>3535 (GoDaddy alt.)</option>
                              </select>
                            </label>
                          </div>
                          <label className="block">
                            <span className="text-[12px] font-semibold text-ink-muted">Login username</span>
                            <input value={username} onChange={(e) => setUsername(e.target.value)} className="saas-input mt-1 h-10 w-full text-sm" />
                          </label>
                        </div>
                      </details>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        {relayProblem && (
                          <button
                            type="button"
                            disabled={busy !== "" || (!password && !info.mailbox.hasPassword)}
                            onClick={() => call("update", { password, host, port, username, saveWithoutTest: true }, "force")}
                            className="rounded-lg border border-border px-3 py-2 text-[13px] font-semibold hover:bg-brand-50 disabled:opacity-50"
                            title="The sending service is unavailable, so the login cannot be checked right now"
                          >
                            {busy === "force" ? "Saving…" : "Save without testing"}
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={busy !== "" || (!password && !info.mailbox.hasPassword)}
                          className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                          style={{ background: "var(--logo-gradient)" }}
                        >
                          {busy === "save" ? "Testing…" : "Test & save"}
                        </button>
                      </div>
                      <p className="text-[11px] text-ink-faint">
                        New details are saved only if the test login works. The same password must be set at your email host.
                      </p>
                    </form>
                  </details>
                </>
              )}

              {result && (
                <div
                  className={`flex items-start gap-2 rounded-xl border p-3 text-[13px] ${
                    result.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                      : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
                  }`}
                >
                  {result.ok ? (
                    <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <HiOutlineExclamationTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p>{result.text}</p>
                    {!result.ok && result.detail && info?.viewerIsAdmin && (
                      <details className="mt-1 text-[11px] opacity-80">
                        <summary className="cursor-pointer">Technical detail</summary>
                        <p className="mt-1 break-all font-mono">{result.detail}</p>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
