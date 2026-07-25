"use client";

import { useState } from "react";
import { EmailInboxPanel } from "@/components/email/email-inbox-panel";
import { EmailComposePanel } from "@/components/email/email-compose-panel";
import { cn } from "@/lib/utils";
import { HiOutlineInbox, HiOutlinePencilSquare } from "react-icons/hi2";

type Tab = "inbox" | "compose";

export function EmailWorkspace() {
  const [tab, setTab] = useState<Tab>("inbox");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-[var(--surface)] p-1">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition",
            tab === "inbox"
              ? "bg-brand-600 text-white"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <HiOutlineInbox className="h-4 w-4" />
          Inbox
        </button>
        <button
          type="button"
          onClick={() => setTab("compose")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition",
            tab === "compose"
              ? "bg-brand-600 text-white"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
          Compose
        </button>
      </div>

      {tab === "inbox" ? <EmailInboxPanel /> : <EmailComposePanel />}
    </div>
  );
}
