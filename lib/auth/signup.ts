import { DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/errors";
import { normalizeEmail, validateSignupInput } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SignupResult =
  | { ok: true; requiresVerification: true }
  | { ok: false; error: string; status: number };

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function emailExistsInProfiles(email: string): Promise<boolean> {
  if (!hasAdminCredentials()) {
    return false;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Profile email lookup failed:", error);
    return false;
  }

  return Boolean(data);
}

async function emailExistsInAuth(email: string): Promise<boolean> {
  if (!hasAdminCredentials()) {
    return false;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("email_is_registered", {
    p_email: email,
  });

  if (error) {
    console.error("Auth email lookup failed:", error);
    return false;
  }

  return Boolean(data);
}

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

  if (await emailExistsInProfiles(normalizedEmail)) {
    return {
      ok: false,
      error: DUPLICATE_EMAIL_MESSAGE,
      status: 409,
    };
  }

  if (await emailExistsInAuth(normalizedEmail)) {
    return {
      ok: false,
      error: DUPLICATE_EMAIL_MESSAGE,
      status: 409,
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
      message.includes("already been registered")
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
