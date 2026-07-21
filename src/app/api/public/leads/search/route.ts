import {
  handlePublicPing,
  handlePublicSearch,
  publicOptionsResponse,
} from "@/lib/public-search";

export async function OPTIONS() {
  return publicOptionsResponse();
}

/** Auth/docs check — does not consume quota or run a search. */
export async function GET(request: Request) {
  return handlePublicPing(request, "api");
}

export async function POST(request: Request) {
  return handlePublicSearch(request, "api");
}
