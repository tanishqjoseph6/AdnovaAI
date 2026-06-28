import { normalizeEmail, isValidEmail } from "@/lib/auth/validation";

export function normalizeClaimEmail(email: string): string {
  return normalizeEmail(email);
}

export function canAttemptFreeCreditClaim(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const normalized = normalizeClaimEmail(email);
  return isValidEmail(normalized);
}

export type FreeCreditClaimDecision =
  | { allowed: true; emailLower: string }
  | { allowed: false; reason: "missing_email" | "invalid_email" };

export function evaluateFreeCreditClaim(
  email: string | null | undefined
): FreeCreditClaimDecision {
  if (!email) {
    return { allowed: false, reason: "missing_email" };
  }

  const emailLower = normalizeClaimEmail(email);
  if (!isValidEmail(emailLower)) {
    return { allowed: false, reason: "invalid_email" };
  }

  return { allowed: true, emailLower };
}
