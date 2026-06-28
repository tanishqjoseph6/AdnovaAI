import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isEmailVerified } from "@/lib/auth/email-verified";

type AuthSuccess = { user: User };
type AuthFailure = { response: NextResponse };

export async function requireAuthenticatedUser(
  supabase: SupabaseClient
): Promise<AuthSuccess | AuthFailure> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user };
}

export async function requireVerifiedUser(
  supabase: SupabaseClient
): Promise<AuthSuccess | AuthFailure> {
  const result = await requireAuthenticatedUser(supabase);

  if ("response" in result) {
    return result;
  }

  if (!isEmailVerified(result.user)) {
    return {
      response: NextResponse.json(
        {
          error: "Email verification required. Please confirm your email first.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      ),
    };
  }

  return result;
}
