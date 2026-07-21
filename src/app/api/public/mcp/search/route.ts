import { handlePublicSearch } from "@/lib/public-search";

export async function POST(request: Request) {
  return handlePublicSearch(request, "mcp");
}
