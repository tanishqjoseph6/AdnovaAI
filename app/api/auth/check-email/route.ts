import { NextResponse } from "next/server";
import { checkSignupEligibility } from "@/lib/auth/account-eligibility";
import {
  buildRateLimitBucketKey,
  getClientIp,
} from "@/lib/auth/rate-limit-config";
import { withAuthRateLimit } from "@/lib/auth/rate-limit-response";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimited = await withAuthRateLimit(
      "signup",
      buildRateLimitBucketKey("ip", ip)
    );
    if (rateLimited) {
      return rateLimited;
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const eligibility = await checkSignupEligibility(email);

    return NextResponse.json({
      available: eligibility.allowed,
      message: eligibility.allowed ? null : eligibility.message,
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { available: false, message: "Unable to verify email availability." },
      { status: 500 }
    );
  }
}
