import { NextResponse } from "next/server";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import {
  buildRateLimitBucketKey,
  getClientIp,
} from "@/lib/auth/rate-limit-config";
import { withAuthRateLimit } from "@/lib/auth/rate-limit-response";
import { signUpWithEmailVerification } from "@/lib/auth/signup";

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

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const result = await signUpWithEmailVerification(
      email,
      password,
      `${origin}/auth/callback?next=/dashboard`
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: mapAuthErrorMessage(result.error) },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Check your email to confirm your account before signing in.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}
