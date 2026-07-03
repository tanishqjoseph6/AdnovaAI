import { NextResponse } from "next/server";
import {
  FORGOT_PASSWORD_ERROR_MESSAGE,
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  getPasswordResetRedirectUrl,
  INVALID_EMAIL_MESSAGE,
} from "@/lib/auth/password-reset";
import {
  buildRateLimitBucketKey,
  getClientIp,
} from "@/lib/auth/rate-limit-config";
import { withAuthRateLimits } from "@/lib/auth/rate-limit-response";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

function forgotPasswordSuccessResponse() {
  return NextResponse.json({
    success: true,
    message: FORGOT_PASSWORD_SUCCESS_MESSAGE,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const normalized = normalizeEmail(email);

    if (!normalized) {
      return NextResponse.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
    }

    if (!isValidEmail(normalized)) {
      console.info("[auth/forgot-password] Invalid email format submitted");
      return NextResponse.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
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

    const redirectTo = getPasswordResetRedirectUrl();
    const supabase = await createClient();

    console.info("[auth/forgot-password] Sending reset email", {
      email: normalized,
      redirectTo,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo,
    });

    if (error) {
      console.warn("[auth/forgot-password] Reset email not delivered:", error.message);
      // Do not reveal whether the account exists.
      return forgotPasswordSuccessResponse();
    }

    console.info("[auth/forgot-password] Reset email dispatched", { email: normalized });
    return forgotPasswordSuccessResponse();
  } catch (error) {
    console.error("[auth/forgot-password] Unexpected error:", error);
    return NextResponse.json({ error: FORGOT_PASSWORD_ERROR_MESSAGE }, { status: 500 });
  }
}
