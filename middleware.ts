import { type NextRequest, NextResponse } from "next/server";
import { ensureUserCredits } from "@/lib/credits/server";
import { ensureUserProfile } from "@/lib/subscription";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname.startsWith("/dashboard")) {
    try {
      await ensureUserProfile(user.id, user.email, supabase);
      await ensureUserCredits(user.id, supabase);
    } catch (error) {
      console.error("Failed to ensure user profile/credits:", error);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
