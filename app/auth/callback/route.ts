import { NextResponse, type NextRequest } from "next/server";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
import { RESET_LINK_EXPIRED_MESSAGE } from "@/lib/auth/password-reset";
import {
  isRecoveryCallback,
  resolvePostAuthRedirect,
} from "@/lib/auth/recovery";
import { resolveSafeAuthRedirect } from "@/lib/auth/safe-redirect";
import { resolveSiteOrigin } from "@/lib/site-url";
import { createServerClient } from "@supabase/ssr";

function createCallbackSupabase(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");
  const origin = resolveSiteOrigin(requestUrl.origin);
  const isRecovery = isRecoveryCallback(searchParams);
  const safeNext = resolveSafeAuthRedirect(
    resolvePostAuthRedirect(nextParam, type, isRecovery ? "/reset-password" : "/dashboard")
  );

  authLog("auth_callback", "Auth callback received", {
    hasCode: Boolean(code),
    hasTokenHash: Boolean(tokenHash),
    type,
    next: safeNext,
    origin,
    isRecovery,
  });

  if (tokenHash && type === "recovery") {
    const response = NextResponse.redirect(`${origin}${safeNext}`);
    const supabase = createCallbackSupabase(request, response);
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (!error) {
      authLog("auth_callback", "Recovery session established via token_hash", {
        next: safeNext,
        origin,
      });
      return response;
    }

    authError("auth_callback", "Recovery token_hash verification failed", {
      error: error.message,
      next: safeNext,
    });

    return NextResponse.redirect(
      `${origin}/reset-password?error=${encodeURIComponent(RESET_LINK_EXPIRED_MESSAGE)}`
    );
  }

  if (code) {
    const response = NextResponse.redirect(`${origin}${safeNext}`);
    const supabase = createCallbackSupabase(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      authLog("auth_callback", "Session established", {
        next: safeNext,
        origin,
        isRecovery,
      });
      return response;
    }

    authError("auth_callback", "Code exchange failed", {
      error: error.message,
      next: safeNext,
    });

    if (safeNext === "/reset-password" || isRecovery) {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(RESET_LINK_EXPIRED_MESSAGE)}`
      );
    }
  }

  const fallbackMessage =
    safeNext === "/reset-password" || isRecovery
      ? RESET_LINK_EXPIRED_MESSAGE
      : "Email verification failed. Please try again or request a new link.";

  const fallbackPath =
    safeNext === "/reset-password" || isRecovery ? "/reset-password" : "/login";

  authWarn("auth_callback", "Redirecting to fallback", {
    path: fallbackPath,
    reason: fallbackMessage,
    origin,
  });

  return NextResponse.redirect(
    `${origin}${fallbackPath}?error=${encodeURIComponent(fallbackMessage)}`
  );
}
