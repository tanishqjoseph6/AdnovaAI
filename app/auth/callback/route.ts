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
import type { EmailOtpType } from "@supabase/supabase-js";

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

function appendRecoveryFlowParam(path: string): string {
  if (path !== "/reset-password") {
    return path;
  }

  return `${path}?${new URLSearchParams({ recovery: "1" }).toString()}`;
}

function resolveCallbackRedirectPath(safeNext: string): string {
  return appendRecoveryFlowParam(safeNext);
}

function resolveTokenHashOtpType(
  type: string | null
): EmailOtpType | null {
  if (type === "recovery" || type === "signup" || type === "email") {
    return type;
  }

  if (type === "magiclink") {
    return "email";
  }

  return null;
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

  if (tokenHash) {
    const otpType = resolveTokenHashOtpType(type);
    if (!otpType) {
      authWarn("auth_callback", "Unsupported token_hash type", { type, origin });
    } else {
      const redirectPath = resolveCallbackRedirectPath(safeNext);
      const response = NextResponse.redirect(`${origin}${redirectPath}`);
      const supabase = createCallbackSupabase(request, response);
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType,
      });

      if (!error) {
        authLog("auth_callback", "Session established via token_hash", {
          type: otpType,
          next: redirectPath,
          origin,
        });
        return response;
      }

      authError("auth_callback", "token_hash verification failed", {
        type: otpType,
        error: error.message,
        next: redirectPath,
      });

      if (otpType === "recovery") {
        return NextResponse.redirect(
          `${origin}/reset-password?error=${encodeURIComponent(RESET_LINK_EXPIRED_MESSAGE)}`
        );
      }
    }
  }

  if (code) {
    const redirectPath = resolveCallbackRedirectPath(safeNext);
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    const supabase = createCallbackSupabase(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      authLog("auth_callback", "Session established", {
        next: redirectPath,
        origin,
        isRecovery,
      });
      return response;
    }

    authError("auth_callback", "Code exchange failed", {
      error: error.message,
      next: redirectPath,
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
