import { NextResponse } from "next/server";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
import { getAuthCallbackUrl } from "@/lib/auth/redirects";
import {
  buildRateLimitBucketKey,
  getClientIp,
} from "@/lib/auth/rate-limit-config";
import { withAuthRateLimits } from "@/lib/auth/rate-limit-response";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const emailFromBody =
      typeof body?.email === "string" ? normalizeEmail(body.email) : null;

    const email = user?.email ? normalizeEmail(user.email) : emailFromBody;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const rateLimited = await withAuthRateLimits([
      {
        action: "resend_verification",
        bucketKey: buildRateLimitBucketKey("email", email),
      },
      {
        action: "resend_verification",
        bucketKey: buildRateLimitBucketKey("ip", ip),
      },
    ]);

    if (rateLimited) {
      return rateLimited;
    }

    const emailRedirectTo = getAuthCallbackUrl("/dashboard");

    authLog("resend_verification", "Resend verification requested", {
      email,
      emailRedirectTo,
      ip,
    });

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      authWarn("resend_verification", "Resend verification failed", {
        email,
        error: error.message,
      });
      return NextResponse.json(
        { error: mapAuthErrorMessage(error.message) },
        { status: 400 }
      );
    }

    authLog("resend_verification", "Verification email dispatched", { email });

    return NextResponse.json({
      success: true,
      message: "✅ Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    authError("resend_verification", "Unexpected resend verification error", {
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unable to resend verification email. Please try again." },
      { status: 500 }
    );
  }
}
