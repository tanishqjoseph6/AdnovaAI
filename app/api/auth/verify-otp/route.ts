import { NextResponse } from "next/server";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { isEmailVerified } from "@/lib/auth/email-verified";
import { checkLoginOtpEligibility } from "@/lib/auth/login-otp";
import { isCompleteOtp } from "@/lib/auth/otp-login";
import {
  checkAuthRateLimit,
  consumeAuthRateLimit,
} from "@/lib/auth/rate-limit";
import {
  buildRateLimitBucketKey,
  getClientIp,
} from "@/lib/auth/rate-limit-config";
import { rateLimitExceededResponse } from "@/lib/auth/rate-limit-response";
import { isValidEmail, normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const normalized = normalizeEmail(email);

    if (!isValidEmail(normalized)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!isCompleteOtp(token)) {
      return NextResponse.json(
        { error: "Please enter the complete 6-digit code." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const failedLoginBuckets = [
      buildRateLimitBucketKey("email", normalized),
      buildRateLimitBucketKey("ip", ip),
    ];

    for (const bucketKey of failedLoginBuckets) {
      const status = await checkAuthRateLimit({
        action: "failed_login",
        bucketKey,
      });
      if (!status.allowed) {
        return rateLimitExceededResponse(status);
      }
    }

    const eligibility = await checkLoginOtpEligibility(normalized);
    if (!eligibility.allowed) {
      for (const bucketKey of failedLoginBuckets) {
        await consumeAuthRateLimit({
          action: "failed_login",
          bucketKey,
        });
      }

      return NextResponse.json(
        { error: eligibility.message },
        { status: eligibility.status }
      );
    }

    const supabase = await createClient();
    // Login OTP only — signup uses signUp(), password reset uses resetPasswordForEmail().
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalized,
      token,
      type: "email",
    });

    if (error) {
      for (const bucketKey of failedLoginBuckets) {
        await consumeAuthRateLimit({
          action: "failed_login",
          bucketKey,
        });
      }

      return NextResponse.json(
        { error: mapAuthErrorMessage(error.message) },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresEmailVerification: Boolean(
        data.user && !isEmailVerified(data.user)
      ),
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Unable to verify code. Please try again." },
      { status: 500 }
    );
  }
}
