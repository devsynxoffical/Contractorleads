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

function titleFromMessage(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= 48) return clean || "New chat";
  return `${clean.slice(0, 45)}…`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { message, save, support, conversationId } = body;
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

  let chatId: string | null =
    typeof conversationId === "string" && conversationId.trim()
      ? conversationId.trim()
      : null;

  if (chatId) {
    const owned = await prisma.aiConversation.findFirst({
      where: { id: chatId, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      return new Response("Conversation not found", { status: 404 });
    }
  } else {
    const created = await prisma.aiConversation.create({
      data: {
        userId: user.id,
        title: titleFromMessage(message),
      },
      select: { id: true },
    });
    chatId = created.id;
  }

  await prisma.aiMessage.create({
    data: {
      conversationId: chatId,
      role: "user",
      content: message.trim(),
    },
  });

  const prior = await prisma.aiMessage.findMany({
    where: { conversationId: chatId },
    orderBy: { createdAt: "asc" },
    take: 24,
    select: { role: true, content: true },
  });

  const historyMessages = prior.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const businessContext = buildBusinessContext(user);
  const system = `${ASK_EXPERT_SYSTEM_PROMPT}\n\nUser business profile:\n${businessContext}`;

  const headers = new Headers({
    "X-Conversation-Id": chatId,
  });

  if (!apiKey) {
    const fallback = `Here's a direct take for ${user.companyName || "your agency"}:

Focus on a single home-service niche in one metro first. Your offer should promise booked estimates, not "more leads." Lead with a hook like: "Your competitors are buying the ZIP codes you sleep on."

For ${user.idealCustomer || "contractors"}, pitch a 14-day sprint: audit → creative → launch → optimize. CTA: "Reply YES for a 15-min fit call this week."`;

    await prisma.aiMessage.create({
      data: {
        conversationId: chatId,
        role: "assistant",
        content: fallback,
      },
    });
    await prisma.aiConversation.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

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
    return Response.json(
      {
        content: fallback,
        conversationId: chatId,
        creditsRemaining: user.creditsRemaining - CREDIT_COSTS.assistant,
      },
      { headers },
    );
  }

  const openai = createOpenAI({ apiKey });
  const result = streamText({
    model: openai("gpt-4o-mini"),
    system,
    messages: historyMessages,
    onFinish: async ({ text }) => {
      await prisma.aiMessage.create({
        data: {
          conversationId: chatId!,
          role: "assistant",
          content: text,
        },
      });
      await prisma.aiConversation.update({
        where: { id: chatId! },
        data: {
          updatedAt: new Date(),
          ...(prior.filter((m) => m.role === "user").length <= 1
            ? { title: titleFromMessage(message) }
            : {}),
        },
      });
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

  return result.toTextStreamResponse({ headers });
}
