import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { requireFeatureAccess } from "@/lib/billing/plan-access";
import {
  buildOAuthCallbackUrl,
  encodeOAuthCookie,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
  getOAuthCookieName,
} from "@/lib/social-scheduler/oauth";
import {
  getSocialOAuthStatus,
  isPlatformOAuthConfigured,
} from "@/lib/social-scheduler/oauth-config";
import { getAvailableProvider } from "@/lib/social-scheduler/providers/registry";
import { isAvailablePlatform } from "@/lib/social-scheduler/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ platform: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { platform } = await context.params;

    if (!isAvailablePlatform(platform)) {
      return NextResponse.json(
        { error: "This platform is not available yet." },
        { status: 400 }
      );
    }

    const oauthStatus = getSocialOAuthStatus();
    if (!isPlatformOAuthConfigured(platform, oauthStatus)) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/social-scheduler?connection=error&message=${encodeURIComponent("OAuth is not configured.")}`,
          request.url
        )
      );
    }

    const supabase = await createClient();
    const authResult = await requireAuthenticatedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const featureResult = await requireFeatureAccess(
      supabase,
      authResult.user.id,
      "social_scheduler"
    );
    if ("response" in featureResult) {
      return featureResult.response;
    }

    const provider = getAvailableProvider(platform);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateOAuthState();
    const redirectUri = buildOAuthCallbackUrl(platform);
    const returnTo =
      new URL(request.url).searchParams.get("returnTo") ??
      "/dashboard/social-scheduler";

    const cookieStore = await cookies();
    cookieStore.set(getOAuthCookieName(), encodeOAuthCookie({
      platform,
      userId: authResult.user.id,
      codeVerifier,
      returnTo,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    const authorizeUrl = provider.buildAuthorizeUrl({
      state,
      codeChallenge,
      redirectUri,
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    console.error("Social OAuth authorize error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to start account connection.";

    return NextResponse.redirect(
      new URL(
        `/dashboard/social-scheduler?connection=error&message=${encodeURIComponent(message)}`,
        request.url
      )
    );
  }
}
