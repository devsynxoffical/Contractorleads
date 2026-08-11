"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { AI_MODEL_OPTIONS } from "@/lib/ai-config";

type BrainConfig = {
  enabled: boolean;
  globalInstructions: string;
  knowledgeBase: string;
  askExpertPrompt: string | null;
  supportBotPrompt: string | null;
  emailPrompt: string | null;
  smsPrompt: string | null;
  followupPrompt: string | null;
  salesScriptPrompt: string | null;
  model: string;
  outreachModel: string;
};

const EMPTY: BrainConfig = {
  enabled: true,
  globalInstructions: "",
  knowledgeBase: "",
  askExpertPrompt: null,
  supportBotPrompt: null,
  emailPrompt: null,
  smsPrompt: null,
  followupPrompt: null,
  salesScriptPrompt: null,
  model: "gpt-4o-mini",
  outreachModel: "gpt-4o-mini",
};

type PromptField = Exclude<
  keyof BrainConfig,
  "enabled" | "model" | "outreachModel"
>;

const PROMPT_FIELDS: Array<{
  key: PromptField;
  label: string;
  description: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "globalInstructions",
    label: "Global instructions",
    description:
      "Rules injected into EVERY AI feature (chat, support, email, SMS, follow-ups, sales scripts). The highest-priority layer — use it for platform rules, tone, disclaimers, banned topics, and how the AI must treat your users.",
    placeholder:
      "Always answer as the Contractor Leads team.\nNever promise features we don't have.\nKeep replies under 150 words unless asked for detail.\nFor pricing, always point to /billing.",
    rows: 4,
  },
  {
    key: "knowledgeBase",
    label: "Knowledge base",
    description:
      "Your own facts and answers. Injected into Ask Expert and the support chat whenever the question is relevant, so replies stop being generic.",
    placeholder:
      "Q: What does the Starter plan cost?\nA: $19.99/month and includes 100 lead credits.\n\nQ: How do I reset my password?\nA: /forgot-password — a link expires in 1 hour.",
    rows: 5,
  },
  {
    key: "askExpertPrompt",
    label: "Ask Expert — system prompt",
    description:
      "Replaces the built-in coaching/assistant prompt. Leave blank to use the default.",
    placeholder: "You are the in-app AI assistant for Contractor Leads…",
    rows: 6,
  },
  {
    key: "supportBotPrompt",
    label: "Support bot — system prompt",
    description:
      "Replaces the built-in in-app support assistant prompt. Leave blank to use the default.",
    placeholder: "You are the friendly in-app support assistant…",
    rows: 6,
  },
  {
    key: "emailPrompt",
    label: "Cold email — system prompt",
    description:
      "Trains the Outreach Studio email generator. Controls structure, length, tone, and CTA rules for cold emails.",
    placeholder: "Write a cold email TO the contractor / business owner…",
    rows: 5,
  },
  {
    key: "smsPrompt",
    label: "SMS — system prompt",
    description:
      "Trains the Outreach Studio SMS generator. Keep strict on length limits.",
    placeholder: "Write a cold SMS TO the contractor / business owner…",
    rows: 4,
  },
  {
    key: "followupPrompt",
    label: "Follow-up email — system prompt",
    description:
      "Trains the follow-up email generator for leads that didn't reply.",
    placeholder: "Write a follow-up email for a contractor who did not reply…",
    rows: 4,
  },
  {
    key: "salesScriptPrompt",
    label: "Phone sales script — system prompt",
    description:
      "Trains the sales script generator for calling a contractor.",
    placeholder: "Write a full phone sales script for calling this contractor…",
    rows: 4,
  },
];

export default function AdminAiTrainingPage() {
  const [config, setConfig] = useState<BrainConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/ai");
      const data = await res.json();
      if (data.config) setConfig({ ...EMPTY, ...data.config });
    } catch {
      setError("Could not load AI training settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function setField<K extends keyof BrainConfig>(key: K, value: BrainConfig[K]) {
    setConfig((c) => ({ ...c, [key]: value }));
    setMessage(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setConfig({ ...EMPTY, ...data.config });
      setMessage("AI brain saved. New answers will follow it immediately.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function resetField(key: PromptField) {
    if (key === "globalInstructions" || key === "knowledgeBase") {
      setField(key, "");
    } else {
      setField(key, null);
    }
  }

  function currentValue(key: PromptField): string {
    return config[key] ?? "";
  }

  return (
    <div>
      <AdminPageHeader
        title="AI Training"
        description="Teach the built-in AI to answer accurately for YOUR platform: custom instructions, your own knowledge base, per-feature system prompts (emails, SMS, sales scripts, chat), and model selection."
      />

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          {message}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-ink-muted animate-pulse">
          Loading AI training settings…
        </p>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <section className="rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Master switch
                </h2>
                <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
                  When on, the custom brain below overrides and enhances the
                  built-in prompts. Turn off to instantly restore factory
                  prompts (your settings are kept).
                </p>
              </div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setField("enabled", e.target.checked)}
                />
                {config.enabled ? "Custom brain ON" : "Using factory prompts"}
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-ink">Models</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
              These are OpenAI models used by the platform. The admin-level
              OpenAI key (OPENAI_API_KEY env var) must exist for the AI to run.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-[12px] font-medium text-ink-muted">
                Chat model (Ask Expert + support)
                <select
                  className="saas-input mt-1.5"
                  value={config.model}
                  onChange={(e) => setField("model", e.target.value)}
                >
                  {AI_MODEL_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[12px] font-medium text-ink-muted">
                Outreach model (email / SMS / script)
                <select
                  className="saas-input mt-1.5"
                  value={config.outreachModel}
                  onChange={(e) => setField("outreachModel", e.target.value)}
                >
                  {AI_MODEL_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {PROMPT_FIELDS.map((field) => {
            const isGlobal = field.key === "globalInstructions";
            const isKnowledge = field.key === "knowledgeBase";
            return (
              <section
                key={field.key}
                className="rounded-2xl border border-border/80 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">
                      {field.label}
                    </h2>
                    <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">
                      {field.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-brand-600 hover:underline"
                    onClick={() => resetField(field.key)}
                  >
                    {isGlobal || isKnowledge
                      ? "Clear"
                      : "Reset to default prompt"}
                  </button>
                </div>
                <textarea
                  className="saas-input mt-3 min-h-[0] w-full resize-y py-2.5 font-mono text-[12px] leading-relaxed"
                  rows={field.rows}
                  value={currentValue(field.key)}
                  onChange={(e) => setField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              </section>
            );
          })}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={busy} disabled={busy}>
              {busy ? "Saving…" : "Save AI brain"}
            </Button>
            <p className="text-[12px] text-ink-faint">
              Saves instantly — no code changes or restarts needed.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
