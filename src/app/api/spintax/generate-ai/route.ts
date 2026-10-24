import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOpenAIApiKey } from "@/lib/openai-config";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const originalText = (body.text || "").trim();

  if (!originalText || originalText.length < 5) {
    return NextResponse.json({ error: "Please provide a valid sentence to rewrite" }, { status: 400 });
  }

  const apiKey = await getOpenAIApiKey();

  if (apiKey) {
    try {
      const openai = createOpenAI({ apiKey });
      const prompt = `You are a cold email deliverability and copywriting expert.
Given this single sentence or short phrase from a cold email:
"${originalText}"

Generate exactly 2 high-converting, natural alternative phrasings that mean the exact same thing but use different vocabulary and sentence structures so spam filters see them as distinct.
Keep any variables like {{firstName}}, {{businessName}}, {{city}} intact.
Return ONLY a valid JSON array of 2 strings, e.g. ["Option 2 phrasing", "Option 3 phrasing"].`;

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
      });

      const parsed = JSON.parse(result.text.trim().replace(/```json\n?|\n?```/g, ""));
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return NextResponse.json({
          ok: true,
          options: [originalText, parsed[0], parsed[1]],
          spintaxBlock: `{{random|${originalText}|${parsed[0]}|${parsed[1]}}}`,
        });
      }
    } catch {
      // Fallback below
    }
  }

  // Natural fallback if API key is not configured or rate limited
  const option2 = `In regards to ${originalText.toLowerCase().replace(/^(hi|hey|hello|we|i)\s+/i, "")}`;
  const option3 = `Reaching out because ${originalText.toLowerCase().replace(/^(hi|hey|hello|we|i)\s+/i, "")}`;

  return NextResponse.json({
    ok: true,
    options: [originalText, option2, option3],
    spintaxBlock: `{{random|${originalText}|${option2}|${option3}}}`,
  });
}
