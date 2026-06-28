export type AuthRateLimitAction =
  | "failed_login"
  | "otp_send"
  | "otp_verify"
  | "forgot_password"
  | "resend_verification";

export const AUTH_RATE_LIMITS = {
  failed_login: { maxAttempts: 10, windowSeconds: 15 * 60 },
  otp_send: { maxAttempts: 3, windowSeconds: 10 * 60 },
  otp_verify: { maxAttempts: 10, windowSeconds: 15 * 60 },
  forgot_password: { maxAttempts: 3, windowSeconds: 60 * 60 },
  resend_verification: { maxAttempts: 3, windowSeconds: 60 * 60 },
} as const satisfies Record<
  AuthRateLimitAction,
  { maxAttempts: number; windowSeconds: number }
>;

export const RATE_LIMIT_ERROR_CODE = "RATE_LIMITED";

const ACTION_LABELS: Record<AuthRateLimitAction, string> = {
  failed_login: "sign-in",
  otp_send: "verification code",
  otp_verify: "verification code",
  forgot_password: "password reset",
  resend_verification: "verification email",
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
