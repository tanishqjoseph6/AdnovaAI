export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_SEND_WINDOW_SECONDS = 10 * 60;
export const OTP_MAX_SENDS_PER_WINDOW = 3;

export const OTP_EXPIRED_MESSAGE =
  "This code has expired. Please request a new one.";

export const OTP_INVALID_MESSAGE =
  "Invalid code. Please check and try again.";

export function isCompleteOtp(value: string): boolean {
  return new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);
}

export function sanitizeOtpDigit(value: string): string {
  return value.replace(/\D/g, "").slice(0, 1);
}

export function sanitizeOtpPaste(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}
