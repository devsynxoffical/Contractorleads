import { prisma } from "@/lib/prisma";

/** Models the admin may pick for chat + outreach (unknown values fall back). */
export const AI_MODEL_OPTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1",
] as const;

export type AiBrain = {
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

const DEFAULT_BRAIN: AiBrain = {
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

function validModel(value: string | null | undefined, fallback: string): string {
  if (
    typeof value === "string" &&
    (AI_MODEL_OPTIONS as readonly string[]).includes(value)
  ) {
    return value;
  }
  return fallback;
}

/** Load the admin AI brain, falling back to defaults on any DB hiccup. */
export async function getAiBrain(): Promise<AiBrain> {
  try {
    const row = await prisma.aiBrainConfig.findUnique({
      where: { id: "default" },
    });
    if (!row) return DEFAULT_BRAIN;
    return {
      enabled: row.enabled,
      globalInstructions: row.globalInstructions,
      knowledgeBase: row.knowledgeBase,
      askExpertPrompt: row.askExpertPrompt,
      supportBotPrompt: row.supportBotPrompt,
      emailPrompt: row.emailPrompt,
      smsPrompt: row.smsPrompt,
      followupPrompt: row.followupPrompt,
      salesScriptPrompt: row.salesScriptPrompt,
      model: validModel(row.model, "gpt-4o-mini"),
      outreachModel: validModel(row.outreachModel, "gpt-4o-mini"),
    };
  } catch {
    return DEFAULT_BRAIN;
  }
}

/** The brain only applies when the master switch is on. */
export function effectiveBrain(brain: AiBrain): AiBrain | null {
  return brain.enabled ? brain : null;
}

/** Default cold-outreach instructions per type, keyed like the API route. */
export const DEFAULT_OUTREACH_PROMPTS: Record<string, string> = {
  email: [
    "Write a cold email TO the contractor / business owner.",
    "Format: first line exactly 'Subject: <subject>', then a blank line, then the body only (no Body: label).",
    "Length: 90–140 words. 3–5 short paragraphs max.",
    "Structure: specific observation → why it costs them jobs → what we do → one soft CTA for a short call.",
    "Subject line: curiosity + local/trade specificity, under 8 words when possible.",
  ].join(" "),
  sms: [
    "Write a cold SMS TO the contractor / business owner.",
    "Plain text only — no Subject line, no markdown.",
    "Hard cap: under 280 characters (preferably under 160).",
    "One observation, one benefit, one easy reply CTA (e.g. reply YES or call).",
  ].join(" "),
  followup: [
    "Write a follow-up email for a contractor who did not reply to a prior outreach.",
    "Format: first line exactly 'Subject: <subject>', then a blank line, then the body only.",
    "Length: 70–110 words. Acknowledge the prior note briefly, add one new concrete reason to talk, one soft CTA.",
    "Do not guilt-trip or pressure.",
  ].join(" "),
  sales_script: [
    "Write a full phone sales script for calling this contractor.",
    "Include: opener, permission question, value pitch tied to their trade/city, 3 common objections with responses, and a clear close for a 15-min meeting.",
    "Plain text. Use short speaker labels like Rep: and Prospect: where helpful.",
  ].join(" "),
};

/** Override prompt for a feature if one was configured. */
export function resolvePrompt(
  brain: AiBrain | null,
  field:
    | "askExpertPrompt"
    | "supportBotPrompt"
    | "emailPrompt"
    | "smsPrompt"
    | "followupPrompt"
    | "salesScriptPrompt",
  fallback: string,
): string {
  const custom = brain?.[field]?.trim();
  return custom && custom.length > 0 ? custom : fallback;
}

/** Global instructions block appended to the top of a built system prompt. */
export function globalInstructionsBlock(
  brain: AiBrain | null,
): string {
  const text = brain?.globalInstructions?.trim();
  if (!text) return "";
  return `\nCUSTOM PLATFORM INSTRUCTIONS (follow these above everything else):\n${text}`;
}

/** Custom knowledge block injected into chat/support system prompts. */
export function customKnowledgeBlock(brain: AiBrain | null): string {
  const text = brain?.knowledgeBase?.trim();
  if (!text) return "";
  return `\nCUSTOM KNOWLEDGE BASE (the platform owner's facts and rules — prefer this when it covers the question):\n${text}`;
}
