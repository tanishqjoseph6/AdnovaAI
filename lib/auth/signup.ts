import { DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/errors";
import { checkSignupEligibility } from "@/lib/auth/account-eligibility";
import { normalizeEmail, validateSignupInput } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export type SignupResult =
  | { ok: true; requiresVerification: true }
  | { ok: false; error: string; status: number };

export async function signUpWithEmailVerification(
  email: string,
  password: string,
  emailRedirectTo: string
): Promise<SignupResult> {
  const validation = validateSignupInput(email, password);
  if (!validation.ok) {
    return { ok: false, error: validation.error, status: 400 };
  }

  const normalizedEmail = normalizeEmail(email);
  const eligibility = await checkSignupEligibility(normalizedEmail);

  if (!eligibility.allowed) {
    return {
      ok: false,
      error: eligibility.message,
      status: eligibility.message === DUPLICATE_EMAIL_MESSAGE ? 409 : 400,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("already registered") ||
      message.includes("already been registered") ||
      message.includes("duplicate")
    ) {
      return {
        ok: false,
        error: DUPLICATE_EMAIL_MESSAGE,
        status: 409,
      };
    }

    return { ok: false, error: error.message, status: 400 };
  }

  if (data.user?.identities && data.user.identities.length === 0) {
    return {
      ok: false,
      error: DUPLICATE_EMAIL_MESSAGE,
      status: 409,
    };
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  return { ok: true, requiresVerification: true };
}
