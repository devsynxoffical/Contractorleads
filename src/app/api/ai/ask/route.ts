import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getSessionUser, buildBusinessContext } from "@/lib/auth";
import {
  ASK_EXPERT_SYSTEM_PROMPT,
  SUPPORT_BOT_SYSTEM_PROMPT,
  CREDIT_COSTS,
} from "@/lib/constants";
import { deductCredits, logActivity } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { message, save, support } = await request.json();
  if (!message?.trim()) {
    return new Response("Message required", { status: 400 });
  }

  const isSupport = support === true;
  const apiKey = process.env.OPENAI_API_KEY;

  // Support/help chat is free and never saved as a script
  if (isSupport) {
    if (!apiKey) {
      return Response.json({
        content:
          "Here are quick fixes for common issues:\n\n• No leads found — try a bigger city, another industry, or Entire country scope.\n• Out of credits — upgrade under Plans & Billing.\n• Search errors — the Google Places API key may not be configured yet.\n\nStill stuck? Contact the team with a screenshot of the error.",
      });
    }
    const openaiSupport = createOpenAI({ apiKey });
    const supportResult = streamText({
      model: openaiSupport("gpt-4o-mini"),
      system: SUPPORT_BOT_SYSTEM_PROMPT,
      prompt: message,
    });
    return supportResult.toTextStreamResponse();
  }

  try {
    await deductCredits(user.id, CREDIT_COSTS.assistant, "ai_assistant");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INSUFFICIENT_CREDITS") {
      return new Response("Insufficient credits", { status: 402 });
    }
    return new Response("Credit error", { status: 500 });
  }

  const businessContext = buildBusinessContext(user);

  if (!apiKey) {
    const fallback = `Here's a direct take for ${user.companyName || "your agency"}:

Focus on a single home-service niche in one metro first. Your offer should promise booked estimates, not "more leads." Lead with a hook like: "Your competitors are buying the ZIP codes you sleep on."

For ${user.idealCustomer || "contractors"}, pitch a 14-day sprint: audit → creative → launch → optimize. CTA: "Reply YES for a 15-min fit call this week."`;

    if (save) {
      await prisma.script.create({
        data: {
          userId: user.id,
          type: "ask_expert_answer",
          title: message.slice(0, 60),
          content: fallback,
        },
      });
    }

    await logActivity(user.id, "ai", "Ask Expert response generated");
    return Response.json({ content: fallback, creditsRemaining: user.creditsRemaining - CREDIT_COSTS.assistant });
  }

  const openai = createOpenAI({ apiKey });
  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: `${ASK_EXPERT_SYSTEM_PROMPT}\n\nUser business profile:\n${businessContext}`,
    prompt: message,
    onFinish: async ({ text }) => {
      if (save) {
        await prisma.script.create({
          data: {
            userId: user.id,
            type: "ask_expert_answer",
            title: message.slice(0, 60),
            content: text,
          },
        });
      }
      await logActivity(user.id, "ai", "Ask Expert response generated");
    },
  });

  return result.toTextStreamResponse();
}
