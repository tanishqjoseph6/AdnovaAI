import { MIN_PASSWORD_LENGTH } from "@/lib/auth/validation";
import { getPasswordResetCallbackUrl } from "@/lib/auth/redirects";

export function getPasswordResetRedirectUrl(): string {
  return getPasswordResetCallbackUrl();
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
  "🎉 Password updated successfully. Redirecting to login...";

export const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "✅ Password reset link sent. Please check your email.";

/** @deprecated Use FORGOT_PASSWORD_SUCCESS_MESSAGE */
export const FORGOT_PASSWORD_RESPONSE_MESSAGE = FORGOT_PASSWORD_SUCCESS_MESSAGE;

export const INVALID_EMAIL_MESSAGE = "Please enter a valid email address.";

export const FORGOT_PASSWORD_ERROR_MESSAGE =
  "Unable to send reset email. Please try again.";
