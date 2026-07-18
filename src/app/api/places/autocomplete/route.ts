import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { autocompletePlaces } from "@/lib/services/places-autocomplete";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() ?? "US";

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await autocompletePlaces({ query: q, country });
  return NextResponse.json({ suggestions });
}
