import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";

export function getPasswordResetRedirectUrl(origin: string): string {
  return `${origin}/auth/callback?next=/reset-password`;
}

export function validateNewPassword(
  password: string,
  confirmPassword: string
): { ok: true } | { ok: false; error: string } {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }

  return { ok: true };
}

export const RESET_LINK_EXPIRED_MESSAGE =
  "This reset link is invalid or has expired. Please request a new password reset.";

export const RESET_SUCCESS_MESSAGE =
  "Your password has been updated. You can now sign in.";
