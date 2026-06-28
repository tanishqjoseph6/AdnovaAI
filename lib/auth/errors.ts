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
