import { NextResponse } from "next/server";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { isEmailVerified } from "@/lib/auth/email-verified";
import { checkLoginOtpEligibility } from "@/lib/auth/login-otp";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
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
import { maybeRefillUserCredits } from "@/lib/credits/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const normalized = normalizeEmail(email);

    authLog("otp_verify", "OTP verify requested", { email: normalized, ip });

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

    const otpVerifyBuckets = [
      buildRateLimitBucketKey("email", normalized),
      buildRateLimitBucketKey("ip", ip),
    ];

    for (const bucketKey of otpVerifyBuckets) {
      const status = await checkAuthRateLimit({
        action: "otp_verify",
        bucketKey,
      });
      if (!status.allowed) {
        authWarn("otp_verify", "OTP verify rate limited", { email: normalized, ip });
        return rateLimitExceededResponse(status);
      }
    }

    const eligibility = await checkLoginOtpEligibility(normalized);
    if (!eligibility.allowed) {
      authWarn("otp_verify", "OTP verify blocked by eligibility", {
        email: normalized,
        reason: eligibility.message,
      });

      return NextResponse.json(
        { error: eligibility.message },
        { status: eligibility.status }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalized,
      token,
      type: "email",
    });

    if (error) {
      for (const bucketKey of otpVerifyBuckets) {
        await consumeAuthRateLimit({
          action: "otp_verify",
          bucketKey,
        });
      }

      authWarn("otp_verify", "OTP verify failed", {
        email: normalized,
        error: error.message,
      });

      return NextResponse.json(
        { error: mapAuthErrorMessage(error.message) },
        { status: 401 }
      );
    }

    authLog("otp_verify", "OTP verify succeeded", {
      email: normalized,
      userId: data.user?.id,
    });

    let creditsRefilled = false;
    if (data.user && isEmailVerified(data.user)) {
      const refill = await maybeRefillUserCredits(data.user.id);
      creditsRefilled = refill.refilled === true;
    }

    return NextResponse.json({
      success: true,
      requiresEmailVerification: Boolean(
        data.user && !isEmailVerified(data.user)
      ),
      creditsRefilled,
    });
  } catch (error) {
    authError("otp_verify", "Unexpected OTP verify error", {
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unable to verify code. Please try again." },
      { status: 500 }
    );
  }
}
