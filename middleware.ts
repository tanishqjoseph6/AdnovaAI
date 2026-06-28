import { type NextRequest, NextResponse } from "next/server";
import { isEmailVerified } from "@/lib/auth/email-verified";
import { ensureUserCredits } from "@/lib/credits/server";
import { ensureUserProfile } from "@/lib/subscription";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/dashboard");
  const isVerifyEmail = pathname === "/verify-email";

  if (!user && isDashboard) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isVerifyEmail && isEmailVerified(user)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && isDashboard && !isEmailVerified(user)) {
    const url = request.nextUrl.clone();
    url.pathname = "/verify-email";
    return NextResponse.redirect(url);
  }

  if (user && isDashboard && isEmailVerified(user)) {
    try {
      await ensureUserProfile(user.id, user.email, supabase);
      await ensureUserCredits(user.id, supabase, {
        emailVerified: true,
        email: user.email,
      });
    } catch (error) {
      console.error("Failed to ensure user profile/credits:", error);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/verify-email"],
};
