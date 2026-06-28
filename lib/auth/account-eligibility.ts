import { DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/errors";
import { normalizeEmail, isValidEmail } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export { DUPLICATE_EMAIL_MESSAGE as SIGNUP_BLOCKED_MESSAGE };

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export type SignupEligibilityResult =
  | { allowed: true }
  | { allowed: false; message: string };

export async function checkSignupEligibility(
  email: string
): Promise<SignupEligibilityResult> {
  const normalized = normalizeEmail(email);

  if (!isValidEmail(normalized)) {
    return { allowed: false, message: "Please enter a valid email address." };
  }

  if (!hasAdminCredentials()) {
    if (process.env.NODE_ENV === "production") {
      console.error("Signup eligibility check failed: missing service role key.");
      return {
        allowed: false,
        message: "Unable to create account right now. Please try again later.",
      };
    }

    return { allowed: true };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("email_is_available_for_signup", {
    p_email: normalized,
  });

  if (error) {
    console.error("Signup eligibility RPC failed:", error.message);
    return {
      allowed: false,
      message: "Unable to verify email availability. Please try again.",
    };
  }

  if (data === true) {
    return { allowed: true };
  }

  return { allowed: false, message: DUPLICATE_EMAIL_MESSAGE };
}

export async function isEmailAvailableForSignup(email: string): Promise<boolean> {
  const result = await checkSignupEligibility(email);
  return result.allowed;
}

export async function emailHasFreeCreditClaim(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);

  if (!isValidEmail(normalized) || !hasAdminCredentials()) {
    return false;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("email_has_free_credit_claim", {
    p_email: normalized,
  });

  if (error) {
    console.error("Free credit claim lookup failed:", error.message);
    return false;
  }

  return Boolean(data);
}
