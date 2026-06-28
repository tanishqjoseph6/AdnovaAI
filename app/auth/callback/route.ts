import { NextResponse } from "next/server";
import { RESET_LINK_EXPIRED_MESSAGE } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const safeNext = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${origin}${safeNext}`);
    }

    console.error("Auth callback error:", error.message);

    if (next === "/reset-password") {
      return NextResponse.redirect(
        `${origin}/reset-password?error=${encodeURIComponent(RESET_LINK_EXPIRED_MESSAGE)}`
      );
    }
  }

  const fallbackMessage =
    next === "/reset-password"
      ? RESET_LINK_EXPIRED_MESSAGE
      : "Email verification failed. Please try again or request a new link.";

  const fallbackPath =
    next === "/reset-password" ? "/reset-password" : "/login";

  return NextResponse.redirect(
    `${origin}${fallbackPath}?error=${encodeURIComponent(fallbackMessage)}`
  );
}
