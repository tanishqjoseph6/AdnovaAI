const DUPLICATE_EMAIL_MESSAGE = "An account already exists with this email.";

const AUTH_ERROR_MAP: Record<string, string> = {
  "User already registered": DUPLICATE_EMAIL_MESSAGE,
  "A user with this email address has already been registered":
    DUPLICATE_EMAIL_MESSAGE,
  "Email not confirmed":
    "Please verify your email before signing in. Check your inbox for the confirmation link.",
  "Invalid login credentials":
    "Incorrect email or password. Please try again.",
  "Email rate limit exceeded":
    "Too many attempts. Please wait a few minutes and try again.",
  "Signup requires a valid password":
    "Please choose a stronger password.",
  "For security purposes, you can only request this once every 60 seconds":
    "Please wait a minute before requesting another reset email.",
  "Email link is invalid or has expired":
    "This reset link is invalid or has expired. Please request a new password reset.",
  "Token has expired or is invalid":
    "This code or link has expired. Please request a new one.",
  "otp expired":
    "This code has expired. Please request a new one.",
  "invalid otp":
    "Invalid code. Please check and try again.",
  "token has expired":
    "This code has expired. Please request a new one.",
  "signups not allowed":
    "No account found for this email. Please sign up first.",
};

export function mapAuthErrorMessage(message: string): string {
  const trimmed = message.trim();

  for (const [pattern, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (trimmed.toLowerCase().includes(pattern.toLowerCase())) {
      return friendly;
    }
  }

  return trimmed || "Something went wrong. Please try again.";
}

export { DUPLICATE_EMAIL_MESSAGE };
