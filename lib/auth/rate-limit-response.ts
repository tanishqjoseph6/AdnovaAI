import { NextResponse } from "next/server";
import {
  RATE_LIMIT_ERROR_CODE,
  rateLimitResponseHeaders,
  type AuthRateLimitAction,
} from "@/lib/auth/rate-limit-config";
import {
  enforceAuthRateLimit,
  type RateLimitResult,
} from "@/lib/auth/rate-limit";

export function rateLimitExceededResponse(
  result: Extract<RateLimitResult, { allowed: false }>
): NextResponse {
  return NextResponse.json(
    {
      error: result.message,
      code: RATE_LIMIT_ERROR_CODE,
    },
    {
      status: 429,
      headers: rateLimitResponseHeaders(result.retryAfterSeconds),
    }
  );
}

export async function withAuthRateLimit(
  action: AuthRateLimitAction,
  bucketKey: string
): Promise<NextResponse | null> {
  const result = await enforceAuthRateLimit({ action, bucketKey });

  if (!result.allowed) {
    return rateLimitExceededResponse(result);
  }

  return null;
}
