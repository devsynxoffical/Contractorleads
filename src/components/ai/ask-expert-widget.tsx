"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  HiOutlineArrowUp,
  HiOutlineBookmark,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClipboardDocument,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineXMark,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const LOGO_GRADIENT =
  "linear-gradient(135deg, #e6007e 0%, #8e24aa 55%, #7b1fa2 100%)";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  "Write a cold email for roofers",
  "How do I prioritize Hot leads?",
  "Give me a discovery call script",
];

export function AskExpertWidget({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("leadflow-bot-theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    const openBot = () => setOpen(true);
    window.addEventListener("leadflow:open-bot", openBot);
    return () => window.removeEventListener("leadflow:open-bot", openBot);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  function toggleTheme() {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      localStorage.setItem("leadflow-bot-theme", next);
      return next;
    });
  }

  async function ask(override?: string, save = false) {
    const text = (override ?? message).trim();
    if (!text || loading) return;

    setMessage("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    const res = await fetch("/api/ai/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, save }),
    });

    if (res.status === 402) {
      setError("Out of credits. Upgrade to continue.");
      setLoading(false);
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Bot failed. Check OPENAI_API_KEY in .env.");
      setLoading(false);
      return;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content || "" },
      ]);
      setLoading(false);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let out = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out += decoder.decode(value);
        const snapshot = out;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: snapshot };
          return copy;
        });
      }
    }
    setLoading(false);
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.content;

  const dark = theme === "dark";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-40 flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.03] hover:opacity-95 sm:px-5"
        style={{
          background: LOGO_GRADIENT,
          bottom: "max(1rem, env(safe-area-inset-bottom))",
          right: "max(1rem, env(safe-area-inset-right))",
        }}
        aria-label="Ask Expert live bot"
      >
        <span className="relative">
          <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 h-2 w-2 animate-soft-pulse rounded-full bg-emerald-400 ring-2 ring-white/40" />
        </span>
        <span className="hidden sm:inline">Live AI Bot</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-end sm:justify-end sm:p-4 md:p-6">
          <div
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-[3px] animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "animate-bot-in relative flex h-[min(680px,94dvh)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:rounded-2xl",
              dark
                ? "border-white/10 bg-[#14111a] text-white"
                : "border-border bg-white text-ink"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between border-b px-4 py-3.5",
                dark ? "border-white/10" : "border-border"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Image
                    src="/logo.png"
                    alt=""
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Ask Contractor Leads</p>
                  <p
                    className={cn(
                      "text-[11px]",
                      dark ? "text-white/55" : "text-ink-muted"
                    )}
                  >
                    Live · {user.companyName || "your business"} ·{" "}
                    {dark ? "Dark" : "Light"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition",
                    dark
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-ink-muted hover:bg-brand-50 hover:text-brand-600"
                  )}
                  aria-label="Toggle dark / light bot"
                  title="Toggle dark / light"
                >
                  {dark ? (
                    <HiOutlineSun className="h-4 w-4" />
                  ) : (
                    <HiOutlineMoon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition",
                    dark
                      ? "text-white/70 hover:bg-white/10"
                      : "text-ink-muted hover:bg-stone-100"
                  )}
                  aria-label="Close"
                >
                  <HiOutlineXMark className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className={cn(
                "flex-1 space-y-3 overflow-y-auto px-4 py-4",
                dark ? "bg-[#0e0b12]" : "bg-[#faf8fb]"
              )}
            >
              {messages.length === 0 && !loading && (
                <div className="animate-fade-up space-y-3 py-2">
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      dark ? "text-white/70" : "text-ink-muted"
                    )}
                  >
                    Hi {user.name?.split(" ")[0] || "there"} — ask about hooks,
                    offers, scripts, funnels, or outreach. Switch light/dark with
                    the sun/moon icon.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => ask(q)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-left text-[12px] font-medium transition",
                          dark
                            ? "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                            : "border-border bg-white text-ink-muted hover:border-brand-200 hover:text-brand-700"
                        )}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={cn(
                    "animate-fade-up flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "rounded-br-md text-white"
                        : dark
                          ? "rounded-bl-md border border-white/10 bg-[#1c1724] text-white/90"
                          : "rounded-bl-md border border-border bg-white text-ink shadow-sm"
                    )}
                    style={
                      m.role === "user" ? { background: LOGO_GRADIENT } : undefined
                    }
                  >
                    {m.content || (loading && i === messages.length - 1 ? "…" : "")}
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-2xl rounded-bl-md border px-3.5 py-3",
                      dark
                        ? "border-white/10 bg-[#1c1724]"
                        : "border-border bg-white"
                    )}
                  >
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-500" />
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                  {error}
                </p>
              )}
            </div>

            <div
              className={cn(
                "space-y-2 border-t p-3",
                dark ? "border-white/10 bg-[#14111a]" : "border-border bg-white"
              )}
            >
              {lastAssistant && !loading && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      dark &&
                        "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    )}
                    onClick={() =>
                      navigator.clipboard.writeText(lastAssistant)
                    }
                  >
                    <HiOutlineClipboardDocument className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      dark &&
                        "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    )}
                    onClick={async () => {
                      const lastUser = [...messages]
                        .reverse()
                        .find((m) => m.role === "user")?.content;
                      if (!lastUser) return;
                      await fetch("/api/ai/ask", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          message: lastUser,
                          save: true,
                        }),
                      });
                    }}
                  >
                    <HiOutlineBookmark className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              )}
              <div
                className={cn(
                  "flex items-end gap-2 rounded-xl border p-1.5",
                  dark ? "border-white/10 bg-[#1c1724]" : "border-border bg-[#faf8fb]"
                )}
              >
                <Textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      ask();
                    }
                  }}
                  placeholder="Ask the live bot…"
                  className={cn(
                    "min-h-[44px] max-h-28 flex-1 resize-none border-0 bg-transparent py-2.5 shadow-none focus-visible:ring-0",
                    dark && "text-white placeholder:text-white/40"
                  )}
                />
                <button
                  type="button"
                  onClick={() => ask()}
                  disabled={loading || !message.trim()}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition hover:opacity-95 disabled:opacity-40"
                  style={{ background: LOGO_GRADIENT }}
                  aria-label="Send"
                >
                  <HiOutlineArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
