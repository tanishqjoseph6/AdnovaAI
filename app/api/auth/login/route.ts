import { NextResponse } from "next/server";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
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
import { maybeRefillUserCredits } from "@/lib/credits/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const normalized = normalizeEmail(email);
    authLog("password_login", "Login requested", { email: normalized, ip });
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
      authWarn("password_login", "Login failed", {
        email: normalized,
        error: error.message,
      });

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

    authLog("password_login", "Login succeeded", { email: normalized });

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
    authError("password_login", "Unexpected login error", {
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unable to sign in. Please try again." },
      { status: 500 }
    );
  }
}
