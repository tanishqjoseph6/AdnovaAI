export const LOGIN_OTP_NO_ACCOUNT_MESSAGE =
  "No account found for this email. Please sign up first.";

export const LOGIN_OTP_UNVERIFIED_MESSAGE =
  "Please verify your email before signing in. Check your inbox or resend the verification email.";

const DUPLICATE_EMAIL_MESSAGE =
  "An account already exists with this email. Please log in.";

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
    LOGIN_OTP_NO_ACCOUNT_MESSAGE,
  "otp disabled":
    LOGIN_OTP_NO_ACCOUNT_MESSAGE,
  "duplicate_email":
    "An account already exists with this email. Please log in.",
};

const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";

function isClientSafeAuthMessage(message: string): boolean {
  if (message.length > 280) {
    return false;
  }

  return !/(?:pgrst|jwt|sql|exception|stack|violates|rpc|postgres|supabase|internal server)/i.test(
    message
  );
}

export function mapAuthErrorMessage(message: string): string {
  const trimmed = message.trim();

  for (const [pattern, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (trimmed.toLowerCase().includes(pattern.toLowerCase())) {
      return friendly;
    }
  }

  if (!trimmed) {
    return GENERIC_AUTH_ERROR;
  }

  if (isClientSafeAuthMessage(trimmed)) {
    return trimmed;
  }

  return GENERIC_AUTH_ERROR;
}

export { DUPLICATE_EMAIL_MESSAGE };
