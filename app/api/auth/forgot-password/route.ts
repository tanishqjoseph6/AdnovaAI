import { NextResponse } from "next/server";
import {
  FORGOT_PASSWORD_ERROR_MESSAGE,
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  getPasswordResetRedirectUrl,
  INVALID_EMAIL_MESSAGE,
} from "@/lib/auth/password-reset";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
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
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const normalized = normalizeEmail(email);

    authLog("forgot_password", "Password reset requested", { email: normalized, ip });

    if (!normalized) {
      return NextResponse.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
    }

    if (!isValidEmail(normalized)) {
      authLog("forgot_password", "Invalid email format", { email: normalized });
      return NextResponse.json({ error: INVALID_EMAIL_MESSAGE }, { status: 400 });
    }

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
      authWarn("forgot_password", "Password reset rate limited", {
        email: normalized,
        ip,
      });
      return rateLimited;
    }

    const redirectTo = getPasswordResetRedirectUrl(new URL(request.url).origin);
    const supabase = await createClient();

    authLog("forgot_password", "Sending reset email via Supabase", {
      email: normalized,
      redirectTo,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo,
    });

    if (error) {
      authWarn("forgot_password", "Reset email not delivered", {
        email: normalized,
        redirectTo,
        error: error.message,
      });
      // Do not reveal whether the account exists.
      return forgotPasswordSuccessResponse();
    }

    authLog("forgot_password", "Reset email dispatched", {
      email: normalized,
      redirectTo,
    });
    return forgotPasswordSuccessResponse();
  } catch (error) {
    authError("forgot_password", "Unexpected password reset error", {
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: FORGOT_PASSWORD_ERROR_MESSAGE }, { status: 500 });
  }
}
