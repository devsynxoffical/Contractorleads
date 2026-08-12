import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getSessionUser, buildBusinessContext } from "@/lib/auth";
import { buildWorkspaceDataContext } from "@/lib/ai-user-context";
import { buildKnowledgeContext } from "@/lib/ai-knowledge";
import {
  getAiBrain,
  effectiveBrain,
  resolvePrompt,
  globalInstructionsBlock,
  customKnowledgeBlock,
} from "@/lib/ai-config";
import {
  ASK_EXPERT_SYSTEM_PROMPT,
  SUPPORT_BOT_SYSTEM_PROMPT,
  CREDIT_COSTS,
} from "@/lib/constants";
import { deductCredits, logActivity } from "@/lib/credits";
import { getOpenAIApiKey } from "@/lib/openai-config";
import { prisma } from "@/lib/prisma";

function titleFromMessage(message: string) {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= 48) return clean || "New chat";
  return `${clean.slice(0, 45)}…`;
}

/**
 * Grounded fallback used when no OpenAI key is configured. Answers from the
 * platform's own Academy knowledge instead of firing a canned marketing pitch
 * that ignores the question.
 */
function groundedFallback(
  message: string,
  knowledge: string,
  displayName: string,
) {
  const asked = message.trim().slice(0, 160);
  if (knowledge.trim()) {
    return `Hi ${displayName} — here's what the platform help center says for "${asked}":

${knowledge.trim()}

Still stuck? Search more guides in [Academy](/academy) or message the team.`;
  }
  return `Hi ${displayName} — I couldn't find a help-center match for "${asked}". Try searching the [Academy](/academy) for how-to guides, or rephrase your question with more detail and I'll point you to the right screen.`;
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
  const apiKey = await getOpenAIApiKey();
  const brain = effectiveBrain(await getAiBrain());
  const knowledge = buildKnowledgeContext(message);
  const extraKnowledge = customKnowledgeBlock(brain);
  const displayName =
    user.name || user.ownerName || user.companyName || "there";

  // Support/help chat is free and never saved as a script
  if (isSupport) {
    if (!apiKey) {
      return Response.json({
        content: groundedFallback(message, knowledge, displayName),
      });
    }
    const openaiSupport = createOpenAI({ apiKey });
    const supportBase = resolvePrompt(
      brain,
      "supportBotPrompt",
      SUPPORT_BOT_SYSTEM_PROMPT,
    );
    const supportSystem = [
      supportBase,
      globalInstructionsBlock(brain),
      knowledge ? `\n${knowledge}` : "",
      extraKnowledge,
    ]
      .filter(Boolean)
      .join("");
    const supportResult = streamText({
      model: openaiSupport(brain?.model ?? "gpt-4o-mini"),
      system: supportSystem,
      prompt: message,
    });
    return supportResult.toTextStreamResponse();
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

  if (!apiKey) {
    const fallback = groundedFallback(message, knowledge, displayName);

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
        creditsRemaining: user.creditsRemaining,
      },
      { headers: { "X-Conversation-Id": chatId } },
    );
  }

  let balance: number;
  try {
    balance = await deductCredits(
      user.id,
      CREDIT_COSTS.assistant,
      "ai_assistant",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "INSUFFICIENT_CREDITS") {
      return new Response("Insufficient credits", { status: 402 });
    }
    return new Response("Credit error", { status: 500 });
  }

  const businessContext = buildBusinessContext(user);
  const workspaceContext = await buildWorkspaceDataContext(user.id);
  const askBase = resolvePrompt(brain, "askExpertPrompt", ASK_EXPERT_SYSTEM_PROMPT);
  const system = `${askBase}
${globalInstructionsBlock(brain)}

User account & business profile:
${businessContext}

${workspaceContext}

Rules for personalization:
- Use the user's real name when available — never leave blank spots like "Hi ," or "[Name]".
- Ground product answers in their company, services, ICP, markets, and live lead stats when helpful.
- Never claim you "know everything" about them — be helpful, not invasive.
- If profile fields are missing, mention Settings once, then give full in-app steps with action links anyway.
- Every how-to answer must include at least one [Label](/path) action button for the relevant screen.
${knowledge ? `\n${knowledge}` : ""}${extraKnowledge}`;

  const openai = createOpenAI({ apiKey });
  const headers = new Headers({
    "X-Conversation-Id": chatId,
    "X-Credits-Remaining": String(balance),
  });
  const result = streamText({
    model: openai(brain?.model ?? "gpt-4o-mini"),
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
