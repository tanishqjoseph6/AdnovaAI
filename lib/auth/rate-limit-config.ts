export type AuthRateLimitAction =
  | "signup"
  | "login"
  | "otp_send"
  | "forgot_password";

export const AUTH_RATE_LIMITS = {
  signup: { maxAttempts: 5, windowSeconds: 60 * 60 },
  login: { maxAttempts: 10, windowSeconds: 60 * 60 },
  otp_send: { maxAttempts: 3, windowSeconds: 10 * 60 },
  forgot_password: { maxAttempts: 3, windowSeconds: 60 * 60 },
} as const satisfies Record<
  AuthRateLimitAction,
  { maxAttempts: number; windowSeconds: number }
>;

export const RATE_LIMIT_ERROR_CODE = "RATE_LIMITED";

const ACTION_LABELS: Record<AuthRateLimitAction, string> = {
  signup: "sign-up",
  login: "sign-in",
  otp_send: "verification code",
  forgot_password: "password reset",
};

export function buildRateLimitBucketKey(
  prefix: "ip" | "email",
  value: string
): string {
  return `${prefix}:${value.trim().toLowerCase()}`;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function formatRateLimitMessage(
  retryAfterSeconds: number,
  action: AuthRateLimitAction
): string {
  const label = ACTION_LABELS[action];
  const retryAfter = Math.max(1, Math.ceil(retryAfterSeconds));

  if (retryAfter < 60) {
    return `Too many ${label} attempts. Please wait ${retryAfter} seconds and try again.`;
  }

  const minutes = Math.ceil(retryAfter / 60);

  if (minutes < 60) {
    return `Too many ${label} attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }

  const hours = Math.ceil(minutes / 60);
  return `Too many ${label} attempts. Please try again in ${hours} hour${hours === 1 ? "" : "s"}.`;
}

export function rateLimitResponseHeaders(
  retryAfterSeconds: number
): Record<string, string> {
  return {
    "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
  };
}
