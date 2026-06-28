import { createAdminClient } from "@/lib/supabase/admin";
import {
  AUTH_RATE_LIMITS,
  type AuthRateLimitAction,
  formatRateLimitMessage,
} from "@/lib/auth/rate-limit-config";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; message: string };

type MemoryBucket = {
  attemptCount: number;
  windowStartedAt: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();

function memoryBucketKey(bucketKey: string, action: AuthRateLimitAction): string {
  return `${action}:${bucketKey}`;
}

function consumeMemoryRateLimit(
  bucketKey: string,
  action: AuthRateLimitAction
): RateLimitResult {
  const config = AUTH_RATE_LIMITS[action];
  const key = memoryBucketKey(bucketKey, action);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const existing = memoryBuckets.get(key);

  if (!existing || now - existing.windowStartedAt >= windowMs) {
    memoryBuckets.set(key, { attemptCount: 1, windowStartedAt: now });
    return { allowed: true };
  }

  if (existing.attemptCount >= config.maxAttempts) {
    const retryAfterSeconds = Math.ceil(
      (existing.windowStartedAt + windowMs - now) / 1000
    );
    return {
      allowed: false,
      retryAfterSeconds,
      message: formatRateLimitMessage(retryAfterSeconds, action),
    };
  }

  existing.attemptCount += 1;
  memoryBuckets.set(key, existing);
  return { allowed: true };
}

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

type RpcRateLimitResult = {
  allowed?: boolean;
  retry_after_seconds?: number;
};

export async function consumeAuthRateLimit(input: {
  action: AuthRateLimitAction;
  bucketKey: string;
}): Promise<RateLimitResult> {
  const config = AUTH_RATE_LIMITS[input.action];

  if (!hasAdminCredentials()) {
    console.warn(
      `Auth rate limit using in-memory fallback for ${input.action}. Set SUPABASE_SERVICE_ROLE_KEY for production.`
    );
    return consumeMemoryRateLimit(input.bucketKey, input.action);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_auth_rate_limit", {
      p_bucket_key: input.bucketKey,
      p_action: input.action,
      p_max_attempts: config.maxAttempts,
      p_window_seconds: config.windowSeconds,
    });

    if (error) {
      console.error("Rate limit RPC failed:", error.message);
      return consumeMemoryRateLimit(input.bucketKey, input.action);
    }

    const payload = (data ?? {}) as RpcRateLimitResult;
    const allowed = payload.allowed !== false;
    const retryAfterSeconds =
      typeof payload.retry_after_seconds === "number"
        ? payload.retry_after_seconds
        : config.windowSeconds;

    if (allowed) {
      return { allowed: true };
    }

    return {
      allowed: false,
      retryAfterSeconds,
      message: formatRateLimitMessage(retryAfterSeconds, input.action),
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return consumeMemoryRateLimit(input.bucketKey, input.action);
  }
}

export async function enforceAuthRateLimit(input: {
  action: AuthRateLimitAction;
  bucketKey: string;
}): Promise<RateLimitResult> {
  return consumeAuthRateLimit(input);
}
