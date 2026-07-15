import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, logActivity } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/constants";
import { runLeadPipeline } from "@/lib/services/lead-pipeline";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { industry, state, city, zip, radius } = body;

    if (!industry || !state || !radius) {
      return NextResponse.json(
        { error: "Industry, state, and radius are required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Places API key not configured. Add GOOGLE_PLACES_API_KEY to your environment.",
        },
        { status: 503 }
      );
    }

    const result = await runLeadPipeline({
      userId: user.id,
      industry,
      state,
      city,
      zip,
      radius: Number(radius),
    });

    // Only charge when Places returned something usable or an empty-but-valid result
    await deductCredits(user.id, CREDIT_COSTS.lead, "lead_generation");

    await logActivity(
      user.id,
      "search",
      `Generated ${result.leads.length} leads for ${industry} in ${state}`,
      { searchId: result.search.id }
    );

    const credits = await prisma.user.findUnique({
      where: { id: user.id },
      select: { creditsRemaining: true },
    });

    return NextResponse.json({
      search: result.search,
      leads: result.leads,
      creditsRemaining: credits?.creditsRemaining,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    if (message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        { error: "Insufficient credits. Upgrade your plan to continue." },
        { status: 402 }
      );
    }
    const isPlaces =
      err instanceof Error &&
      (err.name === "GooglePlacesError" ||
        message.includes("Google Places") ||
        message.includes("Billing"));
    return NextResponse.json(
      { error: message },
      { status: isPlaces ? 503 : 500 }
    );
  }
}
