import {
  LOGIN_OTP_NO_ACCOUNT_MESSAGE,
  LOGIN_OTP_UNVERIFIED_MESSAGE,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import { normalizeEmail, isValidEmail } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export { LOGIN_OTP_NO_ACCOUNT_MESSAGE, LOGIN_OTP_UNVERIFIED_MESSAGE };

export type LoginOtpEligibilityResult =
  | { allowed: true }
  | { allowed: false; message: string; status: 404 | 403 | 400 | 503 };

type EmailLoginEligibilityRow = {
  registered?: boolean;
  confirmed?: boolean;
};

function hasAdminCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function checkLoginOtpEligibility(
  email: string
): Promise<LoginOtpEligibilityResult> {
  const normalized = normalizeEmail(email);

  if (!isValidEmail(normalized)) {
    return {
      allowed: false,
      message: "Please enter a valid email address.",
      status: 400,
    };
  }

  if (!hasAdminCredentials()) {
    if (process.env.NODE_ENV === "production") {
      console.error("Login OTP eligibility check failed: missing service role key.");
      return {
        allowed: false,
        message: "Unable to send login code right now. Please try again later.",
        status: 503,
      };
    }

    return { allowed: true };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("email_login_eligibility", {
    p_email: normalized,
  });

  if (error) {
    console.error("Login OTP eligibility RPC failed:", error.message);
    return {
      allowed: false,
      message: "Unable to verify account status. Please try again.",
      status: 503,
    };
  }

  const row = (data ?? {}) as EmailLoginEligibilityRow;

  if (!row.registered) {
    return {
      allowed: false,
      message: LOGIN_OTP_NO_ACCOUNT_MESSAGE,
      status: 404,
    };
  }

  if (!row.confirmed) {
    return {
      allowed: false,
      message: LOGIN_OTP_UNVERIFIED_MESSAGE,
      status: 403,
    };
  }

  return { allowed: true };
}

type SendLoginOtpResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

/**
 * Sends a login OTP via GoTrue without signup redirect/data fields.
 * Signup uses signUp(); forgot password uses resetPasswordForEmail().
 */
export async function sendLoginOtpEmail(email: string): Promise<SendLoginOtpResult> {
  const normalized = normalizeEmail(email);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      error: "Unable to send login code. Please try again.",
      status: 500,
    };
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email: normalized,
      create_user: false,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    msg?: string;
    message?: string;
    error_description?: string;
  };

  if (!response.ok) {
    const raw =
      payload.msg ??
      payload.message ??
      payload.error_description ??
      "Unable to send login code.";

    return {
      ok: false,
      error: mapAuthErrorMessage(raw),
      status: response.status >= 400 && response.status < 500 ? response.status : 400,
    };
  }

  return { ok: true };
}
