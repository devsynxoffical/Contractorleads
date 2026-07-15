"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  LOGO_GRADIENT,
  SecondaryActionLink,
} from "@/components/layout/page-header";
import { PromptCard, SectionLabel } from "@/components/ui/section";
import {
  HiOutlineArrowUp,
  HiOutlineBookmark,
  HiOutlineChartBar,
  HiOutlineClipboardDocument,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineLightBulb,
  HiOutlinePhone,
  HiOutlineSparkles,
  HiOutlineFlag,
} from "react-icons/hi2";

const PROMPTS = [
  {
    icon: HiOutlineChartBar,
    title: "Analyze my leads",
    description: "Look at how I should prioritize Hot vs Warm lead follow-up.",
    prompt:
      "Analyze how I should prioritize my Hot vs Warm contractor leads and give me a 7-day outreach plan.",
  },
  {
    icon: HiOutlineFlag,
    title: "Find contractor leads",
    description: "Who to target in roofing / HVAC for my offer.",
    prompt:
      "I want to find roofing contractors doing $500k–$5M/yr. Help me define ideal ICP filters and outreach angles.",
  },
  {
    icon: HiOutlineDocumentText,
    title: "Write a cold email",
    description: "Short, proven opener for home-service owners.",
    prompt:
      "Write a cold email to a home-service contractor offering lead generation. Keep it under 120 words, direct, no fluff.",
  },
  {
    icon: HiOutlineLightBulb,
    title: "Fix my funnel",
    description: "Why leads aren’t booking calls — and how to fix it.",
    prompt:
      "My contractor leads aren't booking calls. Diagnose common funnel issues and give me a fix checklist.",
  },
  {
    icon: HiOutlinePhone,
    title: "Craft a sales script",
    description: "Discovery-call script for roofers / HVAC.",
    prompt:
      "Give me a discovery-call script for pitching a roofer who gets 20–40 jobs a month.",
  },
  {
    icon: HiOutlineCurrencyDollar,
    title: "Rework my offer",
    description: "Make the offer feel like a no-brainer.",
    prompt:
      "Help me rework my offer so it feels like a no-brainer for HVAC company owners.",
  },
];

export default function AskExpertPage() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function ask(save = false, override?: string) {
    const text = (override ?? message).trim();
    if (!text) return;
    setStarted(true);
    setMessage(text);
    setLoading(true);
    setError("");
    setResponse("");

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
      setError(data.error || "Ask Expert failed. Check OPENAI_API_KEY in .env.");
      setLoading(false);
      return;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      setResponse(data.content);
      setLoading(false);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let out = "";
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out += decoder.decode(value);
        setResponse(out);
      }
    }
    setLoading(false);
  }

  function usePrompt(prompt: string) {
    setMessage(prompt);
    setStarted(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="page-pad page-enter relative min-h-[calc(100vh-8rem)]">
      <div className="mesh-bg absolute inset-0 -z-10 rounded-2xl" />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="animate-float relative flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[var(--shadow-card)]">
            <Image src="/logo.png" alt="" width={28} height={28} className="object-contain" />
            <span className="animate-soft-pulse absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-500" />
          </div>
          <div>
            <SectionLabel>AI assistant</SectionLabel>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Ask <span className="gradient-text">Contractor Leads</span>
            </h1>
            <p className="text-[13px] text-ink-muted">
              Growth expert for hooks, offers, scripts, funnels & outreach
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryActionLink href="/scripts">
            <HiOutlineDocumentText className="h-4 w-4" />
            My Scripts
          </SecondaryActionLink>
          <SecondaryActionLink href="/leads/search">
            <HiOutlineSparkles className="h-4 w-4" />
            Lead Finder
          </SecondaryActionLink>
        </div>
      </div>

      {!started && !response && (
        <div className="mx-auto max-w-4xl">
          <div className="animate-fade-up text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{ background: LOGO_GRADIENT }}
            >
              <HiOutlineSparkles className="h-8 w-8" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              What do you want to grow today?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-muted">
              Personalized to your Settings profile. Pick a prompt or ask anything
              about contractor leads, marketing, or closing.
            </p>
            <p className="mt-3 text-[13px] font-medium text-amber-700">
              Tip: complete Settings so answers match your services & geo.
            </p>
          </div>

          <div className="mt-8 stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROMPTS.map((p, i) => (
              <PromptCard
                key={p.title}
                icon={p.icon}
                title={p.title}
                description={p.description}
                delayIndex={i}
                onClick={() => usePrompt(p.prompt)}
              />
            ))}
          </div>
        </div>
      )}

      {(started || response || loading) && (
        <div className="mx-auto max-w-3xl animate-fade-up">
          <div className="mb-4 rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              You asked
            </p>
            <p className="mt-1 text-sm font-medium text-ink">{message}</p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                style={{ background: LOGO_GRADIENT }}
              >
                <HiOutlineSparkles className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm font-semibold text-ink">LeadFlow Expert</p>
              {loading && (
                <span className="text-[12px] text-ink-muted">Thinking…</span>
              )}
            </div>

            {loading && !response && (
              <div className="space-y-2 py-2">
                <div className="shimmer-bar h-3 w-full rounded" />
                <div className="shimmer-bar h-3 w-5/6 rounded" />
                <div className="shimmer-bar h-3 w-4/6 rounded" />
              </div>
            )}

            {response && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {response}
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {response && !loading && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(response)}
                >
                  <HiOutlineClipboardDocument className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => ask(true)}
                >
                  <HiOutlineBookmark className="h-3.5 w-3.5" /> Save to Scripts
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStarted(false);
                    setResponse("");
                    setMessage("");
                    setError("");
                  }}
                >
                  New chat
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto mt-8 max-w-3xl animate-slide-right">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-white p-2 shadow-[0_8px_30px_rgba(123,31,162,0.08)] sm:p-3">
          <Textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(false);
              }
            }}
            placeholder="Ask anything about contractor leads, marketing, funnels, or your account…"
            className="min-h-[52px] max-h-36 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            onClick={() => ask(false)}
            disabled={loading || !message.trim()}
            className="h-11 w-11 shrink-0 rounded-xl p-0 text-white"
            style={{ background: LOGO_GRADIENT }}
            aria-label="Send"
          >
            <HiOutlineArrowUp className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Enter to send · Shift+Enter for new line ·{" "}
          <Link href="/settings" className="text-brand-600 hover:underline">
            Update profile
          </Link>
        </p>
      </div>
    </div>
  );
}
