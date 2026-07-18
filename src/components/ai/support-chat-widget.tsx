"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  HiOutlineArrowUp,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineXMark,
} from "react-icons/hi2";
import type { SessionUser } from "@/lib/session-user";

const LOGO_GRADIENT =
  "linear-gradient(135deg, #e6007e 0%, #8e24aa 55%, #7b1fa2 100%)";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_HELP = [
  "How do I search for leads?",
  "Why am I getting no results?",
  "How do credits work?",
];

export function SupportChatWidget({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openBot = () => setOpen(true);
    window.addEventListener("leadflow:open-bot", openBot);
    return () => window.removeEventListener("leadflow:open-bot", openBot);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  async function ask(override?: string) {
    const text = (override ?? message).trim();
    if (!text || loading) return;

    setMessage("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, support: true }),
      });

      if (!res.ok) {
        setError("Support chat is unavailable right now. Please try again.");
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content || "" },
        ]);
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_10px_28px_rgba(123,31,162,0.4)] transition hover:scale-105 hover:opacity-95"
          style={{
            background: LOGO_GRADIENT,
            bottom: "max(1.25rem, env(safe-area-inset-bottom))",
            right: "max(1.25rem, env(safe-area-inset-right))",
          }}
          aria-label="Help & support chat"
        >
          <HiOutlineChatBubbleOvalLeftEllipsis className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-end sm:justify-end sm:p-4 md:p-6">
          <div
            className="absolute inset-0 animate-fade-in bg-stone-900/25 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="animate-bot-in relative flex h-[min(560px,92dvh)] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl border border-border bg-white text-ink shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border">
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
                  <p className="text-sm font-semibold">Help & Support</p>
                  <p className="text-[11px] text-ink-muted">
                    Ask anything about using the app
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-stone-100"
                aria-label="Close"
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[#faf8fb] px-4 py-4"
            >
              {messages.length === 0 && !loading && (
                <div className="animate-fade-up space-y-3 py-2">
                  <p className="text-sm leading-relaxed text-ink-muted">
                    Hi {user.name?.split(" ")[0] || "there"} — facing an issue
                    or not sure how something works? Ask me here.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_HELP.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => ask(q)}
                        className="rounded-lg border border-border bg-white px-3 py-1.5 text-left text-[12px] font-medium text-ink-muted transition hover:border-brand-200 hover:text-brand-700"
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
                  className={`animate-fade-up flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-md text-white"
                        : "rounded-bl-md border border-border bg-white text-ink shadow-sm"
                    }`}
                    style={
                      m.role === "user" ? { background: LOGO_GRADIENT } : undefined
                    }
                  >
                    {m.content ||
                      (loading && i === messages.length - 1 ? "…" : "")}
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-white px-3.5 py-3">
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask();
              }}
              className="flex items-center gap-2 border-t border-border bg-white p-3"
            >
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue…"
                disabled={loading}
                className="h-11 flex-1 rounded-xl border border-border bg-[#faf8fb] px-3.5 text-[13px] text-ink outline-none transition placeholder:text-ink-faint focus:border-brand-400"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition hover:opacity-95 disabled:opacity-40"
                style={{ background: LOGO_GRADIENT }}
                aria-label="Send"
              >
                <HiOutlineArrowUp className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
