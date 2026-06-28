import { NextResponse } from "next/server";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { isEmailVerified } from "@/lib/auth/email-verified";
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
    const password = typeof body?.password === "string" ? body.password : "";

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
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

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Unable to sign in. Please try again." },
      { status: 500 }
    );
  }
}
