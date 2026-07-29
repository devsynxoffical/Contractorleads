import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { appBaseUrl } from "@/lib/email-brand";
import {
  completeFacebookOAuth,
  parseFacebookOAuthState,
} from "@/lib/facebook-oauth";

function requestBase(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return appBaseUrl();
  }
}

function redirectToFacebook(
  request: Request,
  query: Record<string, string>,
) {
  const url = new URL("/facebook", requestBase(request));
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");
  const base = requestBase(request);

  if (oauthError) {
    return redirectToFacebook(request, {
      error: oauthErrorDesc || oauthError || "Facebook login was cancelled",
    });
  }

  if (!code || !state) {
    return redirectToFacebook(request, { error: "Missing Facebook login code" });
  }

  const user = await getSessionUser();
  if (!user) {
    const login = new URL("/login", base);
    login.searchParams.set("next", "/facebook");
    return NextResponse.redirect(login);
  }

  const parsed = parseFacebookOAuthState(state);
  if (!parsed || parsed.userId !== user.id) {
    return redirectToFacebook(request, {
      error: "Facebook login expired. Try connecting again.",
    });
  }

  try {
    await completeFacebookOAuth({
      userId: user.id,
      code,
      state,
      baseUrl: base,
    });
    return redirectToFacebook(request, { connected: "1" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Facebook connection failed";
    return redirectToFacebook(request, { error: message });
  }
}
