import { NextResponse } from "next/server";
import { RESET_LINK_EXPIRED_MESSAGE } from "@/lib/auth/password-reset";
import { resolveSafeAuthRedirect } from "@/lib/auth/safe-redirect";
import { resolveSiteOrigin } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const safeNext = resolveSafeAuthRedirect(nextParam);
  const origin = resolveSiteOrigin(new URL(request.url).origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.info("[auth/callback] Session established", { next: safeNext });
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    console.error("[auth/callback] Code exchange failed:", error.message);

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

  console.warn("[auth/callback] Redirecting to fallback", {
    path: fallbackPath,
    reason: fallbackMessage,
  });

  return NextResponse.redirect(
    `${origin}${fallbackPath}?error=${encodeURIComponent(fallbackMessage)}`
  );
}
