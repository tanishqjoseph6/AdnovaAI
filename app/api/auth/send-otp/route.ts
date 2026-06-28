import { NextResponse } from "next/server";
import {
  checkLoginOtpEligibility,
  sendLoginOtpEmail,
} from "@/lib/auth/login-otp";
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
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const normalized = normalizeEmail(email);

    if (!isValidEmail(normalized)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
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

    const result = await sendLoginOtpEmail(normalized);
    if (!result.ok) {
      for (const bucketKey of failedLoginBuckets) {
        await consumeAuthRateLimit({
          action: "failed_login",
          bucketKey,
        });
      }

      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: "Login code sent. Check your inbox.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Unable to send login code. Please try again." },
      { status: 500 }
    );
  }
}
