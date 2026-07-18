"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HiOutlineArrowPath,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlinePlus,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineTrash,
} from "react-icons/hi2";
import { LOGO_GRADIENT } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
  preview?: string;
};

const QUICK_PROMPTS = [
  { label: "Prospecting", prompt: "How do I get more HVAC clients this month?" },
  { label: "Cold email", prompt: "Write a cold email for roofing owners" },
  { label: "Ads", prompt: "What should my Facebook ad hook be?" },
  { label: "Product help", prompt: "How do credits and Lead Finder work?" },
];

function welcomeText(userName?: string | null) {
  const first = userName?.split(" ")[0];
  return first
    ? `I'm your AI Assistant. Ready when you are, ${first}.`
    : "I'm your AI Assistant. I feel the need — the need for leads.";
}

export function AiAssistantWorkspace({
  userName,
  compact = false,
  showAskExpertLink = true,
}: {
  userName?: string | null;
  /** Shorter height when embedded above Filters on Home */
  compact?: boolean;
  showAskExpertLink?: boolean;
}) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isEmptyThread = messages.length === 0;

  const refreshChats = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/chats");
      if (!res.ok) return;
      const data = await res.json();
      setChats(data.chats ?? []);
    } catch {
      /* ignore */
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshChats();
  }, [refreshChats]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function openChat(id: string) {
    if (loading) return;
    setActiveId(id);
    setMessages([]);
    try {
      const res = await fetch(`/api/ai/chats/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.chat?.messages ?? []);
    } catch {
      /* ignore */
    }
  }

  function startNewChat() {
    if (loading) return;
    setActiveId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  async function deleteChat(id: string) {
    if (loading) return;
    try {
      await fetch(`/api/ai/chats/${id}`, { method: "DELETE" });
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      /* ignore */
    }
  }

  async function ask(override?: string) {
    const q = (override ?? input).trim();
    if (!q || loading) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: "user",
      text: q,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          conversationId: activeId,
        }),
      });

      const newId = res.headers.get("X-Conversation-Id");
      if (newId && newId !== activeId) {
        setActiveId(newId);
      }

      if (res.status === 402) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "You're out of AI credits. Upgrade under Plans & Billing, or use Filters below to search leads.",
          },
        ]);
        return;
      }

      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "I couldn't reply just now. Please try again in a moment.",
          },
        ]);
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.conversationId && data.conversationId !== activeId) {
          setActiveId(data.conversationId);
        }
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.content || "No response.",
          },
        ]);
        void refreshChats();
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let out = "";
      const assistantId = crypto.randomUUID();
      setMessages((m) => [
        ...m,
        { id: assistantId, role: "assistant", text: "" },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          out += decoder.decode(value);
          const snapshot = out;
          setMessages((m) =>
            m.map((msg) =>
              msg.id === assistantId ? { ...msg, text: snapshot } : msg,
            ),
          );
        }
      }

      if (!out.trim()) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  text: "No response came back. Try asking again.",
                }
              : msg,
          ),
        );
      }

      void refreshChats();
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Something went wrong reaching the AI. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void ask();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask();
    }
  }

  return (
    <div
      className={cn(
        "animate-fade-up flex w-full overflow-hidden rounded-2xl border border-border bg-[var(--panel-solid)] shadow-[var(--shadow-card)]",
        compact ? "h-[min(520px,70vh)]" : "h-[min(640px,78vh)]",
      )}
    >
      {/* Chat history sidebar */}
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-[var(--sidebar)] transition-[width] duration-200",
          sidebarOpen ? "w-[220px] sm:w-[240px]" : "w-0 overflow-hidden border-r-0",
        )}
      >
        <div className="space-y-2 border-b border-border p-3">
          <button
            type="button"
            onClick={startNewChat}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            style={{ background: LOGO_GRADIENT }}
          >
            <HiOutlinePlus className="h-4 w-4" />
            New chat
          </button>
          <Link
            href="/ask-expert"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-ink-muted transition hover:bg-brand-50 hover:text-ink"
          >
            <HiOutlineCog6Tooth className="h-3.5 w-3.5" />
            AI Assistant settings
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Chats
          </p>
          {listLoading ? (
            <p className="px-2 text-[12px] text-ink-faint">Loading…</p>
          ) : chats.length === 0 ? (
            <p className="px-2 text-[12px] leading-relaxed text-ink-faint">
              Your conversations will show up here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <div
                    className={cn(
                      "group flex w-full items-start gap-1 rounded-lg px-1 py-0.5 transition",
                      activeId === chat.id ? "bg-brand-100" : "hover:bg-brand-50",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void openChat(chat.id)}
                      className={cn(
                        "flex min-w-0 flex-1 items-start gap-2 rounded-lg px-1.5 py-2 text-left",
                        activeId === chat.id
                          ? "text-ink"
                          : "text-ink-muted group-hover:text-ink",
                      )}
                    >
                      <HiOutlineChatBubbleLeftRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="block truncate text-[12px] font-medium">
                        {chat.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteChat(chat.id)}
                      className="mt-1.5 rounded p-1 text-ink-faint opacity-0 transition hover:bg-brand-200/40 hover:text-ink group-hover:opacity-100"
                      aria-label="Delete chat"
                    >
                      <HiOutlineTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-brand-50"
              aria-label="Toggle chat history"
            >
              {sidebarOpen ? "Hide" : "Chats"}
            </button>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
              <HiOutlineSparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-brand-500">
                AI assistant
              </p>
              <p className="text-[11px] text-ink-faint">
                {activeId ? "Continuing chat" : "New conversation"}
              </p>
            </div>
          </div>
          {showAskExpertLink ? (
            <Link
              href="/ask-expert"
              className="text-[11px] font-semibold text-brand-500 hover:underline"
            >
              Full Ask Expert →
            </Link>
          ) : null}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {isEmptyThread ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <p className="max-w-md font-[family-name:var(--font-display)] text-[20px] font-semibold tracking-tight text-ink sm:text-[24px]">
                {welcomeText(userName)}
              </p>
              <p className="mt-2 max-w-sm text-[13px] text-ink-muted">
                Ask about offers, ads, outreach, or how to use Contractor Leads.
                Past chats stay in the sidebar so you can pick up anytime.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed sm:text-[14px] ${
                      msg.role === "user"
                        ? "rounded-br-md text-white shadow-sm"
                        : "rounded-bl-md border border-border bg-[var(--input-bg)] text-ink"
                    }`}
                    style={
                      msg.role === "user"
                        ? { background: LOGO_GRADIENT }
                        : undefined
                    }
                  >
                    {msg.text || (loading ? "…" : "")}
                  </div>
                </div>
              ))}
              {loading ? (
                <p className="flex items-center justify-center gap-2 text-[13px] text-ink-muted">
                  <HiOutlineArrowPath className="h-4 w-4 animate-spin text-brand-500" />
                  Thinking…
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-[var(--input-bg)] px-4 py-3 sm:px-5">
          {isEmptyThread ? (
            <div className="mb-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                Start with a preset
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    disabled={loading}
                    onClick={() => void ask(p.prompt)}
                    className="rounded-full border border-border bg-[var(--panel-solid)] px-3.5 py-1.5 text-[12px] font-medium text-ink-muted transition hover:border-brand-500/45 hover:bg-brand-50 hover:text-ink disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mx-auto flex max-w-2xl gap-2">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="What can I help you do?"
                disabled={loading}
                className="max-h-28 min-h-[44px] w-full resize-none rounded-xl border border-border bg-[var(--panel-solid)] px-3.5 py-3 text-[14px] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-500/55 focus:ring-4 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl text-white shadow-[0_8px_20px_rgba(168,85,247,0.3)] transition hover:opacity-95 disabled:opacity-45"
              style={{ background: LOGO_GRADIENT }}
              aria-label="Send"
            >
              <HiOutlinePaperAirplane className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
