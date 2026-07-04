import { NextResponse } from "next/server";
import { RESET_LINK_EXPIRED_MESSAGE } from "@/lib/auth/password-reset";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
import { resolveSafeAuthRedirect } from "@/lib/auth/safe-redirect";
import { getProductionSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const safeNext = resolveSafeAuthRedirect(nextParam);
  const origin = getProductionSiteUrl();

  authLog("auth_callback", "Auth callback received", {
    hasCode: Boolean(code),
    next: safeNext,
    origin,
  });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      authLog("auth_callback", "Session established", { next: safeNext, origin });
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    authError("auth_callback", "Code exchange failed", {
      error: error.message,
      next: safeNext,
    });

    if (safeNext === "/reset-password") {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(RESET_LINK_EXPIRED_MESSAGE)}`
      );
    }
  }

  const fallbackMessage =
    safeNext === "/reset-password"
      ? RESET_LINK_EXPIRED_MESSAGE
      : "Email verification failed. Please try again or request a new link.";

  const fallbackPath =
    safeNext === "/reset-password" ? "/reset-password" : "/login";

  authWarn("auth_callback", "Redirecting to fallback", {
    path: fallbackPath,
    reason: fallbackMessage,
    origin,
  });

  return NextResponse.redirect(
    `${origin}${fallbackPath}?error=${encodeURIComponent(fallbackMessage)}`
  );
}
