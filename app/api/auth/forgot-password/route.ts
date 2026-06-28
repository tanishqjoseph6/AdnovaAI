import { NextResponse } from "next/server";
import {
  FORGOT_PASSWORD_RESPONSE_MESSAGE,
  getPasswordResetRedirectUrl,
} from "@/lib/auth/password-reset";
import {
  buildRateLimitBucketKey,
  getClientIp,
} from "@/lib/auth/rate-limit-config";
import { withAuthRateLimits } from "@/lib/auth/rate-limit-response";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

function forgotPasswordResponse() {
  return NextResponse.json({
    success: true,
    message: FORGOT_PASSWORD_RESPONSE_MESSAGE,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const normalized = normalizeEmail(email);

    if (!isValidEmail(normalized)) {
      return forgotPasswordResponse();
    }

    const ip = getClientIp(request);
    const rateLimited = await withAuthRateLimits([
      {
        action: "forgot_password",
        bucketKey: buildRateLimitBucketKey("email", normalized),
      },
      {
        action: "forgot_password",
        bucketKey: buildRateLimitBucketKey("ip", ip),
      },
    ]);

    if (rateLimited) {
      return rateLimited;
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: getPasswordResetRedirectUrl(origin),
    });

    if (error) {
      console.warn("Password reset request was not delivered:", error.message);
      return forgotPasswordResponse();
    }

    return forgotPasswordResponse();
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Unable to send reset email. Please try again." },
      { status: 500 }
    );
  }
}
