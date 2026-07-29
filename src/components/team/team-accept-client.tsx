"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HiOutlineCheckCircle, HiOutlineExclamationCircle } from "react-icons/hi2";
import { Button } from "@/components/ui/button";

export function TeamAcceptClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [message, setMessage] = useState("Accepting your invite…");
  const [workspace, setWorkspace] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Missing invite token. Ask your teammate to resend the invite.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/team/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus("err");
          setMessage(
            typeof data.error === "string"
              ? data.error
              : "Could not accept this invite.",
          );
          return;
        }
        setStatus("ok");
        setWorkspace(
          typeof data.workspace?.name === "string" ? data.workspace.name : null,
        );
        setMessage(
          data.alreadyAccepted
            ? "This invite was already accepted."
            : "Invite accepted. Your seat is confirmed.",
        );
      } catch {
        if (!cancelled) {
          setStatus("err");
          setMessage("Could not accept this invite. Try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-start gap-3">
        {status === "ok" ? (
          <HiOutlineCheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
        ) : status === "err" ? (
          <HiOutlineExclamationCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
        ) : (
          <span className="mt-1 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        )}
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Team invite</h1>
          {workspace ? (
            <p className="mt-1 text-[13px] font-medium text-brand-700">
              {workspace}
            </p>
          ) : null}
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/login">
          <Button type="button">Sign in</Button>
        </Link>
        <Link href="/register">
          <Button type="button" variant="secondary">
            Create account
          </Button>
        </Link>
      </div>
    </div>
  );
}
