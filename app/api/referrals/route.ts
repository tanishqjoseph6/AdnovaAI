import { NextResponse } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { getReferralStatsSafe } from "@/lib/referrals/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const authResult = await requireVerifiedUser(supabase);
    if ("response" in authResult) {
      return authResult.response;
    }

    const user = authResult.user;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Referral profile lookup failed:", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
      });
    }

    const requestOrigin = new URL(request.url).origin;
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      (requestOrigin.includes("localhost")
        ? requestOrigin
        : "https://useadvora.com");

    const result = await getReferralStatsSafe({
      userId: user.id,
      email: user.email,
      username:
        typeof profile?.username === "string" ? profile.username : null,
      origin,
    });

    if (!result.ok) {
      const status = result.error.code === "migration_required" ? 503 : 500;
      return NextResponse.json(
        {
          stats: null,
          error: result.error,
        },
        { status }
      );
    }

    return NextResponse.json({ stats: result.stats, error: null });
  } catch (error) {
    console.error("Referral stats error:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        stats: null,
        error: {
          code: "unknown",
          message: "Unable to load referral rewards.",
        },
      },
      { status: 500 }
    );
  }
}
