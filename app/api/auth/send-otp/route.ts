import { NextResponse } from "next/server";
import {
  checkLoginOtpEligibility,
  sendLoginOtpEmail,
} from "@/lib/auth/login-otp";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
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

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const normalized = normalizeEmail(email);

    authLog("otp_send", "OTP send requested", { email: normalized, ip });

    if (!isValidEmail(normalized)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const otpSendBuckets = [
      buildRateLimitBucketKey("email", normalized),
      buildRateLimitBucketKey("ip", ip),
    ];

    for (const bucketKey of otpSendBuckets) {
      const status = await checkAuthRateLimit({
        action: "otp_send",
        bucketKey,
      });
      if (!status.allowed) {
        authWarn("otp_send", "OTP send rate limited", { email: normalized, ip });
        return rateLimitExceededResponse(status);
      }
    }

    const eligibility = await checkLoginOtpEligibility(normalized);
    if (!eligibility.allowed) {
      authWarn("otp_send", "OTP send blocked by eligibility", {
        email: normalized,
        reason: eligibility.message,
        status: eligibility.status,
      });

      return NextResponse.json(
        { error: eligibility.message },
        { status: eligibility.status }
      );
    }

    const result = await sendLoginOtpEmail(normalized);
    if (!result.ok) {
      authWarn("otp_send", "OTP send failed", {
        email: normalized,
        error: result.error,
      });

      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    for (const bucketKey of otpSendBuckets) {
      await consumeAuthRateLimit({
        action: "otp_send",
        bucketKey,
      });
    }

    authLog("otp_send", "OTP send succeeded", { email: normalized });

    return NextResponse.json({
      success: true,
      message: "✅ Login code sent. Check your inbox.",
    });
  } catch (error) {
    authError("otp_send", "Unexpected OTP send error", {
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unable to send login code. Please try again." },
      { status: 500 }
    );
  }
}
