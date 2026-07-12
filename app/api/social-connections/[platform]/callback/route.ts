import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertSocialConnection } from "@/lib/social-scheduler/connections-server";
import {
  buildOAuthCallbackUrl,
  decodeOAuthCookie,
  getOAuthCookieName,
  getSiteOrigin,
} from "@/lib/social-scheduler/oauth";
import { getAvailableProvider } from "@/lib/social-scheduler/providers/registry";
import { isAvailablePlatform } from "@/lib/social-scheduler/types";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

function redirectWithStatus(
  returnTo: string,
  status: "success" | "error",
  message?: string
) {
  const url = new URL(returnTo, getSiteOrigin());
  url.searchParams.set("connection", status);
  if (message) {
    url.searchParams.set("message", message);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request, context: RouteContext) {
  const { platform } = await context.params;
  const cookieStore = await cookies();
  const oauthState = decodeOAuthCookie(cookieStore.get(getOAuthCookieName())?.value);
  cookieStore.delete(getOAuthCookieName());

  const returnTo = oauthState?.returnTo ?? "/dashboard/social-scheduler";

  try {
    if (!isAvailablePlatform(platform)) {
      return redirectWithStatus(returnTo, "error", "Invalid platform.");
    }

    const url = new URL(request.url);
    const error = url.searchParams.get("error");
    if (error) {
      return redirectWithStatus(
        returnTo,
        "error",
        url.searchParams.get("error_description") ?? "Authorization was denied."
      );
    }

    const code = url.searchParams.get("code");
    if (!code || !oauthState || oauthState.platform !== platform) {
      return redirectWithStatus(
        returnTo,
        "error",
        "OAuth session expired. Please try again."
      );
    }

    const provider = getAvailableProvider(platform);
    const redirectUri = buildOAuthCallbackUrl(platform);
    const tokens = await provider.exchangeCode({
      code,
      codeVerifier: oauthState.codeVerifier,
      redirectUri,
    });
    const profile = await provider.fetchProfile(tokens.accessToken);

    await upsertSocialConnection(oauthState.userId, platform, tokens, profile);

    return redirectWithStatus(returnTo, "success");
  } catch (error) {
    console.error("Social OAuth callback error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to complete account connection.";

    return redirectWithStatus(returnTo, "error", message);
  }
}
