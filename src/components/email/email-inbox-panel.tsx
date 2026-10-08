"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  HiOutlineArrowDownLeft,
  HiOutlineArrowUpRight,
  HiOutlineArrowPath,
  HiOutlineEnvelope,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineShieldCheck,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClock,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
} from "react-icons/hi2";

type InboxItem = {
  id: string;
  direction: "inbound" | "outbound" | string;
  status: string;
  subject: string;
  preview: string;
  fromEmail: string;
  toEmail: string;
  createdAt: string;
  readAt: string | null;
  lead: {
    id: string;
    businessName: string;
    email: string | null;
    phone: string | null;
  } | null;
};

type ThreadMsg = {
  id: string;
  direction: string;
  status: string;
  subject: string;
  body: string;
  fromEmail: string;
  toEmail: string;
  createdAt: string;
  error: string | null;
};

type Account = {
  id: string;
  label: string;
  fromEmail: string;
  isDefault: boolean;
};

type EmailCategory = "bounce" | "security" | "reply" | "outbound";

function getSenderCategory(
  direction: string,
  fromEmail: string,
  subject: string,
): EmailCategory {
  if (direction === "outbound") return "outbound";

  const email = (fromEmail || "").toLowerCase();
  const sub = (subject || "").toLowerCase();

  // 1. Delivery Bounces & Mailer Daemons
  if (
    email.includes("mailer-daemon") ||
    email.includes("postmaster") ||
    email.includes("mail-relay") ||
    sub.includes("undelivered mail") ||
    sub.includes("delivery status") ||
    sub.includes("failure notice") ||
    sub.includes("mail delivery subsystem") ||
    sub.includes("returned to sender")
  ) {
    return "bounce";
  }

  // 2. Security Alerts & System Notifications
  if (
    email.includes("donotreply") ||
    email.includes("no-reply") ||
    email.includes("security@") ||
    email.includes("notifications@") ||
    email.includes("auth@") ||
    email.includes("godaddy.com") ||
    email.includes("openai.com") ||
    email.includes("sendgrid.net") ||
    sub.includes("verification code") ||
    sub.includes("sign-in detected") ||
    sub.includes("security alert") ||
    sub.includes("password reset") ||
    sub.includes("get started with")
  ) {
    return "security";
  }

  return "reply";
}

function getSenderDisplayName(
  fromEmail: string,
  businessName?: string | null,
  category?: EmailCategory,
): string {
  if (businessName) return businessName;
  if (!fromEmail) return "Unknown Sender";

  const email = fromEmail.toLowerCase().trim();

  if (category === "bounce" || email.includes("mailer-daemon")) {
    return "Mailer Daemon (Delivery Bounce)";
  }
  if (email.includes("donotreply@godaddy.com") || email.includes("godaddy")) {
    return "GoDaddy Security & System";
  }
  if (email.includes("openai.com") || email.includes("chatgpt")) {
    return "OpenAI / ChatGPT";
  }
  if (email.includes("hostinger")) {
    return "Hostinger System";
  }

  // Extract from email name part (e.g. john.doe@domain.com -> John Doe)
  const namePart = email.split("@")[0] || "";
  const cleanedName = namePart
    .replace(/[._+-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

  return cleanedName || fromEmail;
}

function getAvatarTheme(str: string, category: EmailCategory) {
  if (category === "bounce") {
    return {
      bg: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200",
      pill: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
      label: "Delivery Bounce",
    };
  }
  if (category === "security") {
    return {
      bg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200",
      pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900",
      label: "System Alert",
    };
  }
  if (category === "outbound") {
    return {
      bg: "bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border-brand-200",
      pill: "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900",
      label: "Sent Outreach",
    };
  }

  // Deterministic palette for incoming replies
  const hash = (str || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palettes = [
    {
      bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200",
      pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
      label: "Inbound Reply",
    },
    {
      bg: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200",
      pill: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900",
      label: "Inbound Reply",
    },
    {
      bg: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border-cyan-200",
      pill: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900",
      label: "Inbound Reply",
    },
    {
      bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200",
      pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
      label: "Inbound Reply",
    },
  ];

  return palettes[hash % palettes.length];
}

function cleanMessageBody(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. Remove raw MIME boundaries and content headers
  text = text.replace(/--[a-f0-9_-]+(?:--)?/gi, "");
  text = text.replace(/Content-Type:[^\n\r]+/gi, "");
  text = text.replace(/Content-Transfer-Encoding:[^\n\r]+/gi, "");
  text = text.replace(/charset="?[^"\r\n]+"?/gi, "");

  // 2. Decode Quoted-Printable artifacts
  text = text.replace(/=E2=80=AF/gi, " ");
  text = text.replace(/=E2=80=99/gi, "’");
  text = text.replace(/=E2=80=98/gi, "‘");
  text = text.replace(/=E2=80=9C/gi, "“");
  text = text.replace(/=E2=80=9D/gi, "”");
  text = text.replace(/=E2=80=A2/gi, "•");
  text = text.replace(/=E2=80=93/gi, "–");
  text = text.replace(/=E2=80=94/gi, "—");
  text = text.replace(/=3D/gi, "=");
  text = text.replace(/=\r?\n/g, ""); // soft linebreaks in quoted-printable

  // 3. Decode HTML entities
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // 4. Strip ugly tracking pixels, beacon images, and analytics URLs
  // Patterns like [https://et.secureserver.net/pixel?...] or [https://cdn.mcauto-images...]
  text = text.replace(
    /!?\[[^\]]*\]\(https?:\/\/[^\)]*(?:pixel|beacon|analytics|open\?|wf\/open|mcauto|spacer|transparent|1x1|ea\/|secureserver\.net\/ea|secureserver\.net\/pixel)[^\)]*\)/gi,
    "",
  );
  text = text.replace(
    /\[https?:\/\/[^\]]*(?:pixel|beacon|analytics|open\?|wf\/open|mcauto|spacer|transparent|1x1|ea\/|secureserver\.net\/ea|secureserver\.net\/pixel)[^\]]*\]/gi,
    "",
  );
  text = text.replace(
    /https?:\/\/[^\s)\]]+(?:pixel|beacon|analytics\.secureserver|open\?|wf\/open|ea\/C5HK)[^\s)\]]*/gi,
    "",
  );

  // 5. Clean remaining standalone bracketed URLs [https://...] -> render clean if not noise
  text = text.replace(/\[(https?:\/\/[^\]]+)\]/g, (_, url) => {
    if (
      url.includes("pixel") ||
      url.includes("analytics") ||
      url.includes("track") ||
      url.includes("mcauto") ||
      url.length > 180
    ) {
      return "";
    }
    try {
      const hostname = new URL(url).hostname;
      return ` [${hostname}](${url}) `;
    } catch {
      return ` [Link](${url}) `;
    }
  });

  // 6. Remove excess whitespace & blank lines
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n\s*\n+/g, "\n\n").trim();

  return text || raw;
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function renderFormattedThreadBody(rawBody: string, category: EmailCategory) {
  const cleaned = cleanMessageBody(rawBody);
  const lines = cleaned.split("\n");

  const mainLines: string[] = [];
  const quoteLines: string[] = [];
  let inQuote = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith(">") ||
      /^On\s+.+wrote:$/i.test(trimmed) ||
      /^---------- Forwarded message/i.test(trimmed) ||
      /^From:\s+/i.test(trimmed)
    ) {
      inQuote = true;
    }

    if (inQuote) {
      quoteLines.push(line.replace(/^>\s?/, ""));
    } else {
      mainLines.push(line);
    }
  }

  const isBounce = category === "bounce";

  return (
    <div className="space-y-3">
      {isBounce && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3 text-xs text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Automated Delivery Failure Notice</p>
            <p className="text-[11px] text-rose-800/90 dark:text-rose-300/90 leading-relaxed">
              The recipient mail server rejected message delivery. Check the error log below for the recipient mailbox and reason.
            </p>
          </div>
        </div>
      )}

      {mainLines.length > 0 && (
        <div className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink font-normal tracking-[-0.01em]">
          {mainLines.join("\n").trim()}
        </div>
      )}

      {quoteLines.length > 0 && (
        <details className="mt-3 rounded-xl bg-[var(--surface-muted)]/70 px-3.5 py-2.5 text-xs text-ink-muted border border-border/70 transition">
          <summary className="cursor-pointer font-medium select-none text-ink-faint hover:text-ink transition flex items-center gap-1.5">
            <span className="text-brand-600">⋯</span>
            <span>Show quoted message history ({quoteLines.length} lines)</span>
          </summary>
          <div className="mt-2.5 border-l-2 border-brand-400/80 pl-3 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-muted/90 max-h-60 overflow-y-auto">
            {quoteLines.join("\n").trim()}
          </div>
        </details>
      )}
    </div>
  );
}

export function EmailInboxPanel() {
  const [tab, setTab] = useState<"all" | "inbound" | "outbound">("all");
  const [emails, setEmails] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboundCount, setInboundCount] = useState(0);
  const [outboundCount, setOutboundCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lead, setLead] = useState<InboxItem["lead"]>(null);
  const [subject, setSubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [smtpAccountId, setSmtpAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Add mailbox modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    label: "",
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "",
    provider: "godaddy" as "godaddy" | "hostinger" | "gmail" | "outlook" | "custom",
  });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const loadInbox = useCallback(async (currentTab: "all" | "inbound" | "outbound") => {
    const res = await fetch(`/api/emails/inbox?tab=${currentTab}&take=100`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load inbox");
    const loadedEmails: InboxItem[] = json.emails ?? [];
    setEmails(loadedEmails);
    setUnreadCount(json.unreadCount ?? 0);
    setInboundCount(json.inboundCount ?? 0);
    setOutboundCount(json.outboundCount ?? 0);
    setTotalCount(json.totalCount ?? 0);

    // Auto-select first email if none selected
    if (loadedEmails.length > 0) {
      setSelectedId((prev) => prev || loadedEmails[0].id);
    }
  }, []);

  const syncMailboxes = useCallback(
    async (fetchAll: boolean = true) => {
      try {
        setSyncing(true);
        setMsg(null);
        setError(null);
        const res = await fetch("/api/emails/inbox/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fetchAll, limit: fetchAll ? 100 : 25 }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.totalSynced > 0) {
            setMsg(
              `✅ Synced ${data.totalSynced} new incoming email(s) across ${data.mailboxesCount ?? "all"} mailbox(es).`,
            );
          } else {
            setMsg(
              `Mailbox sync complete (${data.mailboxesCount ?? 0} active mailbox(es) checked). Inbox is up to date.`,
            );
          }
        } else {
          setError(data.error || "Sync failed");
        }
        await loadInbox(tab);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sync error");
      } finally {
        setSyncing(false);
      }
    },
    [loadInbox, tab],
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        await loadInbox(tab);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load inbox");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [tab, loadInbox]);

  async function openEmail(id: string) {
    setSelectedId(id);
    setMsg(null);
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/emails/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to open");
      setThread(json.thread ?? []);
      setAccounts(json.accounts ?? []);
      setLead(json.email?.lead ?? null);
      const sub = json.email?.subject || "(no subject)";
      setSubject(sub.toLowerCase().startsWith("re:") ? sub : `Re: ${sub}`);
      setReplyBody("");
      const def =
        (json.accounts as Account[] | undefined)?.find((a) => a.isDefault) ||
        json.accounts?.[0];
      setSmtpAccountId(def?.id || "");
      
      // Update read status locally
      setEmails((prev) =>
        prev.map((item) => (item.id === id ? { ...item, readAt: new Date().toISOString() } : item)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open email");
    } finally {
      setBusy(false);
    }
  }

  // Load thread whenever selectedId changes
  useEffect(() => {
    if (selectedId) {
      void openEmail(selectedId);
    }
  }, [selectedId]);

  function handleProviderChange(
    provider: "godaddy" | "hostinger" | "gmail" | "outlook" | "custom",
  ) {
    if (provider === "godaddy") {
      setNewAccount((prev) => ({
        ...prev,
        provider,
        host: "smtpout.secureserver.net",
        port: 465,
        secure: true,
      }));
    } else if (provider === "hostinger") {
      setNewAccount((prev) => ({
        ...prev,
        provider,
        host: "smtp.hostinger.com",
        port: 465,
        secure: true,
      }));
    } else if (provider === "gmail") {
      setNewAccount((prev) => ({
        ...prev,
        provider,
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
      }));
    } else if (provider === "outlook") {
      setNewAccount((prev) => ({
        ...prev,
        provider,
        host: "smtp.office365.com",
        port: 587,
        secure: false,
      }));
    } else {
      setNewAccount((prev) => ({ ...prev, provider }));
    }
  }

  async function handleAddMailboxSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddBusy(true);
    setAddError(null);
    try {
      const res = await fetch("/api/settings/smtp-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          label:
            newAccount.label.trim() ||
            `${newAccount.fromEmail.split("@")[0]} Mailbox`,
          host: newAccount.host.trim(),
          port: Number(newAccount.port),
          secure: newAccount.secure,
          username: (newAccount.username || newAccount.fromEmail).trim(),
          password: newAccount.password,
          fromEmail: newAccount.fromEmail.trim(),
          fromName: newAccount.fromName.trim() || null,
          enabled: true,
          deliveryMode: "smtp",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add mailbox");
      }
      setShowAddModal(false);
      setMsg("Mailbox connected successfully! Fetching emails…");
      void syncMailboxes(true);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add mailbox");
    } finally {
      setAddBusy(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !replyBody.trim()) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: replyBody,
          subject,
          smtpAccountId: smtpAccountId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reply failed");
      setMsg("Reply delivered successfully.");
      setReplyBody("");
      await openEmail(selectedId);
      await loadInbox(tab);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reply failed");
    } finally {
      setBusy(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }

  const filteredEmails = emails.filter((e) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (e.lead?.businessName && e.lead.businessName.toLowerCase().includes(q)) ||
      e.fromEmail.toLowerCase().includes(q) ||
      e.toEmail.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.preview.toLowerCase().includes(q)
    );
  });

  const selectedEmail = emails.find((e) => e.id === selectedId);
  const selectedCategory = selectedEmail
    ? getSenderCategory(selectedEmail.direction, selectedEmail.fromEmail, selectedEmail.subject)
    : "reply";

  return (
    <div className="space-y-5">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/80 bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20">
              <HiOutlineEnvelope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink tracking-tight">Email Workspace &amp; Inbox</h2>
              <p className="text-xs text-ink-muted">
                Multi-mailbox unified inbox, outreach delivery logs, and contractor conversation threads.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Tab Selector */}
          <div className="flex items-center rounded-xl border border-border/80 bg-[var(--surface-muted)]/50 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                tab === "all"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-[var(--surface)]/80",
              )}
            >
              <span>All</span>
              <span className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                tab === "all" ? "bg-white/20 text-white" : "bg-border text-ink-muted"
              )}>
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("inbound")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                tab === "inbound"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-[var(--surface)]/80",
              )}
            >
              <span>Received</span>
              <span className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                tab === "inbound" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              )}>
                {inboundCount}
              </span>
              {unreadCount > 0 && (
                <span className="ml-0.5 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab("outbound")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                tab === "outbound"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "text-ink-muted hover:text-ink hover:bg-[var(--surface)]/80",
              )}
            >
              <span>Sent</span>
              <span className={cn(
                "rounded-full px-1.5 py-0.2 text-[10px]",
                tab === "outbound" ? "bg-white/20 text-white" : "bg-border text-ink-muted"
              )}>
                {outboundCount}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-brand-600 bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition"
          >
            <HiOutlinePlus className="h-4 w-4" />
            <span>Add Mailbox</span>
          </button>

          <button
            type="button"
            onClick={() => syncMailboxes(true)}
            disabled={syncing}
            title="Fetch all new & historical emails from all assigned GoDaddy, Hostinger, and custom mailboxes"
            className={cn(
              "flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition shadow-2xs dark:bg-brand-950/40 dark:border-brand-900/60 dark:text-brand-300",
              syncing && "opacity-75 cursor-not-allowed",
            )}
          >
            <HiOutlineArrowPath className={cn("h-4 w-4", syncing && "animate-spin text-brand-600")} />
            <span>{syncing ? "Syncing Mailboxes…" : "Fetch / Sync Inboxes"}</span>
          </button>

          <button
            type="button"
            onClick={() => loadInbox(tab)}
            title="Refresh List"
            className="rounded-xl border border-border bg-[var(--surface)] p-2 text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink transition shadow-2xs"
          >
            <HiOutlineArrowPath className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
          <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <HiOutlineCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      {/* Main Inbox Workspace (Split Grid) */}
      <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] items-start">
        {/* Left Column: Email List */}
        <div className="space-y-2.5">
          {/* Search Box */}
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              className="saas-input w-full pl-9 pr-8 text-xs h-9.5 rounded-xl"
              placeholder="Search sender, lead, or subject…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* List Card Container */}
          <div className="overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-xs">
            {loading ? (
              <div className="py-16 text-center space-y-2 text-xs text-ink-muted">
                <HiOutlineArrowPath className="mx-auto h-6 w-6 animate-spin text-brand-600" />
                <p className="font-medium">Loading conversations…</p>
              </div>
            ) : !filteredEmails.length ? (
              <div className="px-5 py-16 text-center text-xs text-ink-muted space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-ink-faint mx-auto">
                  <HiOutlineEnvelope className="h-6 w-6" />
                </div>
                <p className="font-bold text-ink text-sm">
                  {tab === "inbound"
                    ? "No received replies yet"
                    : tab === "outbound"
                    ? "No sent outreach yet"
                    : "No emails found"}
                </p>
                <p className="text-[11px] text-ink-faint max-w-xs mx-auto leading-relaxed">
                  {tab === "inbound"
                    ? "When a lead or contractor replies, their incoming message will be synced and displayed here."
                    : "Outreach messages sent from campaigns or the composer will appear here."}
                </p>
              </div>
            ) : (
              <ul className="max-h-[620px] divide-y divide-border/60 overflow-y-auto">
                {filteredEmails.map((e) => {
                  const active = selectedId === e.id;
                  const isInbound = e.direction === "inbound";
                  const unread = isInbound && !e.readAt;
                  const category = getSenderCategory(e.direction, e.fromEmail, e.subject);
                  const theme = getAvatarTheme(e.fromEmail, category);
                  const displayName = getSenderDisplayName(e.fromEmail, e.lead?.businessName, category);
                  const cleanPreview = cleanMessageBody(e.preview || e.subject || "").slice(0, 110);
                  const initial = displayName.charAt(0).toUpperCase() || "E";

                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(e.id)}
                        className={cn(
                          "w-full p-3.5 text-left transition relative flex items-start gap-3",
                          active
                            ? "bg-brand-50/90 dark:bg-brand-950/40 border-l-[3.5px] border-brand-600 shadow-2xs"
                            : "hover:bg-[var(--surface-muted)]/60",
                        )}
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold border shadow-2xs",
                            theme.bg,
                          )}
                        >
                          {category === "bounce" ? (
                            <HiOutlineExclamationTriangle className="h-4 w-4" />
                          ) : category === "security" ? (
                            <HiOutlineShieldCheck className="h-4 w-4" />
                          ) : (
                            <span>{initial}</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p
                              className={cn(
                                "truncate text-xs tracking-tight",
                                unread ? "font-bold text-ink" : "font-semibold text-ink",
                              )}
                            >
                              {displayName}
                            </p>
                            <span className="shrink-0 text-[10.5px] text-ink-faint font-medium">
                              {formatRelativeTime(e.createdAt)}
                            </span>
                          </div>

                          <p className="truncate text-[11.5px] font-medium text-ink-muted">
                            {e.subject || "(no subject)"}
                          </p>

                          <p className="line-clamp-2 text-[11px] text-ink-faint leading-relaxed">
                            {cleanPreview || "(empty message preview)"}
                          </p>

                          {/* Category Badge & Destination Mailbox */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider border",
                                theme.pill,
                              )}
                            >
                              {theme.label}
                            </span>

                            {e.toEmail && (
                              <span
                                title={`Received on mailbox: ${e.toEmail}`}
                                className="inline-flex items-center gap-1 truncate max-w-[160px] rounded-md bg-[var(--surface-muted)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-muted border border-border/60"
                              >
                                📥 {e.toEmail}
                              </span>
                            )}

                            {unread && (
                              <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse ml-auto" />
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Conversation Thread & Smart Reply */}
        <div className="rounded-2xl border border-border bg-[var(--surface)] shadow-xs flex flex-col min-h-[580px]">
          {!selectedId || !selectedEmail ? (
            <div className="my-auto py-24 text-center px-6 space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 mx-auto dark:bg-brand-500/20">
                <HiOutlineEnvelope className="h-7 w-7" />
              </div>
              <p className="font-bold text-ink text-base">Select a conversation</p>
              <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
                Choose any email on the left to read full message thread history, inspect delivery status, and reply directly from your mailbox.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Thread Header */}
              <div className="border-b border-border/80 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-muted)]/30 rounded-t-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold border",
                      getAvatarTheme(selectedEmail.fromEmail, selectedCategory).bg,
                    )}
                  >
                    {selectedCategory === "bounce" ? (
                      <HiOutlineExclamationTriangle className="h-5 w-5" />
                    ) : selectedCategory === "security" ? (
                      <HiOutlineShieldCheck className="h-5 w-5" />
                    ) : (
                      <span>{getSenderDisplayName(selectedEmail.fromEmail, selectedEmail.lead?.businessName, selectedCategory).charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-ink truncate">
                        {getSenderDisplayName(selectedEmail.fromEmail, selectedEmail.lead?.businessName, selectedCategory)}
                      </h3>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                          getAvatarTheme(selectedEmail.fromEmail, selectedCategory).pill,
                        )}
                      >
                        {getAvatarTheme(selectedEmail.fromEmail, selectedCategory).label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      <span className="font-mono text-[11px] text-ink-muted">From: {selectedEmail.fromEmail}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedEmail.fromEmail)}
                        className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:underline"
                      >
                        {copiedEmail ? (
                          <>
                            <HiOutlineCheck className="h-3 w-3 text-emerald-600" /> Copied
                          </>
                        ) : (
                          <>
                            <HiOutlineClipboardDocument className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>

                      {selectedEmail.toEmail && (
                        <div className="flex items-center gap-1 rounded-md bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] border border-border/60">
                          <span className="text-ink-faint">Received on:</span>
                          <span className="font-mono font-bold text-brand-700 dark:text-brand-300">
                            📥 {selectedEmail.toEmail}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lead CRM Link if matched */}
                {lead && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/leads/${lead.id}?from=saved`}
                      className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/80 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition dark:bg-brand-950/50 dark:border-brand-900 dark:text-brand-300"
                    >
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5" />
                      <span>{lead.businessName} Profile</span>
                      <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Messages Thread Body */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto max-h-[460px] space-y-4">
                {thread.map((m) => {
                  const isInbound = m.direction === "inbound";
                  const msgCategory = getSenderCategory(m.direction, m.fromEmail, m.subject);

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-2xl p-4 sm:p-5 transition border space-y-3 shadow-2xs",
                        isInbound
                          ? "bg-[var(--surface)] border-border"
                          : "bg-brand-50/50 border-brand-200/80 dark:bg-brand-950/20 dark:border-brand-900/60",
                      )}
                    >
                      {/* Message Metadata Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-bold tracking-wide uppercase",
                              isInbound
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
                            )}
                          >
                            {isInbound ? (
                              <>
                                <HiOutlineArrowDownLeft className="h-3.5 w-3.5" /> Received
                              </>
                            ) : (
                              <>
                                <HiOutlineArrowUpRight className="h-3.5 w-3.5" /> Sent (You)
                              </>
                            )}
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                            {isInbound ? (
                              <>
                                <span>From: <strong className="font-mono text-ink font-semibold">{m.fromEmail}</strong></span>
                                <span className="text-ink-faint">➔</span>
                                <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-brand-700 border border-brand-200/70 dark:bg-brand-950 dark:border-brand-900 dark:text-brand-300">
                                  📥 Received on: {m.toEmail}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>From: <strong className="font-mono text-ink font-semibold">{m.fromEmail}</strong></span>
                                <span className="text-ink-faint">➔</span>
                                <span>To: <strong className="font-mono text-ink font-semibold">{m.toEmail}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-ink-faint">
                          <HiOutlineClock className="h-3.5 w-3.5" />
                          <span>{new Date(m.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                      </div>

                      {/* Subject */}
                      <p className="font-bold text-sm text-ink">{m.subject || "(no subject)"}</p>

                      {/* Formatted Body */}
                      {renderFormattedThreadBody(m.body, msgCategory)}

                      {/* Error log if any */}
                      {m.error && (
                        <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 font-mono dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                          <p className="font-bold text-[11px] uppercase tracking-wider mb-1">Error Details:</p>
                          {m.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Docked Reply Composer */}
              <div className="border-t border-border/80 bg-[var(--surface-muted)]/40 p-4 sm:p-5 rounded-b-2xl">
                <form onSubmit={sendReply} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <HiOutlinePaperAirplane className="h-3.5 w-3.5 text-brand-600" />
                      <span>Reply to this conversation</span>
                    </p>
                    <span className="text-[10.5px] text-ink-faint">Press Cmd+Enter to send</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Mailbox Selector */}
                    {accounts.length > 0 ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                          Send From Mailbox
                        </label>
                        <select
                          className="saas-input w-full text-xs h-9 rounded-xl"
                          value={smtpAccountId}
                          onChange={(e) => setSmtpAccountId(e.target.value)}
                          disabled={busy}
                        >
                          <option value="">
                            ⚡ Auto-Rotate across Mailboxes (Hostinger / GoDaddy)
                          </option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label} · {a.fromEmail}
                              {a.isDefault ? " (default)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {/* Subject */}
                    <div className={accounts.length === 0 ? "sm:col-span-2" : ""}>
                      <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                        Subject Line
                      </label>
                      <input
                        className="saas-input w-full text-xs h-9 rounded-xl"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  {/* Message Body */}
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted mb-1">
                      Message Content *
                    </label>
                    <Textarea
                      className="min-h-[110px] text-xs rounded-xl focus:ring-2 focus:ring-brand-500/20"
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          void sendReply(e);
                        }
                      }}
                      placeholder="Write your email response here…"
                      disabled={busy}
                      required
                    />
                  </div>

                  {/* Send Button */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      type="submit"
                      loading={busy}
                      disabled={busy || !replyBody.trim()}
                      className="text-xs px-5 h-9 rounded-xl font-semibold shadow-xs"
                    >
                      <HiOutlinePaperAirplane className="h-3.5 w-3.5 mr-1.5" />
                      Send Reply
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Mailbox Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  <HiOutlineEnvelope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink">Connect New Mailbox</h3>
                  <p className="text-[11px] text-ink-muted">Add GoDaddy, Hostinger, Gmail or Custom SMTP/IMAP</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink transition"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700">
                {addError}
              </p>
            )}

            <form onSubmit={handleAddMailboxSubmit} className="mt-4 space-y-3.5">
              {/* Provider Quick Presets */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Provider Preset
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {(
                    [
                      { id: "godaddy", label: "GoDaddy" },
                      { id: "hostinger", label: "Hostinger" },
                      { id: "gmail", label: "Gmail" },
                      { id: "outlook", label: "Outlook" },
                      { id: "custom", label: "Custom" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProviderChange(p.id)}
                      className={cn(
                        "rounded-xl border px-2 py-1.5 text-center text-xs font-semibold transition",
                        newAccount.provider === p.id
                          ? "border-brand-600 bg-brand-50 text-brand-700 shadow-2xs dark:bg-brand-950/60 dark:text-brand-300"
                          : "border-border text-ink-muted hover:bg-[var(--input-bg)] hover:text-ink",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    From Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sales@yourdomain.com"
                    value={newAccount.fromEmail}
                    onChange={(e) =>
                      setNewAccount((prev) => ({
                        ...prev,
                        fromEmail: e.target.value,
                        username: prev.username || e.target.value,
                      }))
                    }
                    className="saas-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Frank Miller"
                    value={newAccount.fromName}
                    onChange={(e) =>
                      setNewAccount((prev) => ({ ...prev, fromName: e.target.value }))
                    }
                    className="saas-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    SMTP Host *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="smtp.hostinger.com"
                    value={newAccount.host}
                    onChange={(e) =>
                      setNewAccount((prev) => ({ ...prev, host: e.target.value }))
                    }
                    className="saas-input w-full text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Port
                    </label>
                    <input
                      type="number"
                      required
                      value={newAccount.port}
                      onChange={(e) =>
                        setNewAccount((prev) => ({
                          ...prev,
                          port: Number(e.target.value),
                        }))
                      }
                      className="saas-input w-full text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Security
                    </label>
                    <select
                      value={newAccount.secure ? "ssl" : "starttls"}
                      onChange={(e) =>
                        setNewAccount((prev) => ({
                          ...prev,
                          secure: e.target.value === "ssl",
                        }))
                      }
                      className="saas-input w-full text-xs"
                    >
                      <option value="ssl">SSL (465)</option>
                      <option value="starttls">TLS (587)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Username / Login *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sales@yourdomain.com"
                    value={newAccount.username}
                    onChange={(e) =>
                      setNewAccount((prev) => ({ ...prev, username: e.target.value }))
                    }
                    className="saas-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newAccount.password}
                    onChange={(e) =>
                      setNewAccount((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="saas-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={addBusy}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={addBusy}
                  disabled={addBusy || !newAccount.fromEmail || !newAccount.password}
                >
                  Connect Mailbox
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
