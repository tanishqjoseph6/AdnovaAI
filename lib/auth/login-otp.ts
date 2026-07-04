import {
  LOGIN_OTP_NO_ACCOUNT_MESSAGE,
  LOGIN_OTP_UNVERIFIED_MESSAGE,
  mapAuthErrorMessage,
} from "@/lib/auth/errors";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
import { getAuthCallbackUrl } from "@/lib/auth/redirects";
import { normalizeEmail, isValidEmail } from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export { LOGIN_OTP_NO_ACCOUNT_MESSAGE, LOGIN_OTP_UNVERIFIED_MESSAGE };

export type LoginOtpEligibilityResult =
  | { allowed: true }
  | { allowed: false; message: string; status: 404 | 403 | 400 | 503 };

type EmailLoginEligibilityRow = {
  registered?: boolean;
  confirmed?: boolean;
};

export function getLoginOtpSendOptions() {
  return {
    shouldCreateUser: false as const,
    emailRedirectTo: getAuthCallbackUrl("/dashboard"),
  };
}

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
    authError("otp_eligibility", "Missing Supabase service role credentials");
    return {
      allowed: false,
      message: "Unable to send login code right now. Please try again later.",
      status: 503,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("email_login_eligibility", {
    p_email: normalized,
  });

  if (error) {
    authError("otp_eligibility", "RPC email_login_eligibility failed", {
      email: normalized,
      error: error.message,
    });
    return {
      allowed: false,
      message: "Unable to verify account status. Please try again.",
      status: 503,
    };
  }

  return evaluateLoginOtpEligibility(data as EmailLoginEligibilityRow | null);
}

export function evaluateLoginOtpEligibility(
  row: EmailLoginEligibilityRow | null | undefined
): LoginOtpEligibilityResult {
  if (!row?.registered) {
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
 * Sends a login OTP via Supabase Auth signInWithOtp (GoTrue).
 * Uses the official SDK — never raw fetch — with production redirect URLs.
 */
export async function sendLoginOtpEmail(email: string): Promise<SendLoginOtpResult> {
  const normalized = normalizeEmail(email);
  const options = getLoginOtpSendOptions();

  authLog("otp_send", "Dispatching login OTP", {
    email: normalized,
    emailRedirectTo: options.emailRedirectTo,
  });

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options,
    });

    if (error) {
      authWarn("otp_send", "Supabase signInWithOtp failed", {
        email: normalized,
        error: error.message,
        status: error.status,
      });

      return {
        ok: false,
        error: mapAuthErrorMessage(error.message),
        status:
          typeof error.status === "number" &&
          error.status >= 400 &&
          error.status < 500
            ? error.status
            : 400,
      };
    }

    authLog("otp_send", "Login OTP dispatched", { email: normalized });
    return { ok: true };
  } catch (error) {
    authError("otp_send", "Unexpected OTP send failure", {
      email: normalized,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      ok: false,
      error: "Unable to send login code. Please try again.",
      status: 500,
    };
  }
}
