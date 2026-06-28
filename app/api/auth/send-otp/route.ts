import { NextResponse } from "next/server";
import {
  checkLoginOtpEligibility,
  sendLoginOtpEmail,
} from "@/lib/auth/login-otp";
import {
  buildRateLimitBucketKey,
  getClientIp,
} from "@/lib/auth/rate-limit-config";
import { withAuthRateLimits } from "@/lib/auth/rate-limit-response";
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
    const rateLimited = await withAuthRateLimits([
      {
        action: "otp_send",
        bucketKey: buildRateLimitBucketKey("email", normalized),
      },
      {
        action: "otp_send",
        bucketKey: buildRateLimitBucketKey("ip", ip),
      },
    ]);

    if (rateLimited) {
      return rateLimited;
    }

    const eligibility = await checkLoginOtpEligibility(normalized);
    if (!eligibility.allowed) {
      return NextResponse.json(
        { error: eligibility.message },
        { status: eligibility.status }
      );
    }

    const result = await sendLoginOtpEmail(normalized);
    if (!result.ok) {
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
